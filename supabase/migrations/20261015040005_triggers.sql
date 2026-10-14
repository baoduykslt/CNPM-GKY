-- =====================================================================
-- RoomConnect - Migration 0005
-- Mục đích: Triggers và functions
--   - set_updated_at: tự cập nhật updated_at
--   - handle_new_user: tạo profile + role member khi signup
--   - log_post_status_change: ghi log khi status thay đổi
--   - check_comment_depth: đảm bảo nested tối đa 1 cấp
-- =====================================================================

-- =====================================================================
-- Function: set_updated_at
-- Tự động set updated_at = now() khi UPDATE
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function: tự set updated_at khi UPDATE';

-- Áp dụng cho các bảng có updated_at
CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- Function: handle_new_user
-- Khi có user mới trong auth.users:
--   1. Tạo dòng trong profiles
--   2. Gán role 'member' mặc định
-- Username được sinh từ email hoặc metadata. Nếu trùng thì thêm suffix.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_base_username text;
  v_username      text;
  v_suffix        int := 0;
  v_full_name     text;
BEGIN
  -- Lấy username gợi ý: ưu tiên metadata.username, fallback email prefix
  v_base_username := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- Chuẩn hóa: lowercase, chỉ giữ a-z 0-9 _
  v_base_username := lower(v_base_username);
  v_base_username := regexp_replace(v_base_username, '[^a-z0-9_]', '_', 'g');

  -- Đảm bảo độ dài 3-30
  IF char_length(v_base_username) < 3 THEN
    v_base_username := v_base_username || '_' || substr(NEW.id::text, 1, 6);
  END IF;
  IF char_length(v_base_username) > 30 THEN
    v_base_username := substr(v_base_username, 1, 30);
  END IF;

  v_username := v_base_username;

  -- Nếu username trùng, thêm _1, _2, ...
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_suffix := v_suffix + 1;
    v_username := substr(v_base_username, 1, 27) || '_' || v_suffix;
  END LOOP;

  -- Lấy full_name từ metadata nếu có
  v_full_name := NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), '');

  -- Tạo profile
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (NEW.id, v_username, v_full_name);

  -- Gán role 'member' mặc định
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Tự tạo profile + gán role member khi có auth.users mới';

-- Trigger trên auth.users (chạy sau khi user được tạo)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- Function: log_post_status_change
-- Ghi vào audit_logs mỗi khi post đổi status
-- (Dùng làm history, không thay thế post_reviews)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.log_post_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (
      auth.uid(),
      'post.status_change',
      'post',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'author_id', NEW.author_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_post_status_change() IS 'Ghi audit log khi post đổi status';

CREATE TRIGGER trg_posts_log_status_change
  AFTER UPDATE OF status ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_post_status_change();

-- =====================================================================
-- Function: check_comment_depth
-- Đảm bảo reply chỉ 1 cấp: nếu parent đã có parent_id → gán lại về
-- parent gốc thay vì báo lỗi (nhẹ nhàng hơn cho UX).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.flatten_comment_parent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_parent_parent uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Đảm bảo parent tồn tại cùng post
  SELECT parent_id INTO v_parent_parent
  FROM public.comments
  WHERE id = NEW.parent_id AND post_id = NEW.post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'parent_id không hợp lệ hoặc không thuộc cùng bài đăng';
  END IF;

  -- Nếu parent đã là reply → gán về parent gốc
  IF v_parent_parent IS NOT NULL THEN
    NEW.parent_id := v_parent_parent;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.flatten_comment_parent() IS 'Nested bình luận tối đa 1 cấp, tự động gộp về parent gốc';

CREATE TRIGGER trg_comments_flatten_parent
  BEFORE INSERT OR UPDATE OF parent_id ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.flatten_comment_parent();

-- =====================================================================
-- Function: prevent_author_self_approve
-- Chặn member tự chuyển post từ pending → published
-- (Bảo vệ BR-03 ở tầng DB, không chỉ RLS)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.prevent_author_self_approve()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_privileged boolean;
BEGIN
  -- Nếu status không đổi hoặc không phải transition pending → published/rejected
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Chỉ chặn transition từ pending sang published/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('published', 'rejected') THEN
    -- Kiểm tra user hiện tại có role moderator/admin không
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('moderator', 'admin')
    ) INTO v_is_privileged;

    IF NOT v_is_privileged THEN
      RAISE EXCEPTION 'Chỉ moderator hoặc admin mới được duyệt hoặc từ chối bài đăng';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_author_self_approve() IS 'Bảo vệ BR-03: chỉ mod/admin mới duyệt được bài';

CREATE TRIGGER trg_posts_prevent_self_approve
  BEFORE UPDATE OF status ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_author_self_approve();

-- =====================================================================
-- Function: increment_post_view
-- Tăng view_count của post — gọi qua RPC từ client
-- SECURITY DEFINER để bypass RLS (view không cần đăng nhập)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = p_post_id
    AND status = 'published'
    AND deleted_at IS NULL;
END;
$$;

COMMENT ON FUNCTION public.increment_post_view(uuid) IS 'RPC tăng view cho post đã publish';

GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO anon, authenticated;

-- =====================================================================
-- Function: is_admin / is_moderator
-- Helper để dùng trong RLS policies
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('moderator', 'admin')
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Helper: user hiện tại có role admin không';
COMMENT ON FUNCTION public.is_moderator() IS 'Helper: user hiện tại có role moderator hoặc admin không';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO authenticated;

-- =====================================================================
-- Kết thúc migration 0005
-- =====================================================================