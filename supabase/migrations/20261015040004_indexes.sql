-- =====================================================================
-- RoomConnect - Migration 0004
-- Mục đích: Tạo indexes cho các truy vấn thường dùng
-- Nguyên tắc: chỉ index những cột dùng trong WHERE / ORDER BY / JOIN
-- =====================================================================

-- =====================================================================
-- profiles
-- =====================================================================
-- Tìm user theo username (đăng nhập / link profile)
CREATE INDEX idx_profiles_username ON public.profiles (username);

-- Tìm theo SĐT (admin tra cứu)
CREATE INDEX idx_profiles_phone ON public.profiles (phone) WHERE phone IS NOT NULL;

-- =====================================================================
-- user_roles
-- =====================================================================
-- Đã có index tự động từ UNIQUE (user_id, role)
-- Thêm index cho role để query "tất cả moderator"
CREATE INDEX idx_user_roles_role ON public.user_roles (role);
CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);

-- =====================================================================
-- user_restrictions
-- =====================================================================
-- Check user có restriction đang active không
-- Check user có restriction đang active không
-- Lưu ý: KHÔNG dùng now() trong partial index predicate vì now() không IMMUTABLE.
-- Filter "ends_at > now()" sẽ được Postgres áp dụng ở tầng query.
CREATE INDEX idx_user_restrictions_user_type
  ON public.user_restrictions (user_id, restriction_type);
CREATE INDEX idx_user_restrictions_user_id
  ON public.user_restrictions (user_id);

-- =====================================================================
-- posts
-- =====================================================================
-- Trang chủ: bài published, còn hạn, chưa xoá, sort theo published_at
CREATE INDEX idx_posts_published
  ON public.posts (published_at DESC)
  WHERE status = 'published'
    AND deleted_at IS NULL
    AND availability_status = 'available';

-- Trang "Bài của tôi": filter theo author + status
CREATE INDEX idx_posts_author_status
  ON public.posts (author_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Queue kiểm duyệt: bài pending, sort theo submitted_at
CREATE INDEX idx_posts_pending_queue
  ON public.posts (submitted_at ASC)
  WHERE status = 'pending' AND deleted_at IS NULL;

-- Filter địa lý
CREATE INDEX idx_posts_province_ward
  ON public.posts (province, ward)
  WHERE deleted_at IS NULL;

-- Sort theo giá
CREATE INDEX idx_posts_price
  ON public.posts (price)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Sort theo diện tích
CREATE INDEX idx_posts_area
  ON public.posts (area)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Filter theo loại phòng
CREATE INDEX idx_posts_room_type
  ON public.posts (room_type)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Tìm bài hết hạn (job dọn dẹp)
CREATE INDEX idx_posts_expires_at
  ON public.posts (expires_at)
  WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND deleted_at IS NULL;

-- Tìm kiếm từ khóa trong title (dùng trigram)
CREATE INDEX idx_posts_title_trgm
  ON public.posts USING gin (title extensions.gin_trgm_ops);

-- Tìm kiếm từ khóa trong description (dùng trigram)
CREATE INDEX idx_posts_description_trgm
  ON public.posts USING gin (description extensions.gin_trgm_ops);

-- =====================================================================
-- post_revisions
-- =====================================================================
-- Queue revision pending
CREATE INDEX idx_post_revisions_pending
  ON public.post_revisions (created_at ASC)
  WHERE status = 'pending';

-- Xem revision của 1 post
CREATE INDEX idx_post_revisions_post_id
  ON public.post_revisions (post_id, status);

-- =====================================================================
-- post_images
-- =====================================================================
-- Đã có UNIQUE (post_id, storage_path)
-- Load gallery theo thứ tự
CREATE INDEX idx_post_images_post_sort
  ON public.post_images (post_id, sort_order);

-- =====================================================================
-- amenities
-- =====================================================================
-- Đã có UNIQUE (name) và UNIQUE (slug)
-- Filter tiện nghi active
CREATE INDEX idx_amenities_active
  ON public.amenities (category, slug)
  WHERE is_active = true;

-- =====================================================================
-- post_amenities
-- =====================================================================
-- Đã có PK (post_id, amenity_id)
-- Query "bài nào có tiện nghi X" → filter theo amenity_id
CREATE INDEX idx_post_amenities_amenity_id
  ON public.post_amenities (amenity_id);

-- =====================================================================
-- post_reviews
-- =====================================================================
-- Lịch sử review của 1 post
CREATE INDEX idx_post_reviews_post_created
  ON public.post_reviews (post_id, created_at DESC);

-- Lịch sử mod đã review
CREATE INDEX idx_post_reviews_moderator
  ON public.post_reviews (moderator_id, created_at DESC)
  WHERE moderator_id IS NOT NULL;

-- =====================================================================
-- post_likes
-- =====================================================================
-- Đã có PK (user_id, post_id)
-- Đếm like của 1 post (query "bài này có bao nhiêu like")
CREATE INDEX idx_post_likes_post_id
  ON public.post_likes (post_id);

-- =====================================================================
-- favorites
-- =====================================================================
-- Đã có PK (user_id, post_id)
-- Trang yêu thích: list theo user, sort mới nhất
CREATE INDEX idx_favorites_user_created
  ON public.favorites (user_id, created_at DESC);

-- Đếm favorite của 1 post
CREATE INDEX idx_favorites_post_id
  ON public.favorites (post_id);

-- =====================================================================
-- comments
-- =====================================================================
-- Load bình luận gốc của 1 post
CREATE INDEX idx_comments_post_created
  ON public.comments (post_id, created_at)
  WHERE parent_id IS NULL AND deleted_at IS NULL;

-- Load reply của 1 comment
CREATE INDEX idx_comments_parent
  ON public.comments (parent_id, created_at)
  WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

-- Bình luận của 1 user (trang cá nhân, admin xem)
CREATE INDEX idx_comments_author
  ON public.comments (author_id, created_at DESC)
  WHERE author_id IS NOT NULL AND deleted_at IS NULL;

-- =====================================================================
-- reports
-- =====================================================================
-- Queue báo cáo chờ xử lý
CREATE INDEX idx_reports_pending
  ON public.reports (created_at DESC)
  WHERE status = 'pending';

-- Báo cáo theo target (xem 1 post/comment bị báo mấy lần)
CREATE INDEX idx_reports_target
  ON public.reports (target_type, target_id);

-- Báo cáo do 1 user gửi
CREATE INDEX idx_reports_reporter
  ON public.reports (reporter_id, created_at DESC)
  WHERE reporter_id IS NOT NULL;

-- =====================================================================
-- notifications
-- =====================================================================
-- Trang thông báo: list theo user, sort mới nhất
CREATE INDEX idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- Đếm thông báo chưa đọc (cho badge)
CREATE INDEX idx_notifications_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- =====================================================================
-- audit_logs
-- =====================================================================
-- Lịch sử hành động của 1 admin/mod
CREATE INDEX idx_audit_logs_actor_created
  ON public.audit_logs (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

-- Lịch sử hành động lên 1 đối tượng
CREATE INDEX idx_audit_logs_target
  ON public.audit_logs (target_type, target_id, created_at DESC)
  WHERE target_type IS NOT NULL;

-- Toàn bộ log sort mới nhất
CREATE INDEX idx_audit_logs_created
  ON public.audit_logs (created_at DESC);

-- =====================================================================
-- Kết thúc migration 0004
-- =====================================================================