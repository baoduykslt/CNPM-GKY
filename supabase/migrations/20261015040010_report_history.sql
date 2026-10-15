-- RoomConnect: Report processing history
-- Preserve existing reports and report_status.
-- Do not delete existing data.

-- 1. Create history table
CREATE TABLE IF NOT EXISTS public.report_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    report_id uuid
        REFERENCES public.reports(id)
        ON DELETE SET NULL,

    actor_id uuid
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    event_type text NOT NULL
        CHECK (
            event_type IN (
                'created',
                'status_changed',
                'resolution_updated'
            )
        ),

    old_status public.report_status,
    new_status public.report_status,

    old_resolution_note text,
    new_resolution_note text,

    note text,

    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_report_history_report_id
    ON public.report_history(report_id);

CREATE INDEX IF NOT EXISTS idx_report_history_created_at
    ON public.report_history(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- 4. Only report owners and moderators can read history
DROP POLICY IF EXISTS report_history_select_own_or_staff
    ON public.report_history;

CREATE POLICY report_history_select_own_or_staff
ON public.report_history
FOR SELECT
TO authenticated
USING (
    public.is_moderator()
    OR EXISTS (
        SELECT 1
        FROM public.reports r
        WHERE r.id = report_history.report_id
          AND r.reporter_id = auth.uid()
    )
);

-- 5. Grant read access; RLS still controls which rows are visible
GRANT SELECT ON public.report_history TO authenticated;

-- No direct INSERT, UPDATE or DELETE policy is provided.
-- History is written by the database trigger below.

-- 6. Create trigger function
CREATE OR REPLACE FUNCTION public.record_report_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.report_history (
            report_id,
            actor_id,
            event_type,
            old_status,
            new_status,
            old_resolution_note,
            new_resolution_note,
            note
        )
        VALUES (
            NEW.id,
            COALESCE(auth.uid(), NEW.reporter_id),
            'created',
            NULL,
            NEW.status,
            NULL,
            NEW.resolution_note,
            NEW.resolution_note
        );

        RETURN NEW;
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.report_history (
            report_id,
            actor_id,
            event_type,
            old_status,
            new_status,
            old_resolution_note,
            new_resolution_note,
            note
        )
        VALUES (
            NEW.id,
            auth.uid(),
            'status_changed',
            OLD.status,
            NEW.status,
            OLD.resolution_note,
            NEW.resolution_note,
            NEW.resolution_note
        );

    ELSIF OLD.resolved_by IS DISTINCT FROM NEW.resolved_by
       OR OLD.resolved_at IS DISTINCT FROM NEW.resolved_at
       OR OLD.resolution_note IS DISTINCT FROM NEW.resolution_note THEN

        INSERT INTO public.report_history (
            report_id,
            actor_id,
            event_type,
            old_status,
            new_status,
            old_resolution_note,
            new_resolution_note,
            note
        )
        VALUES (
            NEW.id,
            auth.uid(),
            'resolution_updated',
            OLD.status,
            NEW.status,
            OLD.resolution_note,
            NEW.resolution_note,
            NEW.resolution_note
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 7. Install trigger safely
DROP TRIGGER IF EXISTS trg_record_report_history
    ON public.reports;

CREATE TRIGGER trg_record_report_history
AFTER INSERT OR UPDATE OF
    status,
    resolved_by,
    resolved_at,
    resolution_note
ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.record_report_history();