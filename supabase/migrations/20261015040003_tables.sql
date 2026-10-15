-- =====================================================================
-- RoomConnect - Migration 0003
-- Mục đích: Tạo toàn bộ bảng dữ liệu
-- Thứ tự quan trọng: profiles phải trước user_roles, posts phải trước
--                     post_images / post_reviews / comments / ...
-- =====================================================================

-- =====================================================================
-- Bảng: profiles
-- Hồ sơ người dùng, liên kết 1-1 với auth.users
-- =====================================================================
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      extensions.citext NOT NULL UNIQUE,
  full_name     text,
  phone         text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_username_format
    CHECK (username::text ~ '^[a-z0-9_]{3,30}$'),
  CONSTRAINT profiles_full_name_length
    CHECK (full_name IS NULL OR char_length(full_name) BETWEEN 1 AND 100),
  CONSTRAINT profiles_phone_format
    CHECK (phone IS NULL OR phone ~ '^(\+84|0)[0-9]{9,10}$'),
  CONSTRAINT profiles_avatar_url_length
    CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
  CONSTRAINT profiles_bio_length
    CHECK (bio IS NULL OR char_length(bio) <= 500)
);

COMMENT ON TABLE public.profiles IS 'Hồ sơ người dùng, 1-1 với auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Username lowercase, 3-30 ký tự, unique không phân biệt hoa thường';
COMMENT ON COLUMN public.profiles.phone IS 'SĐT Việt Nam: bắt đầu bằng 0 hoặc +84';

-- =====================================================================
-- Bảng: user_roles
-- Vai trò người dùng (n-n với profiles)
-- =====================================================================
CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_roles_unique UNIQUE (user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Vai trò người dùng, một user có thể có nhiều vai trò';

-- =====================================================================
-- Bảng: user_restrictions
-- Hạn chế tài khoản có thời hạn
-- =====================================================================
CREATE TABLE public.user_restrictions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restriction_type public.restriction_type NOT NULL,
  reason           text NOT NULL,
  starts_at        timestamptz NOT NULL DEFAULT now(),
  ends_at          timestamptz,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_restrictions_reason_length
    CHECK (char_length(reason) BETWEEN 1 AND 500),
  CONSTRAINT user_restrictions_dates_valid
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

COMMENT ON TABLE public.user_restrictions IS 'Hạn chế tài khoản: post_ban / login_ban / full_ban. ends_at NULL = vĩnh viễn';

-- =====================================================================
-- Bảng: posts
-- Bài đăng cho thuê phòng
-- =====================================================================
CREATE TABLE public.posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title               text NOT NULL,
  description         text NOT NULL,
  price               bigint NOT NULL,
  area                numeric(6,2) NOT NULL,
  address             text NOT NULL,
  province            text NOT NULL,
  ward                text NOT NULL,
  room_type           public.room_type NOT NULL,
  status              public.post_status NOT NULL DEFAULT 'draft',
  availability_status public.availability_status NOT NULL DEFAULT 'available',
  view_count          int NOT NULL DEFAULT 0,
  submitted_at        timestamptz,
  published_at        timestamptz,
  expires_at          timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT posts_title_length
    CHECK (char_length(title) BETWEEN 10 AND 200),
  CONSTRAINT posts_description_length
    CHECK (char_length(description) BETWEEN 30 AND 5000),
  CONSTRAINT posts_price_positive
    CHECK (price > 0),
  CONSTRAINT posts_area_positive
    CHECK (area > 0),
  CONSTRAINT posts_view_count_non_negative
    CHECK (view_count >= 0),
  CONSTRAINT posts_address_length
    CHECK (char_length(address) BETWEEN 1 AND 200),
  CONSTRAINT posts_province_length
    CHECK (char_length(province) BETWEEN 1 AND 100),
  CONSTRAINT posts_ward_length
    CHECK (char_length(ward) BETWEEN 1 AND 100),
  CONSTRAINT posts_expires_after_published
    CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at > published_at)
);

COMMENT ON TABLE public.posts IS 'Bài đăng cho thuê phòng. deleted_at = xoá mềm';
COMMENT ON COLUMN public.posts.price IS 'Giá thuê theo tháng, đơn vị VNĐ';
COMMENT ON COLUMN public.posts.area IS 'Diện tích m², tối đa 9999.99';

-- =====================================================================
-- Bảng: post_revisions
-- Bản chỉnh sửa chờ duyệt của bài đã published (chỉ text fields)
-- =====================================================================
CREATE TABLE public.post_revisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text NOT NULL,
  price        bigint NOT NULL,
  area         numeric(6,2) NOT NULL,
  address      text NOT NULL,
  province     text NOT NULL,
  ward         text NOT NULL,
  room_type    public.room_type NOT NULL,
  status       public.revision_status NOT NULL DEFAULT 'pending',
  reviewer_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz,

  CONSTRAINT post_revisions_title_length
    CHECK (char_length(title) BETWEEN 10 AND 200),
  CONSTRAINT post_revisions_description_length
    CHECK (char_length(description) BETWEEN 30 AND 5000),
  CONSTRAINT post_revisions_price_positive
    CHECK (price > 0),
  CONSTRAINT post_revisions_area_positive
    CHECK (area > 0)
);

COMMENT ON TABLE public.post_revisions IS 'Bản chỉnh sửa bài đã published. Khi duyệt → copy vào posts, xoá dòng này. KHÔNG chứa ảnh.';

-- =====================================================================
-- Bảng: post_images
-- Ảnh của bài đăng, lưu storage path (không lưu base64)
-- =====================================================================
CREATE TABLE public.post_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text     text,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT post_images_storage_path_unique
    UNIQUE (post_id, storage_path),
  CONSTRAINT post_images_storage_path_length
    CHECK (char_length(storage_path) BETWEEN 1 AND 500),
  CONSTRAINT post_images_alt_text_length
    CHECK (alt_text IS NULL OR char_length(alt_text) <= 200),
  CONSTRAINT post_images_sort_order_non_negative
    CHECK (sort_order >= 0)
);

COMMENT ON TABLE public.post_images IS 'Metadata ảnh của bài. File thật lưu trong bucket post-images';

-- =====================================================================
-- Bảng: amenities
-- Danh mục tiện nghi (điều hoà, wifi, ...)
-- =====================================================================
CREATE TABLE public.amenities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  slug       extensions.citext NOT NULL UNIQUE,
  icon       text,
  category   text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT amenities_name_length
    CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT amenities_slug_format
    CHECK (slug::text ~ '^[a-z0-9-]{2,50}$'),
  CONSTRAINT amenities_icon_length
    CHECK (icon IS NULL OR char_length(icon) <= 100),
  CONSTRAINT amenities_category_length
    CHECK (category IS NULL OR char_length(category) <= 100)
);

COMMENT ON TABLE public.amenities IS 'Danh mục tiện nghi do admin quản lý';
COMMENT ON COLUMN public.amenities.slug IS 'Slug dùng cho URL và filter, lowercase';

-- =====================================================================
-- Bảng: post_amenities
-- Bảng trung gian n-n giữa posts và amenities
-- =====================================================================
CREATE TABLE public.post_amenities (
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, amenity_id)
);

COMMENT ON TABLE public.post_amenities IS 'Tiện nghi của bài đăng (n-n)';

-- =====================================================================
-- Bảng: post_reviews
-- Lịch sử kiểm duyệt bài đăng
-- =====================================================================
CREATE TABLE public.post_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  revision_id  uuid REFERENCES public.post_revisions(id) ON DELETE CASCADE,
  moderator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       public.review_action NOT NULL,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT post_reviews_reason_required
    CHECK (action != 'rejected' OR (reason IS NOT NULL AND char_length(reason) BETWEEN 1 AND 1000)),
  CONSTRAINT post_reviews_reason_length
    CHECK (reason IS NULL OR char_length(reason) <= 1000)
);

COMMENT ON TABLE public.post_reviews IS 'Lịch sử kiểm duyệt. reason bắt buộc khi action = rejected';

-- =====================================================================
-- Bảng: post_likes
-- =====================================================================
CREATE TABLE public.post_likes (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, post_id)
);

COMMENT ON TABLE public.post_likes IS 'Lượt thả tim. Mỗi user chỉ like 1 lần / bài';

-- =====================================================================
-- Bảng: favorites
-- =====================================================================
CREATE TABLE public.favorites (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, post_id)
);

COMMENT ON TABLE public.favorites IS 'Bài đăng yêu thích của user';

-- =====================================================================
-- Bảng: comments
-- Bình luận và trả lời (nested 1 cấp qua parent_id)
-- =====================================================================
CREATE TABLE public.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id  uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content    text NOT NULL,
  is_hidden  boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT comments_content_length
    CHECK (char_length(content) BETWEEN 1 AND 1000),
  CONSTRAINT comments_no_self_parent
    CHECK (parent_id IS NULL OR parent_id != id)
);

COMMENT ON TABLE public.comments IS 'Bình luận. parent_id NULL = comment gốc. author_id SET NULL khi user xoá (giữ comment)';

-- =====================================================================
-- Bảng: reports
-- Báo cáo bài đăng / bình luận / user
-- =====================================================================
CREATE TABLE public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type     public.report_target NOT NULL,
  target_id       uuid NOT NULL,
  reason          text NOT NULL,
  description     text,
  status          public.report_status NOT NULL DEFAULT 'pending',
  resolved_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reports_reason_length
    CHECK (char_length(reason) BETWEEN 1 AND 200),
  CONSTRAINT reports_description_length
    CHECK (description IS NULL OR char_length(description) <= 2000),
  CONSTRAINT reports_resolution_note_length
    CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 1000)
);

COMMENT ON TABLE public.reports IS 'Báo cáo vi phạm. target_id tham chiếu động tới post/comment/user tuỳ target_type';

-- =====================================================================
-- Bảng: notifications
-- Thông báo cho user
-- =====================================================================
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  title      text NOT NULL,
  message    text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_title_length
    CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT notifications_message_length
    CHECK (message IS NULL OR char_length(message) <= 1000),
  CONSTRAINT notifications_link_length
    CHECK (link IS NULL OR char_length(link) <= 500)
);

COMMENT ON TABLE public.notifications IS 'Thông báo cho user. link là deep link nội bộ';

-- =====================================================================
-- Bảng: audit_logs
-- Nhật ký hành động quản trị
-- =====================================================================
CREATE TABLE public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,
  target_type text,
  target_id   uuid,
  metadata    jsonb,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_logs_action_length
    CHECK (char_length(action) BETWEEN 1 AND 100),
  CONSTRAINT audit_logs_target_type_length
    CHECK (target_type IS NULL OR char_length(target_type) <= 50)
);

COMMENT ON TABLE public.audit_logs IS 'Nhật ký hành động admin/mod. actor_id SET NULL khi user xoá (giữ log)';
COMMENT ON COLUMN public.audit_logs.action IS 'Định dạng: "post.approve", "user.ban", "role.grant"';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Chi tiết thay đổi dạng JSON';

-- =====================================================================
-- Kết thúc migration 0003
-- Đã tạo 15 bảng:
--   profiles, user_roles, user_restrictions,
--   posts, post_revisions, post_images,
--   amenities, post_amenities, post_reviews,
--   post_likes, favorites, comments,
--   reports, notifications, audit_logs
-- =====================================================================