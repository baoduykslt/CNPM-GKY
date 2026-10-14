-- =====================================================================
-- RoomConnect - Migration 0007
-- Mục đích: Tạo Storage buckets + policies
--   - post-images: ảnh bài đăng (public read, user upload vào folder của mình)
--   - avatars: ảnh đại diện (public read, user upload vào folder của mình)
-- Quy ước path:
--   post-images/{user_id}/{post_id}/{filename}
--   avatars/{user_id}/{filename}
-- =====================================================================

-- =====================================================================
-- Bucket: post-images
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================================
-- Bucket: avatars
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================================
-- Storage policies: post-images
-- Path pattern: {user_id}/{post_id}/{filename}
-- =====================================================================

-- Đọc: ai cũng đọc được (bucket public)
CREATE POLICY "post_images_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- Insert: user đã đăng nhập, path phải bắt đầu bằng auth.uid()
CREATE POLICY "post_images_storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: chỉ chủ sở hữu (path chứa user_id)
CREATE POLICY "post_images_storage_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: chỉ chủ sở hữu
CREATE POLICY "post_images_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- Storage policies: avatars
-- Path pattern: {user_id}/{filename}
-- =====================================================================

CREATE POLICY "avatars_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_storage_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- Ghi chú:
--   - storage.foldername(name) trả về mảng các thư mục trong path.
--     Ví dụ name = "abc-123/post-456/photo.jpg"
--     → (storage.foldername(name))[1] = 'abc-123'
--   - Bucket public: ảnh truy cập qua URL công khai không cần auth.
--   - Upload/sửa/xoá: yêu cầu auth + folder phải là user_id của chính mình.
-- =====================================================================