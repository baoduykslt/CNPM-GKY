-- Có profile nào không?
SELECT id, username, full_name, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 5;