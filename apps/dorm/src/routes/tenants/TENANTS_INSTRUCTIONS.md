# Tenant Management Module Instructions

## Overview
The Tenant Management module is a core component of the dormitory management system that handles tenant operations, including tenant registration, contract management, and rental_unit assignments. It enables staff to create, update, and manage tenant information while maintaining proper relationships with rental_unit and properties.

## Database Schema

### Main Tables

#### Tenants Table
```sql
CREATE TABLE public.tenants (
    id integer NOT NULL DEFAULT nextval('tenants_id_seq'::regclass),
    name text NOT NULL,
    contact_number text,
    email character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    auth_id uuid REFERENCES auth.users(id),                    -- For linking to auth system
    tenant_status tenant_status NOT NULL DEFAULT 'PENDING',    -- Track tenant status
    created_by uuid REFERENCES auth.users(id)                  -- Track who created the tenant
);
```

#### Leases Table
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
    notes text,                                               -- Additional notes
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    created_by uuid REFERENCES auth.users(id)                 -- Track who created the lease
);
```

#### Lease Tenants Table
```sql
CREATE TABLE public.lease_tenants (
    id integer NOT NULL DEFAULT nextval('lease_tenants_id_seq'::regclass),
    lease_id integer NOT NULL,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### Payment Schedules Table
```sql
CREATE TABLE public.payment_schedules (
    id integer NOT NULL DEFAULT nextval('payment_schedules_id_seq'::regclass),
    lease_id integer NOT NULL,
    due_date date NOT NULL,
    expected_amount numeric(10,2) NOT NULL,
    type billing_type NOT NULL DEFAULT 'RENT',               -- Payment type with default
    frequency payment_frequency NOT NULL,
    status payment_status DEFAULT 'PENDING',
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);
```

#### Billings Table
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

#### Payments Table
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

### Related Tables

#### Rental_Units Table
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

#### Properties Table
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

#### Profiles Table
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

## Enums and Types

### Status Enums
```sql
-- Payment Status
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE'
);

-- Lease Status
CREATE TYPE lease_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXPIRED',
    'TERMINATED'
);

-- Rental_unit Status (location_status)
CREATE TYPE location_status AS ENUM (
    'VACANT',
    'OCCUPIED',
    'RESERVED'
);

-- Property Status
CREATE TYPE property_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);

-- Tenant Status
CREATE TYPE tenant_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'BLACKLISTED'
);
```

### Type Enums
```sql
-- Billing Type
CREATE TYPE billing_type AS ENUM (
    'RENT',
    'UTILITY',
    'PENALTY',
    'MAINTENANCE',
    'SERVICE'
);

-- Payment Method
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'BANK',
    'GCASH',
    'OTHER'
);

-- Payment Frequency
CREATE TYPE payment_frequency AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'ANNUAL',
    'CUSTOM'
);

-- Lease Type
CREATE TYPE lease_type AS ENUM (
    'BEDSPACER',
    'PRIVATEROOM'
);

-- Utility Type
CREATE TYPE utility_type AS ENUM (
    'ELECTRICITY',
    'WATER',
    'INTERNET'
);

-- User Role
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'property_admin',
    'property_manager',
    'property_accountant',
    'property_maintenance',
    'property_utility',
    'property_frontdesk',
    'property_tenant',
    'property_guest'
);
```

## Access Control

### Role-Based Permissions

1. **Admin Level** (super_admin, property_admin)
   - Full CRUD operations
   - Can change tenant status
   - Can delete tenants
   - Can edit all fields

2. **Staff Level** (property_manager, property_frontdesk)
   - Create new tenants
   - View tenant details
   - Limited edit capabilities
   - Cannot delete tenants

3. **View Only**
   - View tenant details
   - No edit/delete permissions

## Core Features

### 1. Tenant Management
- Create new tenants with user association
- Update tenant information
- View tenant details and history
- Manage tenant status changes
- Handle emergency contact information

### 2. Rental_unit Assignment
- Property selection with filtered rental_unit
- Rental_unit status management
- Automatic status updates
- Property-based rental_unit filtering

### 3. Contract Management
- Contract date validation
- Rate and deposit handling
- Status tracking
- Notes and additional information

### 4. Financial Tracking
- Monthly rate management
- Security deposit tracking
- Payment schedule integration
- Billing status monitoring

## Data Flow

### Create/Update Flow
1. Property Selection
   - Triggers rental_unit list filtering
   - Updates available rental_unit

2. Rental_unit Assignment
   - Validates rental_unit availability
   - Updates rental_unit status

3. User Association
   - Links to profile
   - Manages contact details

4. Contract Details
   - Validates dates
   - Sets rates and deposits

5. Status Management
   - Updates tenant status
   - Handles rental_unit status changes

### Rental_unit Status Flow
1. Rental_unit Selection
2. Status Validation
3. Status Update
4. Error Handling
5. Rollback Mechanism

## Data Validation

### Required Validations
1. Contract Dates
   - Start date before end date
   - Valid date formats
   - Future dates for new contracts

2. Financial Information
   - Non-negative amounts
   - Valid currency formats
   - Minimum amounts

3. Contact Information
   - Valid email formats
   - Required phone numbers
   - Complete addresses

4. Rental_unit Assignment
   - Rental_unit availability
   - Property association
   - Status compatibility

## Financial Integration

### Payment Schedule Display
- Next payment due date
- Payment amount
- Payment status
- Payment frequency

### Outstanding Balances
- Current balance
- Overdue amounts
- Upcoming payments
- Security deposit status

## Error Handling

### Validation Errors
- Field-level validation
- Form-level validation
- Custom error messages
- User-friendly notifications

### Transaction Errors
- Rollback mechanisms
- Error logging
- User notifications
- Recovery procedures

## UI/UX Guidelines

### List View
- Tenant name and rental_unit
- Contract dates
- Tenant status
- Monthly rate
- Property grouping/filtering
- Next payment due
- Outstanding payables
- Status color coding
- Quick action buttons
- Responsive layout

### Form View
- Logical field grouping
- Dynamic rental_unit selection
- Clear validation feedback
- Status change confirmation
- Cancel/Save actions
- Required field indicators
- Proper field spacing
- Mobile-friendly inputs

### Status Indicators
- Color-coded status badges
- Clear status labels
- Status change history
- Visual state transitions

## Recommended Improvements

1. **Search and Filtering**
   - Text search for tenants
   - Filter by property/status
   - Date range filtering
   - Advanced search options

2. **Pagination**
   - Server-side pagination
   - Configurable page size
   - Page navigation controls

3. **Real-time Updates**
   - Supabase subscriptions
   - Live status updates
   - Payment notifications

4. **Export Features**
   - CSV/Excel export
   - Tenant reports
   - Financial summaries

5. **Batch Operations**
   - Bulk status updates
   - Mass notifications
   - Batch contract renewals

6. **Enhanced Financial Integration**
   - Payment reminders
   - Late payment tracking
   - Automated billing
   - Receipt generation

7. **Advanced Reporting**
   - Occupancy reports
   - Financial analytics
   - Tenant history
   - Contract summaries
