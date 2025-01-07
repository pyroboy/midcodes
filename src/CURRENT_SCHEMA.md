    # Complete Database Schema Reference

    ## Property Management Module

    ### Properties Table
    ```sql
    CREATE TABLE public.properties (
        id integer NOT NULL DEFAULT nextval('properties_id_seq'::regclass),
        name text NOT NULL,
        address text NOT NULL,
        type text NOT NULL,
        status property_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone
    );
    ```

    ### Floors Table
    ```sql
    CREATE TABLE public.floors (
        id integer NOT NULL DEFAULT nextval('floors_id_seq'::regclass),
        property_id integer NOT NULL,
        floor_number integer NOT NULL,
        wing text,
        status floor_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone
    );
    ```

    ### Rental_Units Table
    ```sql
    CREATE TABLE public.rental_unit (
        id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
        name text NOT NULL,
        number integer NOT NULL,
        capacity integer NOT NULL,
        rental_unit_status location_status NOT NULL DEFAULT 'VACANT',
        base_rate numeric(10,2) NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone,
        property_id integer NOT NULL,
        floor_id integer NOT NULL,
        type text NOT NULL,
        amenities jsonb DEFAULT '{}'
    );
    ```

    ### Maintenance Table
    ```sql
    CREATE TABLE public.maintenance (
        id integer NOT NULL DEFAULT nextval('maintenance_id_seq'::regclass),
        location_id integer NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        status maintenance_status DEFAULT 'PENDING',
        completed_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone
    );
    ```

    ### Expenses Table
    ```sql
    CREATE TABLE public.expenses (
        id integer NOT NULL,
        property_id integer,
        amount numeric(10,2) NOT NULL,
        description text NOT NULL,
        type expense_type NOT NULL,
        status expense_status NOT NULL DEFAULT 'PENDING',
        created_by uuid,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
    );
    ```

    ## Tenancy Module

    ### Tenants Table
    ```sql
    CREATE TABLE public.tenants (
        id integer NOT NULL DEFAULT nextval('tenants_id_seq'::regclass),
        name text NOT NULL,
        contact_number text,
        email character varying(255),
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone,
        auth_id uuid REFERENCES auth.users(id),                    -- New column
        tenant_status tenant_status NOT NULL DEFAULT 'PENDING',    -- New column
        created_by uuid REFERENCES auth.users(id),                 -- New column
        emergency_contact jsonb DEFAULT NULL
    );
    ```

    ### Leases Table
    ```sql
    CREATE TABLE public.leases (
        id integer NOT NULL DEFAULT nextval('leases_id_seq'::regclass),
        location_id integer NOT NULL,
        name text NOT NULL,
        status lease_status NOT NULL DEFAULT 'ACTIVE',
        type lease_type NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        rent_amount numeric(10,2) NOT NULL,
        security_deposit numeric(10,2) NOT NULL,
        balance numeric(10,2) DEFAULT 0,
        notes text,                                               -- New column
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone,
        created_by uuid REFERENCES auth.users(id)                 -- New column
    );
    ```

    ### Lease Tenants Table
    ```sql
    CREATE TABLE public.lease_tenants (
        id integer NOT NULL DEFAULT nextval('lease_tenants_id_seq'::regclass),
        lease_id integer NOT NULL,
        tenant_id integer NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
    );
    ```

    ## Billing Module

    ### Billings Table
    ```sql
    CREATE TABLE public.billings (
        id integer NOT NULL DEFAULT nextval('billings_id_seq'::regclass),
        lease_id integer NOT NULL,
        type billing_type NOT NULL,
        utility_type utility_type,
        amount numeric(10,2) NOT NULL,
        paid_amount numeric(10,2) DEFAULT 0,
        balance numeric(10,2) NOT NULL,
        status payment_status NOT NULL DEFAULT 'PENDING',
        due_date date NOT NULL,
        billing_date date NOT NULL,
        penalty_amount numeric(10,2) DEFAULT 0,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone
    );
    ```

    ### Payments Table
    ```sql
    CREATE TABLE public.payments (
        id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
        billing_id integer NOT NULL,
        amount numeric(10,2) NOT NULL,
        method payment_method NOT NULL,
        reference_number text,
        receipt_url text,
        paid_by text NOT NULL,
        paid_at timestamp with time zone NOT NULL,
        notes text,
        created_by uuid,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_by uuid,
        updated_at timestamp with time zone
    );
    ```

    ### Payment Schedules Table
    ```sql
    CREATE TABLE public.payment_schedules (
        id integer NOT NULL DEFAULT nextval('payment_schedules_id_seq'::regclass),
        lease_id integer NOT NULL,
        due_date date NOT NULL,
        expected_amount numeric(10,2) NOT NULL,
        type billing_type NOT NULL DEFAULT 'RENT',               -- New column with default
        frequency payment_frequency NOT NULL,
        status payment_status DEFAULT 'PENDING',
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone
    );
    ```

    ### Penalty Configs Table
    ```sql
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
    ```

    ## Utility Management Module

    ### Meters Table
    ```sql
    CREATE TABLE public.meters (
        id integer NOT NULL DEFAULT nextval('meters_id_seq'::regclass),
        name text NOT NULL,
        location_type meter_location_type NOT NULL,
        property_id integer,
        floor_id integer,
        rental_unit_id integer,
        type utility_type NOT NULL,
        is_active boolean DEFAULT true,
        status meter_status NOT NULL DEFAULT 'ACTIVE',
        initial_reading numeric(10,2) NOT NULL DEFAULT 0,
        unit_rate numeric(10,2) NOT NULL DEFAULT 0,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
    );
    ```

    ### Readings Table
    ```sql
    CREATE TABLE public.readings (
        id integer NOT NULL DEFAULT nextval('readings_id_seq'::regclass),
        meter_id integer NOT NULL,
        reading numeric(10,2) NOT NULL,
        reading_date date NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
    );
    ```

    ## Event Management Module

    ### Events Table
    ```sql
    CREATE TABLE public.events (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        event_name text NOT NULL,
        event_long_name text,
        event_url text,
        other_info jsonb DEFAULT '{}',
        ticketing_data jsonb[] DEFAULT '{}',
        is_public boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        created_by uuid NOT NULL,
        org_id uuid NOT NULL,
        payment_timeout_minutes integer DEFAULT 15
    );
    ```

    ### Attendees Table
    ```sql
    CREATE TABLE public.attendees (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        basic_info jsonb DEFAULT '{}',
        event_id uuid NOT NULL,
        ticket_info jsonb DEFAULT '{}',
        is_paid boolean DEFAULT false,
        is_printed boolean DEFAULT false,
        received_by uuid,
        qr_link text,
        reference_code_url text,
        attendance_status text DEFAULT 'notRegistered',
        qr_scan_info jsonb[] DEFAULT '{}',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        org_id uuid NOT NULL
    );
    ```

    ## ID Card Management Module

    ### Templates Table
    ```sql
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
    ```

    ### ID Cards Table
    ```sql
    CREATE TABLE public.idcards (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        template_id uuid,
        front_image text,
        back_image text,
        data jsonb,
        created_at timestamp with time zone DEFAULT now(),
        org_id uuid NOT NULL
    );
    ```

    ## Access Control Module

    ### Organizations Table
    ```sql
    CREATE TABLE public.organizations (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
    );
    ```

    ### Profiles Table
    ```sql
    CREATE TABLE public.profiles (
        id uuid NOT NULL,
        email text,
        role user_role DEFAULT 'user',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        org_id uuid,
        context jsonb DEFAULT '{}'
    );
    ```

    ### Role Emulation Sessions Table
    ```sql
    CREATE TABLE public.role_emulation_sessions (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        original_role user_role NOT NULL,
        emulated_role user_role NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        expires_at timestamp with time zone NOT NULL,
        status text DEFAULT 'active',
        metadata jsonb DEFAULT '{}',
        emulated_org_id uuid,
        is_role_existing boolean NOT NULL DEFAULT false
    );
    ```

    ## Enums Used

    1. billing_type
    - RENT
    - UTILITY
    - PENALTY
    - MAINTENANCE
    - SERVICE

    2. expense_status
    - PENDING
    - APPROVED
    - REJECTED

    3. expense_type
    - UTILITY
    - MAINTENANCE
    - SUPPLIES
    - OTHER

    4. floor_status
    - ACTIVE
    - INACTIVE
    - MAINTENANCE

    5. lease_status
    - ACTIVE
    - INACTIVE
    - EXPIRED
    - TERMINATED

    6. lease_type
    - BEDSPACER
    - PRIVATEROOM

    7. location_status
    - VACANT
    - OCCUPIED
    - RESERVED

    8. maintenance_status
    - PENDING
    - IN_PROGRESS
    - COMPLETED

    9. meter_location_type
    - PROPERTY
    - FLOOR
    - RENTAL_UNIT

    10. meter_status
        - ACTIVE
        - INACTIVE
        - MAINTENANCE

    11. payment_frequency
        - MONTHLY
        - QUARTERLY
        - ANNUAL
        - CUSTOM

    12. payment_method
        - CASH
        - BANK
        - GCASH
        - OTHER

    13. payment_status
        - PENDING
        - PARTIAL
        - PAID
        - OVERDUE

    14. property_status
        - ACTIVE
        - INACTIVE
        - MAINTENANCE

    15. utility_type
        - ELECTRICITY
        - WATER
        - INTERNET

    16. user_role
        - super_admin
        - org_admin
        - user
        - event_admin
        - event_qr_checker
        - property_admin
        - property_manager
        - property_accountant
        - property_maintenance
        - property_utility
        - property_frontdesk
        - property_tenant
        - property_guest
        - id_gen_admin
        - id_gen_user

    ## Added Type Definitions
    ```sql
    CREATE TYPE tenant_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'PENDING',
        'BLACKLISTED'
    );
    ```

