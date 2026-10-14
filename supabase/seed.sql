-- =====================================================================
-- RoomConnect - Seed Data (DEV ONLY)
-- Chạy tự động khi: npx supabase db reset
-- KHÔNG chạy file này trên production.
-- =====================================================================
-- Lưu ý quan trọng:
--   Không seed user vào đây vì auth.users do Supabase Auth quản lý.
--   Muốn tạo user dev, xem hướng dẫn ở README (dùng Studio hoặc API).
--   File này chỉ seed dữ liệu KHÔNG phụ thuộc auth.users.
-- =====================================================================

-- Amenities đã được seed trong migration 0008, không cần lặp lại.

-- =====================================================================
-- Ví dụ: nếu muốn thêm amenities đặc biệt cho môi trường dev, thêm ở đây.
-- =====================================================================

-- INSERT INTO public.amenities (name, slug, icon, category) VALUES
--   ('Tiện nghi test', 'tien-nghi-test', 'star', 'test')
-- ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- Hết seed.sql
-- =====================================================================