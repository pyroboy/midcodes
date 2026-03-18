-- Migration: Add DEFAULT now() to all updated_at columns missing it.
-- This ensures new inserts always have a timestamp, which is critical
-- for RxDB checkpoint-based replication (NULL updated_at = invisible rows).

ALTER TABLE properties ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE floors ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE rental_unit ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE meters ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE tenants ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE leases ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE billings ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE payments ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE penalty_configs ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE expenses ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE budgets ALTER COLUMN updated_at SET DEFAULT now();

-- Also backfill any existing NULL updated_at rows so they become visible to replication
UPDATE properties SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE floors SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE rental_unit SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE meters SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE tenants SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE leases SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE billings SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE penalty_configs SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE expenses SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE budgets SET updated_at = created_at WHERE updated_at IS NULL;
