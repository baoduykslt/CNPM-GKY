-- Post gốc vẫn giữ title cũ?
SELECT id, title, status FROM posts
WHERE id = 'c1473295-61aa-438a-93a0-96978575e1de';

-- Revision chờ duyệt có title mới?
SELECT id, post_id, title, status, created_at FROM post_revisions
WHERE post_id = 'c1473295-61aa-438a-93a0-96978575e1de';