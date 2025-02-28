-- Schema for non-standard tables in the "public" schema

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


CREATE TABLE public.budgets (
    id bigint primary key generated always as identity,
    project_name text NOT NULL,
    project_description text,
    project_category text,
    planned_amount numeric(10,2) NOT NULL,
    pending_amount numeric(10,2) DEFAULT 0,
    actual_amount numeric(10,2) DEFAULT 0,
    budget_items jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'planned',
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    property_id integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
) WITH (OIDS=FALSE);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create a foreign key constraint for property_id referencing properties(id)
ALTER TABLE public.budgets ADD CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES public.properties(id);
CREATE INDEX idx_property_id ON public.budgets(property_id);


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

CREATE TABLE public.expenses (
    id integer NOT NULL,
    property_id integer,
    amount numeric(10,2) NOT NULL,
    description text NOT NULL,
    type expense_type NOT NULL,
    status expense_status NOT NULL DEFAULT 'PENDING'::expense_status,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.floors (
    id integer NOT NULL DEFAULT nextval('floors_id_seq'::regclass),
    property_id integer NOT NULL,
    floor_number integer NOT NULL,
    wing text,
    status floor_status NOT NULL DEFAULT 'ACTIVE'::floor_status,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

CREATE TABLE public.idcards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    template_id uuid,
    front_image text,
    back_image text,
    data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);

CREATE TABLE public.lease_tenants (
    id integer NOT NULL DEFAULT nextval('lease_tenants_id_seq'::regclass),
    lease_id integer NOT NULL,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.leases (
    id integer NOT NULL DEFAULT nextval('leases_id_seq'::regclass),
    rental_unit_id integer NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    rent_amount numeric(10,2) NOT NULL,
    security_deposit numeric(10,2) NOT NULL,
    balance numeric(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    created_by uuid,
    terms_month integer,
    status lease_status NOT NULL DEFAULT 'ACTIVE'::lease_status,
    unit_type unit_type
);

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

CREATE TABLE public.meters (
  id integer not null default nextval('meters_id_seq'::regclass),
  name text not null,
  location_type public.meter_location_type not null,
  property_id integer null,
  floor_id integer null,
  rental_unit_id integer null,
  type public.utility_type not null,
  is_active boolean null default true,
  status public.meter_status not null default 'ACTIVE'::meter_status,
  notes text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  initial_reading numeric(10, 2) null,
  constraint meters_pkey primary key (id),
  constraint meters_floor_id_fkey foreign KEY (floor_id) references floors (id),
  constraint meters_property_id_fkey foreign KEY (property_id) references properties (id) on delete CASCADE,
  constraint meters_rental_unit_id_fkey foreign KEY (rental_unit_id) references rental_unit (id)
) TABLESPACE pg_default;
);

CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
    id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
    amount numeric(10,2) NOT NULL,
    method payment_method NOT NULL,
    reference_number text,
    paid_by text NOT NULL,
    paid_at timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    receipt_url text,
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone,
    billing_ids integer[] NOT NULL,
    billing_changes jsonb
);

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

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    role user_role DEFAULT 'user'::user_role,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid,
    context jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.properties (
    id integer NOT NULL DEFAULT nextval('properties_id_seq'::regclass),
    name text NOT NULL,
    address text NOT NULL,
    type text NOT NULL,
    status property_status NOT NULL DEFAULT 'ACTIVE'::property_status,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

CREATE TABLE public.readings (
  id serial not null,
  meter_id integer not null,
  reading numeric(10, 2) not null,
  reading_date date not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  meter_name text null,
  consumption numeric(10, 2) null,
  cost numeric(10, 2) null,
  cost_per_unit numeric(10, 2) null,
  previous_reading numeric(10, 2) null,
  constraint readings_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_readings_meter on public.readings using btree (meter_id) TABLESPACE pg_default;
);

CREATE TABLE public.rental_unit (
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    name text NOT NULL,
    capacity integer NOT NULL,
    rental_unit_status location_status NOT NULL DEFAULT 'VACANT'::location_status,
    base_rate numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    property_id integer NOT NULL,
    floor_id integer NOT NULL,
    type text NOT NULL,
    amenities jsonb DEFAULT '{}'::jsonb,
    number integer NOT NULL
);

CREATE TABLE public.role_permissions (
    id bigint NOT NULL,
    role app_role NOT NULL,
    permission app_permission NOT NULL
);

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

CREATE TABLE public.tenants (
    id integer NOT NULL DEFAULT nextval('tenants_id_seq'::regclass),
    name text NOT NULL,
    contact_number text,
    email character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    auth_id uuid,
    emergency_contact jsonb,
    tenant_status tenant_status NOT NULL DEFAULT 'PENDING'::tenant_status,
    created_by uuid
);

CREATE TABLE public.user_roles (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    role app_role NOT NULL
);