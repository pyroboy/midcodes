# Lease Report Tables and Instructions

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

### @ConsolidatedPaymentReportTable.svelte
#### Description
Displays the payment report data in a consolidated table format where rent and utilities payments are shown in a single column for each month
#### Props
- reportData: Structured data for the report following the LeaseReportData interface
#### Instructions
- Displays payment status for each tenant, grouped by floor and rental unit
- For each month, shows both rent and utilities payment status as separate badges stacked vertically
- Uses color-coded badges to indicate payment status:
  - Green: PAID
  - Blue: PARTIAL
  - Yellow: PENDING
  - Red: OVERDUE
- Provides tooltips with detailed payment information when hovering over tenant names or status badges
- Optimizes space by consolidating monthly columns to show both rent and utilities status within each month