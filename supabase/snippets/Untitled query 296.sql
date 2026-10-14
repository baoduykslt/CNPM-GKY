SELECT post_id, storage_path, sort_order
FROM post_images
WHERE post_id = (SELECT id FROM posts ORDER BY created_at DESC LIMIT 1);