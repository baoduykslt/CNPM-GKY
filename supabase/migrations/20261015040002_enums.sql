-- =====================================================================
-- RoomConnect - Migration 0002
-- Mục đích: Định nghĩa tất cả enum types
-- Lưu ý: PostgreSQL không cho ALTER TYPE ADD VALUE trong transaction của
--        một số migration runner cũ. Supabase CLI hiện đại xử lý được.
-- =====================================================================

-- Vai trò người dùng
CREATE TYPE public.app_role AS ENUM (
  'member',
  'moderator',
  'admin'
);

-- Trạng thái kiểm duyệt bài đăng
CREATE TYPE public.post_status AS ENUM (
  'draft',      -- Nháp, chỉ tác giả thấy
  'pending',    -- Chờ duyệt
  'published',  -- Đã duyệt, hiển thị public
  'rejected',   -- Bị từ chối
  'archived'    -- Đã lưu trữ (do mod ẩn hoặc hết hạn lâu)
);

-- Trạng thái cho thuê
CREATE TYPE public.availability_status AS ENUM (
  'available',  -- Còn trống
  'rented',     -- Đã cho thuê
  'hidden'      -- Tạm ẩn
);

-- Loại phòng
CREATE TYPE public.room_type AS ENUM (
  'phong_tro',         -- Phòng trọ
  'chung_cu_mini',     -- Chung cư mini
  'nha_nguyen_can',    -- Nhà nguyên căn
  'o_ghep',            -- Ở ghép
  'ky_tuc_xa',         -- Ký túc xá
  'khac'               -- Khác
);

-- Hành động kiểm duyệt
CREATE TYPE public.review_action AS ENUM (
  'submitted',  -- Member gửi duyệt
  'approved',   -- Mod duyệt
  'rejected',   -- Mod từ chối
  'hidden',     -- Mod ẩn
  'restored'    -- Mod khôi phục
);

-- Loại hạn chế tài khoản
CREATE TYPE public.restriction_type AS ENUM (
  'post_ban',   -- Cấm đăng bài
  'login_ban',  -- Cấm đăng nhập
  'full_ban'    -- Cấm toàn bộ
);

-- Đối tượng bị báo cáo
CREATE TYPE public.report_target AS ENUM (
  'post',
  'comment',
  'user'
);

-- Trạng thái xử lý báo cáo
CREATE TYPE public.report_status AS ENUM (
  'pending',    -- Chờ xử lý
  'reviewing',  -- Đang xem xét
  'resolved',   -- Đã xử lý (có vi phạm)
  'dismissed'   -- Bỏ qua (không vi phạm)
);

-- Loại thông báo
CREATE TYPE public.notification_type AS ENUM (
  'post_approved',   -- Bài được duyệt
  'post_rejected',   -- Bài bị từ chối
  'comment',         -- Có bình luận mới vào bài của mình
  'reply',           -- Có reply vào comment của mình
  'like',            -- Có người like bài mình
  'report_result',   -- Báo cáo của mình đã được xử lý
  'system'           -- Thông báo hệ thống
);

-- Trạng thái bản chỉnh sửa
CREATE TYPE public.revision_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- =====================================================================
-- Ghi chú quan hệ enum:
--   - post_status: draft → pending → published/rejected → archived
--   - revision_status: pending → approved/rejected
--   - report_status: pending → reviewing → resolved/dismissed
-- =====================================================================