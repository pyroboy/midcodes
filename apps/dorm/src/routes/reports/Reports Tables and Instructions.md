# Reports Tables and Instructions

## Tables

### properties
- Columns: id, name, address, type, status, created_at, updated_at
- Primary purpose: Store information about properties

### floors
- Columns: id, property_id, floor_number, wing, status, created_at, updated_at
- Primary purpose: Store information about floors within properties

### rental_unit
- Columns: id, name, capacity, rental_unit_status, base_rate, created_at, updated_at, property_id, floor_id, type, amenities, number
- Primary purpose: Store information about rental units within floors

### billings
- Columns: id, lease_id, type, utility_type, amount, paid_amount, balance, status, due_date, billing_date, penalty_amount, notes, created_at, updated_at
- Primary purpose: Store billing information for leases

### leases
- Columns: id, rental_unit_id, name, start_date, end_date, rent_amount, security_deposit, balance, notes, created_at, updated_at, created_by, terms_month, status, unit_type
- Primary purpose: Store lease information for rental units

### expenses
- Columns: id, property_id, amount, description, type, status, created_by, created_at
- Primary purpose: Store expense information for properties

### payments
- Columns: id, amount, method, reference_number, paid_by, paid_at, notes, created_at, receipt_url, created_by, updated_by, updated_at, billing_ids, billing_changes
- Primary purpose: Store payment information for billings

## Relationships

- properties.id → floors.property_id (One-to-Many)
- floors.id → rental_unit.floor_id (One-to-Many)
- rental_unit.id → leases.rental_unit_id (One-to-Many)
- leases.id → billings.lease_id (One-to-Many)
- properties.id → expenses.property_id (One-to-Many)
- billings.id → payments.billing_ids (Many-to-Many)

## Workflow

1. The Reports Dashboard displays financial data for a selected month and year.
2. Data is fetched from the database based on the selected period.
3. The dashboard shows:
   - Gross income by floor
   - Operational expenses
   - Capital expenses
   - Profit distribution
   - Final net income

## Key Calculations

1. **Gross Income**: Sum of all rental income for the period, grouped by floor.
2. **Operational Expenses**: Sum of all operational expenses for the period.
3. **Net Before Capital Expenses**: Gross Income - Operational Expenses.
4. **Capital Expenses**: Sum of all capital expenses for the period.
5. **Final Net**: Net Before Capital Expenses - Capital Expenses.
6. **Profit Sharing**:
   - 40% Share: Net Before Capital Expenses * 0.4
   - 60% Share: Net Before Capital Expenses * 0.6

## Data Entry Constraints

- Expenses must be categorized as either OPERATIONAL or CAPITAL.
- Rental income must be associated with a lease and a rental unit.
- Rental units must be associated with a floor.

## Per Component instructions

### ReportsDashboard.svelte
- **Description**: Main dashboard component that displays financial data for a selected month and year.
- **Props**: None (data is loaded from the server)
- **Instructions**: 
  - Displays data in a grid layout with four main sections
  - Allows selection of month and year via dropdowns
  - Updates URL parameters when selection changes
  - Shows loading state while data is being fetched
  - Formats currency values using the Philippine Peso format

### +page.server.ts
- **Description**: Server-side load function that fetches data from the database.
- **Instructions**:
  - Fetches rental income, operational expenses, and capital expenses for the selected period
  - Groups rental income by floor
  - Categorizes expenses based on their descriptions
  - Calculates totals and profit sharing
  - Returns data in the format expected by the dashboard component
