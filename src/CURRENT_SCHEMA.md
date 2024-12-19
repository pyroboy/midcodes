-- =============================================================================
-- Core User and Organization Tables
-- =============================================================================

-- Organizations table
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    role user_role DEFAULT 'user'::user_role,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid,
    context jsonb DEFAULT '{}'::jsonb
);

-- Role emulation sessions table
CREATE TABLE public.role_emulation_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    original_role user_role NOT NULL,
    emulated_role user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    status text DEFAULT 'active'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    emulated_org_id uuid,
    is_role_existing boolean NOT NULL DEFAULT false
);

-- =============================================================================
-- Event Management Tables
-- =============================================================================

-- Events table
CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    event_name text NOT NULL,
    event_long_name text,
    event_url text,
    other_info jsonb DEFAULT '{}'::jsonb,
    ticketing_data jsonb[] DEFAULT '{}'::jsonb[],
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid NOT NULL,
    org_id uuid NOT NULL,
    payment_timeout_minutes integer DEFAULT 15
);

-- Attendees table
CREATE TABLE public.attendees (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    basic_info jsonb DEFAULT '{}'::jsonb,
    event_id uuid NOT NULL,
    ticket_info jsonb DEFAULT '{}'::jsonb,
    is_paid boolean DEFAULT false,
    is_printed boolean DEFAULT false,
    received_by uuid,
    qr_link text,
    reference_code_url text,
    attendance_status text DEFAULT 'notRegistered'::text,
    qr_scan_info jsonb[] DEFAULT '{}'::jsonb[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);

-- =============================================================================
-- ID Card Management Tables
-- =============================================================================

-- Templates table
CREATE TABLE public.templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    name text NOT NULL,
    front_background text,
    back_background text,
    orientation text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    template_elements jsonb NOT NULL,
    org_id uuid
);

-- ID Cards table
CREATE TABLE public.idcards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    template_id uuid,
    front_image text,
    back_image text,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);

-- =============================================================================
-- Property Management Tables
-- =============================================================================

-- Properties table
CREATE TABLE public.properties (
    id integer NOT NULL DEFAULT nextval('properties_id_seq'::regclass),
    name text NOT NULL,
    address text NOT NULL,
    type text NOT NULL,
    status property_status NOT NULL DEFAULT 'ACTIVE'::property_status,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Floors table
CREATE TABLE public.floors (
    id integer NOT NULL DEFAULT nextval('floors_id_seq'::regclass),
    property_id integer NOT NULL,
    floor_number integer NOT NULL,
    wing text,
    status floor_status NOT NULL DEFAULT 'ACTIVE'::floor_status,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Rooms table
CREATE TABLE public.rooms (
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    name text NOT NULL,
    number integer NOT NULL,
    capacity integer NOT NULL,
    room_status location_status NOT NULL DEFAULT 'VACANT'::location_status,
    base_rate numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    property_id integer NOT NULL,
    floor_id integer NOT NULL,
    type text NOT NULL,
    amenities jsonb DEFAULT '{}'::jsonb
);

-- =============================================================================
-- Lease Management Tables
-- =============================================================================

-- Leases table
CREATE TABLE public.leases (
    id integer NOT NULL DEFAULT nextval('leases_id_seq'::regclass),
    location_id integer NOT NULL,
    name text NOT NULL,
    status lease_status NOT NULL DEFAULT 'ACTIVE'::lease_status,
    type lease_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    rent_amount numeric(10,2) NOT NULL,
    security_deposit numeric(10,2) NOT NULL,
    balance numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Tenants table
CREATE TABLE public.tenants (
    id integer NOT NULL DEFAULT nextval('tenants_id_seq'::regclass),
    name text NOT NULL,
    contact_number text,
    email character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    auth_id uuid
);

-- Lease-Tenant relationship table
CREATE TABLE public.lease_tenants (
    id integer NOT NULL DEFAULT nextval('lease_tenants_id_seq'::regclass),
    lease_id integer NOT NULL,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- Billing and Payment Tables
-- =============================================================================

-- Billings table
CREATE TABLE public.billings (
    id integer NOT NULL DEFAULT nextval('billings_id_seq'::regclass),
    lease_id integer NOT NULL,
    type billing_type NOT NULL,
    utility_type utility_type,
    amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0,
    balance numeric(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING'::payment_status,
    due_date date NOT NULL,
    billing_date date NOT NULL,
    penalty_amount numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Payments table
CREATE TABLE public.payments (
    id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
    billing_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    method payment_method NOT NULL,
    reference_number text,
    paid_by text NOT NULL,
    paid_at timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payment schedules table
CREATE TABLE public.payment_schedules (
    id integer NOT NULL DEFAULT nextval('payment_schedules_id_seq'::regclass),
    lease_id integer NOT NULL,
    due_date date NOT NULL,
    expected_amount numeric(10,2) NOT NULL,
    type billing_type NOT NULL,
    frequency payment_frequency NOT NULL,
    status payment_status DEFAULT 'PENDING'::payment_status,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Penalty configurations table
CREATE TABLE public.penalty_configs (
    id integer NOT NULL DEFAULT nextval('penalty_configs_id_seq'::regclass),
    type billing_type NOT NULL,
    grace_period integer NOT NULL,
    penalty_percentage numeric(5,2) NOT NULL,
    compound_period integer,
    max_penalty_percentage numeric(5,2),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- =============================================================================
-- Maintenance and Utility Tables
-- =============================================================================

-- Maintenance table
CREATE TABLE public.maintenance (
    id integer NOT NULL DEFAULT nextval('maintenance_id_seq'::regclass),
    location_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status maintenance_status DEFAULT 'PENDING'::maintenance_status,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Meters table
CREATE TABLE public.meters (
    id integer NOT NULL DEFAULT nextval('meters_id_seq'::regclass),
    location_id integer NOT NULL,
    type utility_type NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    property_id integer
);

-- Meter readings table
CREATE TABLE public.readings (
    id integer NOT NULL DEFAULT nextval('readings_id_seq'::regclass),
    meter_id integer NOT NULL,
    reading numeric(10,2) NOT NULL,
    reading_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- Custom Types
-- =============================================================================

CREATE TYPE public.user_role AS ENUM (
    'super_admin', 'org_admin', 'user', 'event_admin', 'event_qr_checker',
    'property_admin', 'property_manager', 'property_accountant', 'property_maintenance',
    'property_utility', 'property_frontdesk', 'property_tenant', 'property_guest',
    'id_gen_admin', 'id_gen_user'
);

CREATE TYPE public.billing_type AS ENUM ('RENT', 'UTILITY', 'PENALTY', 'MAINTENANCE', 'SERVICE');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');
CREATE TYPE public.payment_method AS ENUM ('CASH', 'BANK', 'GCASH', 'OTHER');
CREATE TYPE public.payment_frequency AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM');
CREATE TYPE public.property_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE public.floor_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE public.location_status AS ENUM ('VACANT', 'OCCUPIED', 'RESERVED');
CREATE TYPE public.lease_status AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE public.lease_type AS ENUM ('BEDSPACER', 'PRIVATEROOM');
CREATE TYPE public.maintenance_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE public.utility_type AS ENUM ('ELECTRICITY', 'WATER', 'INTERNET');


- Expense Management Types and Tables
-- Create enum types for expenses
CREATE TYPE expense_type AS ENUM ('UTILITY', 'MAINTENANCE', 'SUPPLIES', 'OTHER');
CREATE TYPE expense_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create expenses table
CREATE TABLE public.expenses (
    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    property_id integer REFERENCES public.properties(id) ON DELETE CASCADE,
    amount decimal(10,2) NOT NULL,
    description text NOT NULL,
    type expense_type NOT NULL,
    status expense_status NOT NULL DEFAULT 'PENDING',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX expenses_property_id_idx ON public.expenses(property_id);
CREATE INDEX expenses_created_by_idx ON public.expenses(created_by);