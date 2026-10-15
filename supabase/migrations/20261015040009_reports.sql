-- Bo sung loai ly do bao cao cho RoomConnect

DO $$
BEGIN
  CREATE TYPE public.report_reason AS ENUM (
    'INCORRECT_INFO',
    'ROOM_RENTED',
    'SCAM_SUSPICION',
    'UNREACHABLE',
    'DUPLICATE_OR_SPAM',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;