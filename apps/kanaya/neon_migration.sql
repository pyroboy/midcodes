-- ENUMS
CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user', 'user');
CREATE TYPE template_orientation AS ENUM ('portrait', 'landscape');
CREATE TYPE template_sample_type AS ENUM ('student', 'employee', 'membership', 'visitor', 'other');

-- CORE TABLES
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Linked to Better Auth 'user.id' (stored as UUID)
    email TEXT,
    role user_role DEFAULT 'user',
    org_id UUID REFERENCES organizations(id),
    credits_balance INTEGER NOT NULL DEFAULT 0,
    card_generation_count INTEGER NOT NULL DEFAULT 0,
    template_count INTEGER NOT NULL DEFAULT 0,
    unlimited_templates BOOLEAN NOT NULL DEFAULT FALSE,
    remove_watermarks BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    org_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    front_background TEXT, -- Supabase URL path or R2 bucket path
    back_background TEXT,
    orientation TEXT, -- 'portrait' or 'landscape'
    width_pixels INTEGER,
    height_pixels INTEGER,
    dpi INTEGER DEFAULT 300,
    template_elements JSONB NOT NULL,
    front_background_low_res TEXT,
    back_background_low_res TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE idcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    front_image TEXT,
    back_image TEXT,
    front_image_low_res TEXT,
    back_image_low_res TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_size_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    width_inches NUMERIC(6,4) NOT NULL,
    height_inches NUMERIC(6,4) NOT NULL,
    width_mm NUMERIC(8,2) NOT NULL,
    height_mm NUMERIC(8,2) NOT NULL,
    width_pixels INTEGER NOT NULL,
    height_pixels INTEGER NOT NULL,
    dpi INTEGER NOT NULL DEFAULT 300,
    aspect_ratio NUMERIC(6,4),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    size_preset_id UUID REFERENCES template_size_presets(id),
    sample_type template_sample_type NOT NULL,
    orientation template_orientation NOT NULL,
    image_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    width_pixels INTEGER NOT NULL,
    height_pixels INTEGER NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS & BILLING
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Better Auth user ID
    session_id TEXT NOT NULL,
    provider_payment_id TEXT,
    kind TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    amount_php NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PHP',
    status TEXT NOT NULL DEFAULT 'pending',
    method TEXT,
    method_allowed TEXT[] NOT NULL,
    paid_at TIMESTAMPTZ,
    idempotency_key TEXT NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',
    raw_event JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    invoice_type TEXT NOT NULL DEFAULT 'credit_purchase',
    status TEXT NOT NULL DEFAULT 'draft',
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax_amount INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    amount_paid INTEGER NOT NULL DEFAULT 0,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    notes TEXT,
    internal_notes TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    created_by UUID REFERENCES profiles(id),
    paid_by UUID REFERENCES profiles(id),
    voided_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) NOT NULL,
    item_type TEXT NOT NULL,
    sku_id TEXT,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL DEFAULT 0,
    total_price INTEGER NOT NULL DEFAULT 0,
    credits_granted INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    credits_before INTEGER NOT NULL,
    credits_after INTEGER NOT NULL,
    description TEXT,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}',
    invoice_id UUID REFERENCES invoices(id),
    usage_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIG & SETTINGS
CREATE TABLE org_settings (
    org_id UUID PRIMARY KEY REFERENCES organizations(id),
    payments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    payments_bypass BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bg_removal_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE TABLE admin_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    admin_id UUID REFERENCES profiles(id) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'paymongo',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE digital_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES profiles(id),
    org_id UUID REFERENCES organizations(id),
    linked_id_card_id UUID REFERENCES idcards(id),
    status TEXT DEFAULT 'unclaimed',
    claim_code_hash TEXT,
    privacy_settings JSONB DEFAULT '{"public": true, "show_phone": false}',
    profile_content JSONB DEFAULT '{}',
    theme_config JSONB DEFAULT '{"style": "minimal"}',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE custom_design_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    org_id UUID REFERENCES organizations(id),
    size_preset_id UUID REFERENCES template_size_presets(id),
    width_pixels INTEGER NOT NULL,
    height_pixels INTEGER NOT NULL,
    size_name TEXT NOT NULL,
    design_instructions TEXT NOT NULL,
    reference_assets TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    rejected_reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    resulting_template_id UUID REFERENCES templates(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BETTER AUTH TABLES (Managed by Better Auth, but good to have here)
CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL,
    image TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id)
);

CREATE TABLE account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
