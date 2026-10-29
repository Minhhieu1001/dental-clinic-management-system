-- Run once on the existing PostgreSQL database BEFORE starting the updated backend.
-- No rows are discarded. Conflicting assignments abort the entire transaction.
BEGIN;
LOCK TABLE services, promotions IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS promotion_id UUID;
CREATE TEMP TABLE promotion_assignment_candidates (
    service_id UUID NOT NULL,
    promotion_id UUID NOT NULL,
    PRIMARY KEY (service_id, promotion_id)
) ON COMMIT DROP;

INSERT INTO promotion_assignment_candidates
SELECT id, promotion_id FROM services WHERE promotion_id IS NOT NULL;

DO $$
BEGIN
    IF to_regclass('public.promotion_services') IS NOT NULL THEN
        LOCK TABLE promotion_services IN SHARE ROW EXCLUSIVE MODE;
        INSERT INTO promotion_assignment_candidates
        SELECT service_id, promotion_id FROM promotion_services
        WHERE service_id IS NOT NULL AND promotion_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

INSERT INTO promotion_assignment_candidates
SELECT s.id, p.id FROM services s CROSS JOIN promotions p
WHERE p.apply_all_services = TRUE
ON CONFLICT DO NOTHING;

DO $$
DECLARE conflicts TEXT;
BEGIN
    SELECT string_agg(service_id::text, ', ') INTO conflicts
    FROM (SELECT service_id FROM promotion_assignment_candidates
          GROUP BY service_id HAVING count(*) > 1) duplicate_services;
    IF conflicts IS NOT NULL THEN
        RAISE EXCEPTION 'Multiple promotions for services: %. Resolve legacy assignments/apply_all_services and rerun.', conflicts;
    END IF;
END $$;

UPDATE services s SET promotion_id = a.promotion_id
FROM promotion_assignment_candidates a WHERE a.service_id = s.id;
UPDATE promotions SET apply_all_services = FALSE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'fk_services_promotion' AND conrelid = 'services'::regclass) THEN
        ALTER TABLE services ADD CONSTRAINT fk_services_promotion
            FOREIGN KEY (promotion_id) REFERENCES promotions(id);
    END IF;
    IF to_regclass('public.promotion_services') IS NOT NULL THEN
        ALTER TABLE promotion_services RENAME TO promotion_services_legacy;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_services_promotion_id ON services(promotion_id);
COMMIT;
