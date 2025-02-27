Prompt: Create a Monthly Payment Report Route
Objective
Develop an endpoint (route "lease-report") that generates a monthly payment report listing all active leases, grouped by floor and rental unit, with each tenant (occupant) shown on a separate row.

Data Requirements & Table Relationships
Floors

Table: floors
Key Fields: id, floor_number
Relationship:
One floor can have many rental_unit records (floor_id in rental_unit).
Rental Units (Rooms)

Table: rental_unit
Key Fields: id, name, capacity, floor_id
Relationship:
One rental_unit can have many leases (via rental_unit_id in leases).
Leases

Table: leases
Key Fields: id, rental_unit_id, name, start_date, end_date, rent_amount, security_deposit, status
Relationship:
One lease is linked to one rental_unit.
One lease can be linked to multiple tenants through the lease_tenants join table.
Lease-Tenants (Join Table)

Table: lease_tenants
Key Fields: id, lease_id, tenant_id
Relationship:
Many-to-many relationship between leases and tenants.
Tenants

Table: tenants
Key Fields: id, name, contact_number, email
Relationship:
One tenant can belong to multiple leases, but for this report, we focus on active lease-tenant links.
Billings

Table: billings
Key Fields: id, lease_id, type (e.g., RENT, UTILITIES), amount, status, due_date, billing_date
Relationship:
One lease can have multiple billings.
Payment status for each month’s rent or utilities is typically derived from this table’s status field (e.g., PAID, PENDING, etc.).
Payments (If needed for more detailed paid amounts)

Table: payments
Key Fields: id, amount, billing_ids, paid_at, status
Relationship:
May be used to show partial or full payments for each billing.
Report Structure
Grouping & Headers

Group by Floor (using floor_number from floors).
Under each floor, list Rental Units (Rooms) (rental_unit.name, possibly rental_unit.capacity).
For each rental unit, display all active leases (leases.status = 'ACTIVE').
For each active lease, show one row per tenant (joined via lease_tenants → tenants).
Columns

Floor
E.g., Second Floor, Third Floor, etc.
Room Name (from rental_unit.name)
Occupant Capacity (from rental_unit.capacity)
Lease Name (from leases.name)
Security Deposit (from leases.security_deposit)
Date Started (from leases.start_date)
Tenant (Occupant) Name (from tenants.name)
Monthly Rent Payment Status (for 6 months, e.g., January–June)
Derived from billings where type = 'RENT' and lease_id matches, with a billing_date or due_date in each respective month.
Monthly Utilities Payment Status (for 6 months, e.g., January–June)
Derived from billings where type = 'UTILITIES' and lease_id matches, with a billing_date or due_date in each respective month.
Note: You can define which 6 months to display (e.g., the current or upcoming 6 months) by filtering billings based on due_date or billing_date.

Payment Status Logic

Use the billings.status field (or combine with payments table data if you need partial payment details).
Common statuses could be: PAID, PENDING, OVERDUE, etc.
Display a concise indicator (e.g., "PAID", "PENDING") under each month’s column.
Output Format

Should replicate the style of the example screenshot, i.e., a table-like format (HTML, PDF, or spreadsheet).
Grouping: Floor → Rental Unit → Lease Rows
One Row per Tenant with columns for each month’s rent and utility status.
Example Layout
mathematica
Copy
Edit
| Floor       | Room Name | Capacity | Lease Name  | Security Deposit | Date Started | Tenant Name   | Rent (Jan) | Rent (Feb) | ... | Utilities (Jan) | Utilities (Feb) | ...
|------------|-----------|----------|-------------|------------------|-------------|---------------|------------|------------|-----|-----------------|-----------------|-----
| 2nd Floor  | Room 201  | 4        | Lease #123  | 2000.00          | 2025-01-01  | John Doe      | PAID       | PENDING    | ... | PAID            | PAID            | ...
| 2nd Floor  | Room 201  | 4        | Lease #123  | 2000.00          | 2025-01-01  | Jane Smith    | PAID       | PENDING    | ... | PAID            | PAID            | ...
| ...        | ...       | ...      | ...         | ...              | ...         | ...           | ...        | ...        | ... | ...             | ...             | ...
Key Steps for Implementation
Fetch Floors:

SELECT * FROM floors WHERE status = 'ACTIVE';
For Each Floor, Fetch Rental Units:

SELECT * FROM rental_unit WHERE floor_id = :floorId;
For Each Rental Unit, Fetch Active Leases:

SELECT * FROM leases WHERE rental_unit_id = :rentalUnitId AND status = 'ACTIVE';
For Each Lease, Fetch Associated Tenants:

Use the join table lease_tenants:
SELECT tenants.* FROM lease_tenants lt JOIN tenants ON lt.tenant_id = tenants.id WHERE lt.lease_id = :leaseId;
For Each Lease (and Tenant), Determine Payment Status for Each Month:

Query billings by lease_id, filtering by type = 'RENT' or type = 'UTILITIES' and due_date (or billing_date) in each month.
Optionally combine with payments if needed to see partial payments.
Aggregate & Format the Data

Construct rows according to the required columns.
Group and label them as per the example table structure.
Goal
By following this prompt, you will create a single route (lease-report) that returns a structured list of Floors → Rooms → Leases → Tenants with monthly rent and utilities payment statuses for a defined 6-month range. This replicates the dormitory-style payment monitoring table shown in your example, ensuring all relevant relationships (floors, rental_unit, leases, lease_tenants, tenants, and billings) are accurately reflected.

## Tables
### floors
- Columns: id, property_id, floor_number, wing, status
### rental_unit
- Columns: id, name, capacity, rental_unit_status, base_rate, property_id, floor_id, type, amenities, number
### leases
- Columns: id, rental_unit_id, name, start_date, end_date, rent_amount, security_deposit, balance, notes, status, unit_type
### lease_tenants
- Columns: id, lease_id, tenant_id
### tenants
- Columns: id, name, contact_number, email, tenant_status
### billings
- Columns: id, lease_id, type, utility_type, amount, paid_amount, balance, status, due_date, billing_date, notes
### properties
- Columns: id, name, address, type, status

## Relationships
- floors.id → rental_unit.floor_id (One-to-Many)
- properties.id → floors.property_id (One-to-Many)
- rental_unit.id → leases.rental_unit_id (One-to-Many)
- leases.id → lease_tenants.lease_id (One-to-Many)
- tenants.id → lease_tenants.tenant_id (One-to-Many)
- leases.id → billings.lease_id (One-to-Many)

## Workflow
1. User loads the lease-report route
2. System fetches all required data (floors, rental units, leases, tenants, billings)
3. Data is organized hierarchically: Floors → Rental Units → Leases → Tenants
4. User can filter the report by:
   - Start month and number of months to display
   - Property
   - Show/hide inactive leases
5. User can print the report or export it

## Key Calculations
- Monthly payment status is determined by checking the billing records for each lease and tenant
- For each month and billing type (RENT or UTILITIES), the status is calculated as:
  - PAID: All billings for that month and type are paid
  - OVERDUE: At least one billing is overdue
  - PARTIAL: At least one billing is partially paid
  - PENDING: Otherwise

## Data Entry Constraints
- Start month must be in YYYY-MM format
- Month count must be between 1 and 12

## Per Component instructions

### @ReportFilter.svelte
#### Description
A form component that allows users to filter the payment report by various criteria
#### Props
- formData: SuperForm data for the filter form
- properties: Array of properties for the property selection dropdown
#### Instructions
- Handles filtering by start month, month count, property, and lease status
- Updates the URL parameters when filters change

### @PaymentReportTable.svelte
#### Description
Displays the payment report data in a table format
#### Props
- reportData: Structured data for the report following the LeaseReportData interface
#### Instructions
- Displays payment status for each tenant, grouped by floor and rental unit
- Shows payment status for both rent and utilities across multiple months
- Uses color-coded badges to indicate payment status
