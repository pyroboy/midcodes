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
2. User selects a property, year, and month using the filter controls.
3. The system fetches data for the selected period and displays:
   - Gross income broken down by floor
   - Operational expenses (individual items and total)
   - Capital expenses (individual items and total)
   - Net income and profit distribution

## Key Calculations

1. **Gross Income**: Sum of all rental income for the period, grouped by floor.
2. **Operational Expenses**: Sum of all expenses with type = 'OPERATIONAL' for the period.
3. **Capital Expenses**: Sum of all expenses with type = 'CAPITAL' for the period.
4. **Net Income Before Capital**: Gross Income - Operational Expenses.
5. **Profit Sharing**:
   - 40% Share: (Gross Income - Operational Expenses) \* 0.4
   - 60% Share: (Gross Income - Operational Expenses) \* 0.6 - Capital Expenses
6. **Final Net Income**: Gross Income - (Operational Expenses + Capital Expenses).

## Business Rules

1. **Income Allocation**:

   - Operational expenses reduce both the 40% and 60% shares proportionally.
   - Capital expenses are deducted only from the 60% share.

2. **Expense Classification**:
   - **Operational Expenses**: Regular, recurring costs necessary for day-to-day operations (utilities, supplies, maintenance).
   - **Capital Expenses**: Long-term investments and major improvements (renovations, equipment purchases, etc.).

## Data Entry Constraints

- Expenses must be categorized as either 'OPERATIONAL' or 'CAPITAL'.
- All expenses must have a description, amount, and property ID.
- Rental income must be associated with a lease and a rental unit.
- Rental units must be associated with a floor.

## Per Component Instructions

### ReportsDashboard.svelte

- **Description**: Main dashboard component that displays financial data for a selected period.
- **Props**:
  - `reportData`: Financial data for the selected period (MonthData)
  - `year`: Selected year (string)
  - `month`: Selected month (string)
  - `propertyId`: Selected property ID (string or null)
  - `properties`: List of available properties (Property[])
- **Instructions**:
  - Displays data in a grid layout with sections for income, expenses, and profit distribution
  - Allows selection of property, year, and month via dropdowns
  - Updates URL parameters when selection changes
  - Shows loading state while data is being fetched
  - Formats all currency values using Philippine Peso format
  - Groups expenses by type and displays them in separate tables
  - Calculates and displays profit sharing according to the business rules

### +page.server.ts

- **Description**: Server-side load function that fetches financial data from the database.
- **Functionality**:
  - Validates user session
  - Retrieves filter parameters (property, year, month) from URL or uses defaults
  - Fetches properties list for dropdown selection
  - If property is selected, fetches rental income, expenses, and related data
  - Groups and processes data according to the business rules
  - Returns formatted data to the client
- **Implementation Notes**:
  - Uses Supabase queries to fetch data from the database
  - Processes floor data by mapping lease IDs to rental units and floors
  - Categorizes expenses by type
  - Calculates profit sharing according to the business rules

### +page.svelte

- **Description**: Simple wrapper component that passes data to the ReportsDashboard.
- **Functionality**:
  - Receives data from the server via the `data` prop
  - Passes data to the ReportsDashboard component

### ReportsSchema.ts

- **Description**: Zod schema definitions for validating data structures.
- **Schemas**:
  - `ExpenseSchema`: Validates expense data
  - `FloorDataSchema`: Validates floor income data
  - `FloorDataMapSchema`: Validates the mapping of floors to income data
  - `ProfitSharingSchema`: Validates profit sharing calculations
  - `TotalsSchema`: Validates financial totals
  - `MonthDataSchema`: Validates the complete monthly financial data structure
  - `PropertySchema`: Validates property data
  - `MonthSchema`: Validates month selections
  - `FilterParamsSchema`: Validates filter parameters

### types.ts

- **Description**: TypeScript type definitions for use across components.
- **Types**:
  - `FloorData`, `FloorName`, `FloorDataMap`: Types for floor-related data
  - `Expense`: Type for expense data
  - `MonthData`: Type for complete monthly financial data
  - `Property`: Type for property data
  - `Month`: Type for month selections
  - `ProfitSharingCalculation`: Type for profit sharing results
