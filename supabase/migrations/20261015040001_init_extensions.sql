-- =====================================================================
-- RoomConnect - Migration 0001
-- Mục đích: Cài đặt các PostgreSQL extensions cần thiết
-- =====================================================================

-- citext: kiểu text không phân biệt hoa thường
--   Dùng cho username, slug — tránh trùng lặp "Admin" vs "admin"
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

-- unaccent: bỏ dấu tiếng Việt khi tìm kiếm
--   Dùng ở Giai đoạn 7 (search "phong tro" khớp "phòng trọ")
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- pg_trgm: hỗ trợ tìm kiếm LIKE/ILIKE nhanh với GIN index
--   Dùng cho tìm kiếm từ khóa trong tiêu đề/mô tả
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Ghi chú: gen_random_uuid() đã có sẵn từ PostgreSQL 13+, không cần pgcrypto