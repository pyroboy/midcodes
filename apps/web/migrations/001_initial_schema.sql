-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Enums
CREATE TYPE lease_status AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE lease_type AS ENUM ('BEDSPACER', 'PRIVATEROOM');
CREATE TYPE location_status AS ENUM ('VACANT', 'OCCUPIED', 'RESERVED');
CREATE TYPE billing_type AS ENUM ('RENT', 'UTILITY', 'PENALTY', 'MAINTENANCE', 'SERVICE');
CREATE TYPE utility_type AS ENUM ('ELECTRICITY', 'WATER', 'INTERNET');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');
CREATE TYPE payment_method AS ENUM ('CASH', 'BANK', 'GCASH', 'OTHER');
CREATE TYPE payment_frequency AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM');
CREATE TYPE maintenance_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- Basic tables
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    floor_level INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    status location_status NOT NULL DEFAULT 'VACANT',
    base_rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_number TEXT,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE leases (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) NOT NULL,
    name TEXT NOT NULL,
    status lease_status NOT NULL DEFAULT 'ACTIVE',
    type lease_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE lease_tenants (
    id SERIAL,
    lease_id INTEGER REFERENCES leases(id) NOT NULL,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (lease_id, tenant_id)
);

CREATE TABLE penalty_configs (
    id SERIAL PRIMARY KEY,
    type billing_type NOT NULL,
    grace_period INTEGER NOT NULL,
    penalty_percentage DECIMAL(5,2) NOT NULL,
    compound_period INTEGER DEFAULT NULL,
    max_penalty_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payment_schedules (
    id SERIAL PRIMARY KEY,
    lease_id INTEGER REFERENCES leases(id) NOT NULL,
    due_date DATE NOT NULL,
    expected_amount DECIMAL(10,2) NOT NULL,
    type billing_type NOT NULL,
    frequency payment_frequency NOT NULL,
    status payment_status DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE billings (
    id SERIAL PRIMARY KEY,
    lease_id INTEGER REFERENCES leases(id) NOT NULL,
    type billing_type NOT NULL,
    utility_type utility_type,
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    billing_date DATE NOT NULL,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    billing_id INTEGER REFERENCES billings(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method payment_method NOT NULL,
    reference_number TEXT,
    paid_by TEXT NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE meters (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) NOT NULL,
    type utility_type NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id) NOT NULL,
    reading DECIMAL(10,2) NOT NULL,
    reading_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE maintenance (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status maintenance_status DEFAULT 'PENDING',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Insert default penalty configurations
INSERT INTO penalty_configs 
(type, grace_period, penalty_percentage, compound_period, max_penalty_percentage)
VALUES 
('RENT', 3, 5.00, 30, 25.00),
('UTILITY', 5, 2.00, NULL, 10.00);

-- Function to calculate penalty
CREATE OR REPLACE FUNCTION calculate_penalty(
    p_billing_id INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    v_billing record;
    v_config record;
    v_days_late INTEGER;
    v_penalty_amount DECIMAL;
    v_compound_cycles INTEGER;
BEGIN
    SELECT * INTO v_billing 
    FROM billings 
    WHERE id = p_billing_id;

    SELECT * INTO v_config 
    FROM penalty_configs 
    WHERE type = v_billing.type;

    IF v_billing.status = 'PAID' OR v_config IS NULL THEN
        RETURN 0;
    END IF;

    v_days_late := EXTRACT(DAY FROM NOW() - v_billing.due_date) - v_config.grace_period;

    IF v_days_late <= 0 THEN
        RETURN 0;
    END IF;

    v_penalty_amount := v_billing.balance * (v_config.penalty_percentage / 100);

    IF v_config.compound_period IS NOT NULL AND v_days_late > v_config.compound_period THEN
        v_compound_cycles := FLOOR(v_days_late::DECIMAL / v_config.compound_period::DECIMAL);
        v_penalty_amount := v_billing.balance * (POWER(1 + v_config.penalty_percentage / 100, v_compound_cycles) - 1);
    END IF;

    IF v_config.max_penalty_percentage IS NOT NULL THEN
        v_penalty_amount := LEAST(
            v_penalty_amount, 
            v_billing.balance * (v_config.max_penalty_percentage / 100)
        );
    END IF;

    RETURN ROUND(v_penalty_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to process penalties
CREATE OR REPLACE FUNCTION process_penalties()
RETURNS void AS $$
DECLARE
    v_billing record;
    v_penalty_amount DECIMAL;
BEGIN
    FOR v_billing IN 
        SELECT * 
        FROM billings 
        WHERE status != 'PAID' 
        AND due_date < CURRENT_DATE
    LOOP
        v_penalty_amount := calculate_penalty(v_billing.id);
        
        IF v_penalty_amount > 0 THEN
            INSERT INTO billings (
                lease_id,
                type,
                amount,
                paid_amount,
                balance,
                status,
                due_date,
                billing_date,
                notes
            ) VALUES (
                v_billing.lease_id,
                'PENALTY',
                v_penalty_amount,
                0,
                v_penalty_amount,
                'PENDING',
                CURRENT_DATE,
                CURRENT_DATE,
                'Penalty for ' || v_billing.type || ' billing #' || v_billing.id
            );

            UPDATE billings 
            SET penalty_amount = v_penalty_amount
            WHERE id = v_billing.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for updating billing status
CREATE OR REPLACE FUNCTION update_billing_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE billings
    SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE billing_id = NEW.billing_id
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE billing_id = NEW.billing_id
            ) >= billings.amount THEN 'PAID'
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE billing_id = NEW.billing_id
            ) > 0 THEN 'PARTIAL'
            ELSE 'PENDING'
        END,
        balance = amount - (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE billing_id = NEW.billing_id
        )
    WHERE id = NEW.billing_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment updates
CREATE TRIGGER update_billing_after_payment
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_billing_status();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all relevant tables
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END $$;

-- Create indexes
CREATE INDEX idx_leases_location ON leases(location_id);
CREATE INDEX idx_lease_tenants_lease ON lease_tenants(lease_id);
CREATE INDEX idx_lease_tenants_tenant ON lease_tenants(tenant_id);
CREATE INDEX idx_billings_lease ON billings(lease_id);
CREATE INDEX idx_billings_status ON billings(status);
CREATE INDEX idx_billings_due_date ON billings(due_date);
CREATE INDEX idx_payments_billing ON payments(billing_id);
CREATE INDEX idx_meters_location ON meters(location_id);
CREATE INDEX idx_readings_meter ON readings(meter_id);
CREATE INDEX idx_maintenance_location ON maintenance(location_id);
CREATE INDEX idx_payment_schedules_lease ON payment_schedules(lease_id);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);

-- Enable RLS
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;
