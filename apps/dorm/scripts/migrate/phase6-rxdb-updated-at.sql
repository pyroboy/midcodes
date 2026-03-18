-- Phase 6: Add updated_at columns for RxDB checkpoint-based replication
-- Tables: readings, lease_tenants, payment_allocations

ALTER TABLE readings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE lease_tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payment_allocations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows: use created_at as the initial updated_at value
UPDATE readings SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE lease_tenants SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE payment_allocations SET updated_at = created_at WHERE updated_at IS NULL;
