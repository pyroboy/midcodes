# Payments Module Instructions

## Overview
The Payments module manages all financial transactions within the dormitory management system. It handles payment processing, tracking, and management for various types of payments including rent, utilities, security deposits, penalties, and maintenance fees.

## Core Functionality

### 1. Payment Processing
- **Create Payments**
  - Process payments against pending billings
  - Support multiple payment methods:
    - CASH
    - BANK
    - GCASH
    - OTHER
  - Validate payment amounts against billing balances
  - Automatically update billing status and paid_amount
  - Record payment metadata (reference numbers, receipts, notes)
  - Track payment dates and paid_by information

- **Update Payments**
  - Modify payment details (method, reference, receipt URL, notes)
  - Update payment status (Pending, Partial, Paid, Overdue)
  - Restricted to admin and accountant roles
  - Maintain audit trail with created_at timestamps

- **View Payments**
  - Display comprehensive payment information
  - Show related property, floor, and rental_unit details
  - Present payment status with visual indicators
  - Support read-only mode for non-administrative users

### 2. Role-Based Access Control
- **Administrative Roles**
  - super_admin: Full access to all payment functions
  - property_admin: Full access to property-specific payments
  - property_accountant: Can process and manage payments
  - property_frontdesk: Can create new payments only

- **View-Only Roles**
  - property_manager: View access to property payments
  - property_maintenance: View access to maintenance payments
  - property_tenant: View access to own payments only
  - property_guest: View access to own payments only

### 3. Payment Workflow
1. **Payment Initiation**
   - Select pending billing with valid lease_id
   - Enter payment amount (cannot exceed balance)
   - Choose payment method (CASH, BANK, GCASH, OTHER)
   - Add payment details:
     - Payment date (timestamp with timezone)
     - Reference number
     - Paid by information (required)
     - Notes (optional)

2. **Payment Processing**
   - Validate payment details
   - Create payment record
   - Update billing:
     - Add to paid_amount
     - Recalculate balance
     - Update status:
       - PENDING if balance > 0
       - PARTIAL if paid_amount < amount
       - PAID if paid_amount = amount
       - OVERDUE if past due_date
   - Record transaction metadata with UTC timestamps

3. **Payment Management**
   - Track payment status
   - Support payment modifications
   - Calculate penalties using penalty_configs
   - Maintain audit trail with timestamps

## Database Schema Dependencies

### Primary Tables
```sql
-- Payments Table
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
    created_by uuid REFERENCES profiles(id),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by uuid REFERENCES profiles(id),
    updated_at timestamp with time zone
);

-- Billings Table (Referenced)
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

-- Payment Schedules Table (Referenced)
CREATE TABLE public.payment_schedules (
    id integer NOT NULL DEFAULT nextval('payment_schedules_id_seq'::regclass),
    lease_id integer NOT NULL,
    due_date date NOT NULL,
    expected_amount numeric(10,2) NOT NULL,
    type billing_type NOT NULL,
    frequency payment_frequency NOT NULL,
    status payment_status DEFAULT 'PENDING',
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Penalty Configs Table (Referenced)
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

### Enums
```sql
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'BANK',
    'GCASH',
    'OTHER'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE'
);

CREATE TYPE billing_type AS ENUM (
    'RENT',
    'UTILITY',
    'PENALTY',
    'MAINTENANCE',
    'SERVICE'
);

CREATE TYPE payment_frequency AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'ANNUAL',
    'CUSTOM'
);

CREATE TYPE utility_type AS ENUM (
    'ELECTRICITY',
    'WATER',
    'INTERNET'
);
```

## UI Components

### 1. Payment List View
- Display all payments in card format
- Show key payment information:
  - Amount and status
  - Payment method with visual indicators
  - Property, floor, and rental_unit details
  - Reference numbers and receipts
  - Payment dates
  - Notes (if any)
  - Created by information

### 2. Payment Form
- Input fields for:
  - Billing selection (with balance check)
  - Payment amount
  - Payment method
  - Payment date
  - Reference number
  - Receipt URL
  - Notes
- Status selection (for updates)
- Validation and error handling

## Security Considerations

1. **Access Control**
   - Enforce role-based permissions
   - Validate user session
   - Check property access rights
   - Implement RLS policies:
     - super_admin: Full access to all payments
     - property_admin: Full access to property payments
     - property_accountant: Full access to property payments
     - property_manager: View access to property payments
     - property_frontdesk: Create and view property payments
     - property_maintenance: View maintenance payments
     - property_tenant: View own payments
     - property_guest: View own payments

2. **Data Validation**
   - Validate payment amounts against billing balance
   - Check billing status (must be PENDING or PARTIAL)
   - Verify lease_id exists and is active
   - Validate payment method is one of: CASH, BANK, GCASH, OTHER
   - Ensure proper timezone-aware timestamps
   - Validate utility_type if billing type is UTILITY
   - Check penalty calculations against penalty_configs

3. **Audit Trail**
   - Record creator information
   - Track status changes
   - Maintain payment history
   - Log all modifications

## Error Handling

1. **Common Errors**
   - Insufficient permissions
   - Invalid payment amount
   - Non-pending billing
   - Missing required fields
   - Invalid reference format
   - Balance exceeded

2. **Error Responses**
   - Clear error messages
   - User-friendly notifications
   - Proper status codes
   - Form validation feedback
   - Transaction rollback on failure

## Future Enhancements

1. **Payment Features**
   - Batch payment processing
   - Payment scheduling
   - Recurring payment setup
   - Payment reminders
   - Receipt generation
   - Digital payment integration

2. **Integration Options**
   - Payment gateway integration
   - Mobile payment support
   - Bank API integration
   - Automated reconciliation
   - QR code payments

3. **Reporting**
   - Payment analytics
   - Financial reports
   - Audit reports
   - Transaction summaries
   - Revenue forecasting

## Technical Notes

1. **Form Handling**
   - Uses sveltekit-superforms for form management
   - Implements Zod schema validation for:
     - Required fields: billing_id, amount, method, paid_by, paid_at
     - Optional fields: reference_number, notes
   - Validates timestamps in UTC
   - Handles form submission asynchronously
   - Manages file uploads for receipts

2. **State Management**
   - Manages form state locally using SvelteKit stores
   - Updates UI reactively based on payment status
   - Handles loading states during async operations
   - Maintains edit/view modes based on user role
   - Implements optimistic updates with rollback
   - Tracks billing balance and status changes

3. **API Integration**
   - Uses Supabase for data operations
   - Implements proper error handling with rollbacks
   - Manages database transactions for payment updates
   - Handles concurrent updates with locks
   - Respects RLS policies per property role
   - Enforces timezone-aware timestamp handling
   - Validates foreign key constraints:
     - billing_id references billings.id
     - lease_id in billings references leases.id
