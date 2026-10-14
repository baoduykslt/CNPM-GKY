-- Đếm trigger
SELECT COUNT(*) AS trigger_count
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid::regclass::text LIKE 'public.%';