# Database Schema Documentation

## Custom Types and Enums

```sql
-- Create ENUMs for better data integrity
CREATE TYPE user_role AS ENUM ('student', 'admin', 'staff');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'ready', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE document_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE notification_type AS ENUM (
    'registration_confirmation',
    'order_confirmation',
    'payment_confirmation',
    'status_update',
    'delivery_confirmation',
    'new_order_alert',
    'bulk_upload_completion'
);
```

## Core Tables

### organizations
```sql
CREATE TABLE organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address JSONB NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{
        "allow_multiple_orders": false,
        "require_purpose": true,
        "max_documents_per_order": 5
    }',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### verified_students
```sql
CREATE TABLE verified_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    student_id TEXT NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT,
    year_level TEXT,
    program TEXT,
    batch_number TEXT,
    verification_status BOOLEAN DEFAULT true,
    last_verification_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, student_id),
    UNIQUE(organization_id, email)
);
```

### profiles
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    verified_student_id UUID REFERENCES verified_students(id),
    role user_role DEFAULT 'student',
    phone_number TEXT,
    preferred_address JSONB,
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "sms": false
    }',
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_types
```sql
CREATE TABLE document_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    processing_time_hours INTEGER,
    requirements TEXT[],
    max_copies INTEGER DEFAULT 3,
    purpose_required BOOLEAN DEFAULT true,
    status document_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);
```

### orders
```sql
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    document_type_id UUID REFERENCES document_types(id) NOT NULL,
    reference_number TEXT UNIQUE NOT NULL,
    purpose TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    status order_status DEFAULT 'pending',
    delivery_address JSONB NOT NULL,
    tracking_number TEXT,
    amount DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + shipping_fee) STORED,
    estimated_completion_date TIMESTAMPTZ,
    actual_completion_date TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### order_status_history
```sql
CREATE TABLE order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    order_id UUID REFERENCES orders(id) NOT NULL,
    status order_status NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payments
```sql
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    order_id UUID REFERENCES orders(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gcash_reference TEXT UNIQUE,
    status payment_status DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    payment_details JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notifications
```sql
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### shipping_rates
```sql
CREATE TABLE shipping_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    region TEXT NOT NULL,
    city TEXT,
    rate DECIMAL(10,2) NOT NULL,
    estimated_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, region, city)
);
```

### student_verification_logs
```sql
CREATE TABLE student_verification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    batch_id UUID,
    file_name TEXT,
    total_records INTEGER,
    successful_records INTEGER,
    failed_records INTEGER,
    error_details JSONB DEFAULT '{}',
    processed_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Analytics Views

### daily_orders_summary
```sql
CREATE MATERIALIZED VIEW daily_orders_summary AS
SELECT 
    organization_id,
    DATE_TRUNC('day', created_at) AS order_date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    COUNT(DISTINCT user_id) AS unique_customers,
    AVG(total_amount) AS average_order_value,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
    AVG(EXTRACT(EPOCH FROM (actual_completion_date - created_at))/3600)::INTEGER AS avg_processing_hours
FROM orders
GROUP BY organization_id, DATE_TRUNC('day', created_at)
WITH DATA;
```

### geographical_distribution
```sql
CREATE MATERIALIZED VIEW geographical_distribution AS
SELECT 
    organization_id,
    delivery_address->>'city' AS city,
    delivery_address->>'region' AS region,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    COUNT(DISTINCT user_id) AS unique_customers,
    AVG(shipping_fee) AS avg_shipping_fee
FROM orders
WHERE status != 'cancelled'
GROUP BY 
    organization_id,
    delivery_address->>'city',
    delivery_address->>'region'
WITH DATA;
```

### processing_time_analytics
```sql
CREATE MATERIALIZED VIEW processing_time_analytics AS
SELECT
    organization_id,
    document_type_id,
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS total_orders,
    AVG(EXTRACT(EPOCH FROM (actual_completion_date - created_at))/3600)::INTEGER AS avg_processing_hours,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (actual_completion_date - created_at))/3600) AS p95_processing_hours
FROM orders
WHERE status = 'delivered'
GROUP BY 
    organization_id,
    document_type_id,
    DATE_TRUNC('month', created_at)
WITH DATA;
```

## Indexes and Constraints
```sql
-- Add indexes for frequently accessed columns and foreign keys
CREATE INDEX idx_verified_students_org_student ON verified_students(organization_id, student_id);
CREATE INDEX idx_verified_students_org_email ON verified_students(organization_id, email);
CREATE INDEX idx_orders_reference ON orders(reference_number);
CREATE INDEX idx_orders_tracking ON orders(tracking_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_payments_gcash_ref ON payments(gcash_reference);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Add full text search for order purposes
CREATE INDEX idx_orders_purpose_search ON orders USING GIN (to_tsvector('english', purpose));
```