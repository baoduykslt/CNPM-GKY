SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname  AS trigger_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, c.relname, t.tgname;