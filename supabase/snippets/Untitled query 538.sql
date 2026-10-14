UPDATE posts
SET status = 'published',
    published_at = now(),
    expires_at = now() + interval '30 days'
WHERE id = '<post-id>';