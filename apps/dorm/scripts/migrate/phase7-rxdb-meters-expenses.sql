-- Phase 7: Add updated_at to meters and expenses for RxDB checkpoint-based replication
ALTER TABLE meters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill: ensure existing rows have a valid updated_at
UPDATE meters SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE expenses SET updated_at = created_at WHERE updated_at IS NULL;
