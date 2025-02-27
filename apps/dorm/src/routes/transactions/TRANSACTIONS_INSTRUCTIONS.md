```markdown
# Transaction Management Module Instructions

## Overview
The `/dorm/transactions` route provides a comprehensive view of all financial transactions in the dormitory system. Its primary functions include:
- **Transaction History:** Display a comprehensive list of all payments with their status, method, and receipt details.
- **Transaction Details:** View detailed information for each transaction.
- **Receipt Management:** Manage and access payment receipts.
- **Transaction Analysis:** Analyze and report on payment trends, methods, and statuses.

This module works closely with the payments module to provide clear and accurate financial records.

---

## Database Schema

### Payments Table
```sql
create table public.payments (
  id serial not null,
  amount numeric(10, 2) not null,
  method public.payment_method not null,
  reference_number text null,
  paid_by text not null,
  paid_at timestamp with time zone not null,
  notes text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  receipt_url text null,
  created_by uuid null,
  updated_by uuid null,
  updated_at timestamp with time zone null,
  billing_ids integer[] not null,
  billing_changes jsonb null,
  constraint payments_pkey primary key (id),
  constraint payments_created_by_fkey foreign KEY (created_by) references profiles (id),
  constraint payments_updated_by_fkey foreign KEY (updated_by) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_payments_created_by on public.payments using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_payments_paid_at on public.payments using btree (paid_at) TABLESPACE pg_default;

create index IF not exists idx_payments_updated_by on public.payments using btree (updated_by) TABLESPACE pg_default;

create trigger update_billing_after_payment
after INSERT on payments for EACH row
execute FUNCTION update_billing_status ();


create table public.billings (
  id serial not null,
  lease_id integer not null,
  type public.billing_type not null,
  utility_type public.utility_type null,
  amount numeric(10, 2) not null,
  paid_amount numeric(10, 2) null default 0,
  balance numeric(10, 2) not null,
  status public.payment_status not null default 'PENDING'::payment_status,
  due_date date not null,
  billing_date date not null,
  penalty_amount numeric(10, 2) null default 0,
  notes text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null,
  constraint billings_pkey primary key (id),
  constraint billings_lease_id_fkey foreign KEY (lease_id) references leases (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_billings_due_date on public.billings using btree (due_date) TABLESPACE pg_default;

create index IF not exists idx_billings_lease on public.billings using btree (lease_id) TABLESPACE pg_default;

create index IF not exists idx_billings_status on public.billings using btree (status) TABLESPACE pg_default;

create trigger update_billings_updated_at BEFORE
update on billings for EACH row
execute FUNCTION update_updated_at_column ();

create table public.leases (
  id serial not null,
  rental_unit_id integer not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(10, 2) not null,
  security_deposit numeric(10, 2) not null,
  balance numeric(10, 2) null default 0,
  notes text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null,
  created_by uuid null,
  terms_month integer null,
  status public.lease_status not null default 'ACTIVE'::lease_status,
  unit_type public.unit_type null,
  constraint leases_pkey primary key (id),
  constraint leases_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint leases_rental_unit_id_fkey foreign KEY (rental_unit_id) references rental_unit (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_leases_dates on public.leases using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_leases_location on public.leases using btree (rental_unit_id) TABLESPACE pg_default;

create index IF not exists idx_leases_rental_unit_id on public.leases using btree (rental_unit_id) TABLESPACE pg_default;

create trigger update_leases_updated_at BEFORE
update on leases for EACH row
execute FUNCTION update_updated_at_column ();
```

---

## Core Features

### 1. Transaction History
- **Data Retrieval:**  
  The system queries the `public.payments` table to display all transactions, focusing on:
  - **`id`**: Unique identifier.
  - **`amount`**: Payment value.
  - **`method`**: Payment method, which supports filtering.
  - **`paid_by` & `paid_at`**: Identifies who made the payment and when.
- **Filtering & Sorting:**  
  - **Date Range:** Filter transactions using the `paid_at` timestamp.
  - **Payment Method:** Filter by the `method` field.
  - **Search by Tenant/Rental Unit:** Although the table does not directly include rental unit data, joins with related tables enable these searches.
  - **Indexes:** Utilize indexes on `paid_at`, `created_by`, and `updated_by` for performance.
- **Export Capability:**  
  Enable users to export the complete transaction dataset, including columns such as `reference_number`, `notes`, and `billing_ids`.

---

### 2. Transaction Details
- **Detailed View Composition:**  
  When a transaction is selected, display:
  - **Payment Information:** Fields like `amount`, `method`, `reference_number`, and `notes`.
  - **Timestamps:** Information from `paid_at`, `created_at`, and `updated_at` for audit trails.
  - **Billing Linkage:**  
    - **`billing_ids` & `billing_changes`:** Connect the payment to its corresponding billing records and track any modifications.
  - **User Metadata:**  
    - **`created_by` & `updated_by`:** Links to the profiles table, ensuring accountability.

---

### 3. Receipt Management
- **Receipt Handling:**  
  - **`receipt_url`:** Provides a digital link to the payment receipt.
  - **Features:**
    - **Viewing & Downloading:** Users can click to view or download receipts.
    - **History Tracking:** Receipt-related events are managed by system triggers (e.g., `update_billing_after_payment`), ensuring up-to-date status.

---

### 4. Transaction Analysis
- **Analytical Reporting:**  
  - **Trend Analysis:**  
    - Use the `amount` and `paid_at` fields to analyze payment trends over time.
  - **Method-Based Tracking:**  
    - Aggregate data based on the `method` field to monitor the popularity and frequency of payment methods.
  - **Status Monitoring:**  
    - Leverage the `billing_changes` JSONB field to track any changes in billing or transaction status.
  - **Report Generation:**  
    - Generate comprehensive reports that provide actionable insights for management and accounting.

---

## Role-Based Access Control (RBAC)

### Admin (super_admin, property_admin)
- **Access Rights:**
  - Full access to all transactions, including detailed metadata.
  - Can view, export, and download all transaction data and receipts.
  - Access to all reports and analytical tools.

### Accountant
- **Access Rights:**
  - Full access to all transaction records.
  - Ability to generate detailed financial reports.
  - Access to complete receipt histories.

### Manager
- **Access Rights:**
  - View transaction history with basic details.
  - Access to essential reports and download options.
  - Ability to view receipts.

### Frontdesk
- **Access Rights:**
  - Basic access to recent transactions.
  - Can view transaction details and receipts.
  - Limited report generation capabilities.

### Tenant
- **Access Rights:**
  - Restricted view limited to their own transactions.
  - Can view personal transaction history, receipts, and payment statuses.

---

## Summary
The Transaction Management Module is designed to integrate seamlessly with the `payments` table schema. By leveraging structured data fields, robust indexing, and foreign key relationships, the module provides:
- A comprehensive transaction history.
- Detailed transaction insights.
- Efficient receipt management.
- Advanced analytical reporting.

The module ensures that each user role accesses the appropriate level of data, maintaining high performance, security, and data integrity throughout the dormitory system.