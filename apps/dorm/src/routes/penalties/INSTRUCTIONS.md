```markdown
# Penalty Billings Feature Page

## Overview
The Penalty Billings feature page is designed for the rental management application to handle penalty charges on overdue or delinquent rental payments. This page allows administrators, accountants, and managers to view, update, and report on penalty billing records, ensuring that all penalty-related financial data is managed efficiently and transparently.

---

## Database Schema

### Billings Table
The following schema defines the `billings` table which is central to managing both regular and penalty charges:

```sql
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
```

---

## Core Features

### 1. Penalty Billing Overview
- **Display Records:**  
  Show a comprehensive list of billing records where a penalty has been applied (`penalty_amount > 0`), along with standard billing details.
- **Filtering & Sorting:**  
  - Filter by due date, billing date, and payment status.
  - Sort by penalty amount or billing date.
  - Search using lease identifiers to quickly locate relevant records.
- **Export Functionality:**  
  Ability to export filtered data for further analysis or reporting.

### 2. Penalty Billing Details
- **Detailed Record View:**  
  When a specific penalty billing record is selected, display:
  - **Billing Information:** `amount`, `paid_amount`, `balance`, and `penalty_amount`.
  - **Dates:** `due_date` and `billing_date`.
  - **Additional Data:** `notes`, `status`, and timestamps (`created_at`, `updated_at`).
  - **Lease Association:**  
    - Use `lease_id` to join with the `leases` table and fetch lease details such as the lease name, ensuring clarity on which lease the penalty is associated with.

### 3. Penalty Calculation & Updates
- **Automated Calculation:**  
  Implement business rules that automatically calculate the penalty amount when a billing record becomes overdue.
- **Manual Adjustments:**  
  Allow authorized users to update or override the penalty amount manually if needed.
- **Real-Time Updates:**  
  Utilize triggers or scheduled tasks to refresh penalty calculations based on updated payment statuses or changes in due dates.

### 4. Reporting and Analysis
- **Trend Analysis:**  
  Generate reports that analyze penalty billing trends over time, helping management identify recurring issues or trends.
- **Custom Reports:**  
  Create and download reports that can include aggregated penalty totals, affected lease details, and overdue payment statistics.
- **Dashboard Integration:**  
  Integrate penalty data into existing financial dashboards to provide a holistic view of overall financial performance.

---

## Summary
The Penalty Billings feature page integrates seamlessly with the existing billing schema, focusing on the `penalty_amount` field to manage overdue charges. It offers:
- A dedicated view for penalty-related billing records.
- Detailed insights and management tools for calculating and adjusting penalties.
- Comprehensive reporting and trend analysis to support proactive financial management.

This feature ensures that all penalty billing data is handled efficiently, with clear visibility for different user roles, thereby enhancing the overall financial integrity of the rental management system.
```