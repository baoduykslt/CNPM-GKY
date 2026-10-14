-- Đếm enum
SELECT COUNT(DISTINCT t.typname) AS enum_count
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typnamespace = 'public'::regnamespace;