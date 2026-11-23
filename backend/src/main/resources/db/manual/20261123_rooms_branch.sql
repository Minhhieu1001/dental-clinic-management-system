-- PostgreSQL: run against the deployment database before deploying the new UI.
-- Existing appointment.room_id values are preserved.
BEGIN;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50)
    REFERENCES branches(branch_id);
CREATE INDEX IF NOT EXISTS idx_rooms_branch_id ON rooms(branch_id);

-- Backfill only rooms whose appointment history identifies exactly one branch.
-- Rooms used across branches, with missing appointment branches, or without
-- appointment history require an explicit assignment by the administrator.
UPDATE rooms r
SET branch_id = history.branch_id
FROM (
    SELECT room_id, MIN(branch_id) AS branch_id
    FROM appointments
    WHERE room_id IS NOT NULL
    GROUP BY room_id
    HAVING COUNT(DISTINCT branch_id) = 1 AND COUNT(*) = COUNT(branch_id)
) history
WHERE r.id = history.room_id AND r.branch_id IS NULL;

COMMIT;

-- Review remaining rooms and assign their actual branch before using call-in.
SELECT id, room_name, branch_id FROM rooms WHERE branch_id IS NULL;
-- Example (replace with real IDs):
-- UPDATE rooms SET branch_id = 'actual-branch-id' WHERE id = 'actual-room-uuid';
