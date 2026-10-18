-- Matches StatusPhase.CANCEL. Run against the application's database.
-- Assumes the public schema and Hibernate's default CHECK constraint names.
BEGIN;

ALTER TABLE public.treatment_plans
    DROP CONSTRAINT IF EXISTS treatment_plans_status_check;
ALTER TABLE public.treatment_plans
    ADD CONSTRAINT treatment_plans_status_check
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCEL'));

ALTER TABLE public.treatment_phases
    DROP CONSTRAINT IF EXISTS treatment_phases_status_check;
ALTER TABLE public.treatment_phases
    ADD CONSTRAINT treatment_phases_status_check
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCEL'));

ALTER TABLE public.treatment_visits
    DROP CONSTRAINT IF EXISTS treatment_visits_status_check;
ALTER TABLE public.treatment_visits
    ADD CONSTRAINT treatment_visits_status_check
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCEL'));

COMMIT;
