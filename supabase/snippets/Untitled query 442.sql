SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid::regclass::text = 'auth.users';