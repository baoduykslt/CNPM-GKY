-- =====================================================================
-- RoomConnect - Migration 0006
-- Mục đích: Bật RLS và định nghĩa policies cho toàn bộ bảng
-- Nguyên tắc:
--   1. Mặc định DENY tất cả. Chỉ cho phép khi có policy khớp.
--   2. `auth.uid()` = UUID user đang đăng nhập, NULL nếu chưa.
--   3. Dùng helper `is_admin()` / `is_moderator()` thay vì query lặp.
--   4. Service role (backend, admin scripts) bypass RLS tự động.
-- =====================================================================

-- Bật RLS cho toàn bộ bảng public
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restrictions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_revisions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_amenities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- BẢNG: profiles
-- =====================================================================
-- Ai cũng đọc được profile (để hiển thị tên tác giả, avatar)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- Chỉ user tự sửa profile của mình
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Không ai INSERT trực tiếp (trigger handle_new_user làm việc đó)
-- Không ai DELETE (CASCADE từ auth.users khi admin xoá user)

-- =====================================================================
-- BẢNG: user_roles
-- =====================================================================
-- Ai cũng xem được role (cần biết ai là mod/admin)
CREATE POLICY "user_roles_select_public"
  ON public.user_roles FOR SELECT
  USING (true);

-- Chỉ admin được cấp/thu role
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (public.is_admin());

-- =====================================================================
-- BẢNG: user_restrictions
-- =====================================================================
-- User xem được hạn chế của mình, admin/mod xem được hết
CREATE POLICY "user_restrictions_select_own_or_staff"
  ON public.user_restrictions FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_moderator()
  );

-- Chỉ admin được tạo/sửa/xoá hạn chế
CREATE POLICY "user_restrictions_insert_admin"
  ON public.user_restrictions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "user_restrictions_update_admin"
  ON public.user_restrictions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_restrictions_delete_admin"
  ON public.user_restrictions FOR DELETE
  USING (public.is_admin());

-- =====================================================================
-- BẢNG: posts
-- =====================================================================
-- SELECT:
--   - Guest/member đọc được bài published, còn hiệu lực, chưa xoá, available
--   - Tác giả đọc được bài của mình mọi trạng thái
--   - Mod/admin đọc được mọi bài
CREATE POLICY "posts_select_public_published"
  ON public.posts FOR SELECT
  USING (
    (
      status = 'published'
      AND deleted_at IS NULL
      AND availability_status = 'available'
      AND (expires_at IS NULL OR expires_at > now())
    )
    OR auth.uid() = author_id
    OR public.is_moderator()
  );

-- INSERT: user đã đăng nhập, không bị restriction post_ban/full_ban
CREATE POLICY "posts_insert_own"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_restrictions
      WHERE user_id = auth.uid()
        AND restriction_type IN ('post_ban', 'full_ban')
        AND (ends_at IS NULL OR ends_at > now())
    )
  );

-- UPDATE:
--   - Tác giả sửa bài của mình (kể cả draft/rejected)
--   - Mod/admin sửa mọi bài (duyệt, từ chối, ẩn)
-- Lưu ý: transition status pending→published đã bị trigger chặn nếu không phải mod/admin
CREATE POLICY "posts_update_own_or_staff"
  ON public.posts FOR UPDATE
  USING (
    auth.uid() = author_id
    OR public.is_moderator()
  )
  WITH CHECK (
    auth.uid() = author_id
    OR public.is_moderator()
  );

-- DELETE: chỉ admin xoá cứng. Member "xoá" bằng cách set deleted_at.
CREATE POLICY "posts_delete_admin_only"
  ON public.posts FOR DELETE
  USING (public.is_admin());

-- =====================================================================
-- BẢNG: post_revisions
-- =====================================================================
-- Tác giả xem revision của bài mình, mod/admin xem được hết
CREATE POLICY "post_revisions_select_own_or_staff"
  ON public.post_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_revisions.post_id AND author_id = auth.uid()
    )
    OR public.is_moderator()
  );

-- Tác giả tạo revision cho bài của mình
CREATE POLICY "post_revisions_insert_own"
  ON public.post_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_revisions.post_id AND author_id = auth.uid()
    )
  );

-- Chỉ mod/admin cập nhật trạng thái revision (duyệt/từ chối)
CREATE POLICY "post_revisions_update_staff"
  ON public.post_revisions FOR UPDATE
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

-- Tác giả có thể xoá revision pending của mình (huỷ chỉnh sửa)
CREATE POLICY "post_revisions_delete_own_pending"
  ON public.post_revisions FOR DELETE
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_revisions.post_id AND author_id = auth.uid()
    )
  );

-- =====================================================================
-- BẢNG: post_images
-- =====================================================================
-- Ai cũng xem được ảnh của bài published
CREATE POLICY "post_images_select_public"
  ON public.post_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id
        AND (
          (status = 'published' AND deleted_at IS NULL)
          OR author_id = auth.uid()
          OR public.is_moderator()
        )
    )
  );

-- Tác giả thêm ảnh cho bài của mình
CREATE POLICY "post_images_insert_own"
  ON public.post_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id AND author_id = auth.uid()
    )
  );

-- Tác giả sửa metadata ảnh bài mình
CREATE POLICY "post_images_update_own"
  ON public.post_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id AND author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id AND author_id = auth.uid()
    )
  );

-- Tác giả xoá ảnh bài mình
CREATE POLICY "post_images_delete_own"
  ON public.post_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_images.post_id AND author_id = auth.uid()
    )
  );

-- =====================================================================
-- BẢNG: amenities
-- =====================================================================
-- Ai cũng xem tiện nghi active
CREATE POLICY "amenities_select_active_public"
  ON public.amenities FOR SELECT
  USING (is_active = true OR public.is_moderator());

-- Chỉ admin CRUD
CREATE POLICY "amenities_insert_admin"
  ON public.amenities FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "amenities_update_admin"
  ON public.amenities FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "amenities_delete_admin"
  ON public.amenities FOR DELETE
  USING (public.is_admin());

-- =====================================================================
-- BẢNG: post_amenities
-- =====================================================================
CREATE POLICY "post_amenities_select_public"
  ON public.post_amenities FOR SELECT
  USING (true);

CREATE POLICY "post_amenities_insert_own"
  ON public.post_amenities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_amenities.post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "post_amenities_delete_own"
  ON public.post_amenities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_amenities.post_id AND author_id = auth.uid()
    )
  );

-- =====================================================================
-- BẢNG: post_reviews
-- =====================================================================
-- Tác giả bài xem được review của bài mình, mod/admin xem được hết
CREATE POLICY "post_reviews_select_own_or_staff"
  ON public.post_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_reviews.post_id AND author_id = auth.uid()
    )
    OR public.is_moderator()
  );

-- Chỉ mod/admin tạo review
CREATE POLICY "post_reviews_insert_staff"
  ON public.post_reviews FOR INSERT
  WITH CHECK (public.is_moderator() AND moderator_id = auth.uid());

-- Không UPDATE/DELETE review (lịch sử bất biến)

-- =====================================================================
-- BẢNG: post_likes
-- =====================================================================
CREATE POLICY "post_likes_select_public"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "post_likes_insert_own"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_likes_delete_own"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- BẢNG: favorites
-- =====================================================================
-- Chỉ chủ sở hữu xem favorites của mình (riêng tư)
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- BẢNG: comments
-- =====================================================================
-- Ai cũng xem comment chưa xoá, chưa ẩn
CREATE POLICY "comments_select_public"
  ON public.comments FOR SELECT
  USING (
    (deleted_at IS NULL AND is_hidden = false)
    OR auth.uid() = author_id
    OR public.is_moderator()
  );

CREATE POLICY "comments_insert_authenticated"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_restrictions
      WHERE user_id = auth.uid()
        AND restriction_type = 'full_ban'
        AND (ends_at IS NULL OR ends_at > now())
    )
  );

-- Tác giả sửa comment của mình. Mod/admin sửa được (ẩn comment).
CREATE POLICY "comments_update_own_or_staff"
  ON public.comments FOR UPDATE
  USING (
    auth.uid() = author_id
    OR public.is_moderator()
  )
  WITH CHECK (
    auth.uid() = author_id
    OR public.is_moderator()
  );

-- Xoá cứng: chỉ admin. Member xoá mềm bằng cách set deleted_at.
CREATE POLICY "comments_delete_admin_only"
  ON public.comments FOR DELETE
  USING (public.is_admin());

-- =====================================================================
-- BẢNG: reports
-- =====================================================================
-- Người báo cáo xem report của mình. Mod/admin xem hết.
CREATE POLICY "reports_select_own_or_staff"
  ON public.reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR public.is_moderator()
  );

-- Ai đăng nhập cũng tạo report được
CREATE POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Chỉ mod/admin xử lý report
CREATE POLICY "reports_update_staff"
  ON public.reports FOR UPDATE
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

-- Không xoá report

-- =====================================================================
-- BẢNG: notifications
-- =====================================================================
-- Chỉ user xem được thông báo của mình
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Update: chỉ đánh dấu đã đọc (is_read) — không đổi user_id, type, ...
CREATE POLICY "notifications_update_own_read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert: chỉ system (SECURITY DEFINER trigger) hoặc service role.
-- Không cho user tự tạo thông báo cho người khác.
-- (Không cần policy INSERT vì mặc định DENY.)

-- Delete: user xoá thông báo của mình
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- BẢNG: audit_logs
-- =====================================================================
-- Chỉ admin xem được
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Không INSERT/UPDATE/DELETE qua API
-- (chỉ SECURITY DEFINER functions mới ghi được, ví dụ log_post_status_change)

-- =====================================================================
-- Kết thúc migration 0006
-- Kiểm tra nhanh: SELECT tablename, COUNT(*) FROM pg_policies
--                WHERE schemaname = 'public' GROUP BY tablename;
-- =====================================================================