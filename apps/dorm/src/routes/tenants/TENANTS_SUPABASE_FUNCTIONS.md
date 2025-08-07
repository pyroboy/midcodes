-- Create ENUM types if they don't exist
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'BLACKLISTED');
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_type') THEN
        CREATE TYPE billing_type AS ENUM ('RENT', 'UTILITY', 'MAINTENANCE');
    END IF;

END $$;

-- Transaction Management Functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
DECLARE
txid text;
BEGIN
txid := txid_current()::text;
PERFORM set_config('app.current_transaction', txid, true);
END;

$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS
$$

DECLARE
txid text;
BEGIN
txid := current_setting('app.current_transaction', true);
IF txid IS NOT NULL THEN
PERFORM set_config('app.current_transaction', NULL, true);
END IF;
END;

$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS
$$

DECLARE
txid text;
BEGIN
txid := current_setting('app.current_transaction', true);
IF txid IS NOT NULL THEN
PERFORM set_config('app.current_transaction', NULL, true);
RAISE EXCEPTION 'Transaction rolled back';
END IF;
END;

$$
LANGUAGE plpgsql;

-- Rental_unit Status Update Function and Trigger
CREATE OR REPLACE FUNCTION update_rental_unit_status()
RETURNS TRIGGER AS
$$

BEGIN
IF TG_OP = 'INSERT' THEN
UPDATE rental_unit SET rental_unit_status = 'OCCUPIED'
WHERE id = NEW.location_id;
ELSIF TG_OP = 'UPDATE' THEN
IF OLD.location_id IS NOT NULL AND OLD.location_id != NEW.location_id THEN
UPDATE rental_unit SET rental_unit_status = 'VACANT'
WHERE id = OLD.location_id;
END IF;
IF NEW.location_id IS NOT NULL THEN
UPDATE rental_unit SET rental_unit_status = 'OCCUPIED'
WHERE id = NEW.location_id;
END IF;
ELSIF TG_OP = 'DELETE' THEN
UPDATE rental_unit SET rental_unit_status = 'VACANT'
WHERE id = OLD.location_id;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO
$$

BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rental_unit_status_on_lease') THEN
CREATE TRIGGER update_rental_unit_status_on_lease
AFTER INSERT OR UPDATE OR DELETE ON leases
FOR EACH ROW
EXECUTE FUNCTION update_rental_unit_status();
END IF;
END $$;

-- Lease Status Update Function and Trigger
CREATE OR REPLACE FUNCTION update_lease_status()
RETURNS TRIGGER AS $$
BEGIN
IF NEW.end_date < CURRENT_DATE THEN
NEW.lease_status = 'EXPIRED';
ELSIF NEW.start_date > CURRENT_DATE THEN
NEW.lease_status = 'PENDING';
ELSE
NEW.lease_status = 'ACTIVE';
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO
$$

BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lease_status_on_change') THEN
CREATE TRIGGER update_lease_status_on_change
BEFORE INSERT OR UPDATE ON leases
FOR EACH ROW
EXECUTE FUNCTION update_lease_status();
END IF;
END $$;

-- Payment Status Update Function and Trigger
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
IF NEW.due_date < CURRENT_DATE AND NEW.status = 'PENDING' THEN
NEW.status = 'OVERDUE';
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO
$$

BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_status_on_change') THEN
CREATE TRIGGER update_payment_status_on_change
BEFORE INSERT OR UPDATE ON payment_schedules
FOR EACH ROW
EXECUTE FUNCTION update_payment_status();
END IF;
END $$;

-- Add indexes for improved query performance
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leases_dates') THEN
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_schedules_due_date') THEN
        CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);
    END IF;

END $$;

-- Tenant Payment History Function
CREATE OR REPLACE FUNCTION get_tenant_payment_history(p_tenant_id BIGINT)
RETURNS TABLE (
due_date DATE,
amount DECIMAL(10,2),
type billing_type,
status payment_status,
days_overdue INTEGER
) AS $$
BEGIN
RETURN QUERY
SELECT
ps.due_date,
ps.amount,
ps.type,
ps.status,
CASE
WHEN ps.status = 'PENDING' AND ps.due_date < CURRENT_DATE
THEN DATE_PART('day', CURRENT_DATE - ps.due_date)::INTEGER
ELSE 0
END as days_overdue
FROM payment_schedules ps
WHERE ps.tenant_id = p_tenant_id
ORDER BY ps.due_date DESC;
END;

$$
LANGUAGE plpgsql;

-- Add new columns to existing tables
DO
$$

BEGIN
BEGIN
ALTER TABLE tenants
ADD COLUMN auth_id UUID REFERENCES auth.users(id),
ADD COLUMN tenant_status tenant_status NOT NULL DEFAULT 'PENDING',
ADD COLUMN created_by UUID REFERENCES auth.users(id);
EXCEPTION
WHEN duplicate_column THEN
RAISE NOTICE 'columns already exist in tenants table';
END;

    BEGIN
        ALTER TABLE leases
        ADD COLUMN created_by UUID REFERENCES auth.users(id),
        ADD COLUMN notes TEXT;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'columns already exist in leases table';
    END;

    BEGIN
        ALTER TABLE payment_schedules
        ADD COLUMN type billing_type NOT NULL DEFAULT 'RENT';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'column already exists in payment_schedules table';
    END;

END $$;
