# Rental Management System Implementation Plan

## Overview

This document outlines a comprehensive implementation plan for connecting the Rent Collection Dashboard to the property management database. The Svelte dashboard UI will be transformed from using hard-coded data to retrieving and displaying real-time information from the underlying database.

## Database Schema & Relations

The implementation will utilize the following database tables:

### Core Property Data

#### Properties Table

- `id` (integer, PK) - Unique property identifier
- `name` (text) - Property name
- `address` (text) - Property location
- `type` (text) - Property type
- `status` (property_status) - Current property status (ACTIVE, etc.)
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

#### Floors Table

- `id` (integer, PK) - Unique floor identifier
- `property_id` (integer, FK) - References properties.id
- `floor_number` (integer) - Numeric floor identifier (2nd floor, 3rd floor)
- `wing` (text) - Section identifier if applicable
- `status` (floor_status) - Floor status (ACTIVE, etc.)
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

#### Rental Units Table

- `id` (integer, PK) - Unique unit identifier
- `property_id` (integer, FK) - References properties.id
- `floor_id` (integer, FK) - References floors.id
- `name` (text) - Unit name
- `number` (integer) - Unit number
- `type` (text) - Unit type
- `base_rate` (numeric) - Standard rental rate
- `rental_unit_status` (location_status) - Occupancy status (VACANT, OCCUPIED)
- `amenities` (jsonb) - JSON field for unit features
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

#### Meters Table

- `id` (integer, PK) - Unique meter identifier
- `name` (text) - Meter identifier
- `location_type` (meter_location_type) - Location type enum
- `property_id` (integer, FK) - References properties.id
- `floor_id` (integer, FK) - References floors.id
- `rental_unit_id` (integer, FK) - References rental_unit.id
- `type` (utility_type) - Utility type (WATER, ELECTRICITY)
- `is_active` (boolean) - Whether meter is currently in use
- `status` (meter_status) - Current meter status
- `notes` (text) - Additional information
- `created_at` (timestamp) - Creation timestamp
- `initial_reading` (numeric) - Initial meter reading

### Tenant & Contract Data

#### Tenants Table

- `id` (integer, PK) - Unique tenant identifier
- `name` (text) - Tenant name
- `contact_number` (text) - Phone contact
- `email` (character varying) - Email contact
- `emergency_contact` (jsonb) - JSON field for emergency contacts
- `tenant_status` (tenant_status) - Current status
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `auth_id` (uuid) - Authentication reference
- `created_by` (uuid) - User who created record

#### Leases Table

- `id` (integer, PK) - Unique lease identifier
- `rental_unit_id` (integer, FK) - References rental_unit.id
- `name` (text) - Lease identifier
- `start_date` (date) - Start of lease period
- `end_date` (date) - End of lease period
- `rent_amount` (numeric) - Monthly rent
- `security_deposit` (numeric) - Initial deposit
- `balance` (numeric) - Current balance
- `notes` (text) - Additional information
- `status` (lease_status) - Lease status (ACTIVE, etc.)
- `unit_type` (unit_type) - Type of unit being leased
- `terms_month` (integer) - Duration in months
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `created_by` (uuid) - User who created record

#### Lease Tenants Table

- `id` (integer, PK) - Unique record identifier
- `lease_id` (integer, FK) - References leases.id
- `tenant_id` (integer, FK) - References tenants.id
- `created_at` (timestamp) - Creation timestamp

### Financial Data

#### Billings Table

- `id` (integer, PK) - Unique billing identifier
- `lease_id` (integer, FK) - References leases.id
- `type` (billing_type) - Billing category
- `utility_type` (utility_type) - For utility-specific bills
- `amount` (numeric) - Total amount
- `paid_amount` (numeric) - Amount already paid
- `balance` (numeric) - Remaining balance
- `status` (payment_status) - Payment status
- `due_date` (date) - Payment due date
- `billing_date` (date) - Date of billing
- `penalty_amount` (numeric) - Late fees if applicable
- `notes` (text) - Additional information
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

#### Payments Table

- `id` (integer, PK) - Unique payment identifier
- `amount` (numeric) - Payment amount
- `method` (payment_method) - Payment method
- `reference_number` (text) - Transaction reference
- `paid_by` (text) - Person who made payment
- `paid_at` (timestamp) - Payment timestamp
- `notes` (text) - Additional information
- `receipt_url` (text) - Link to receipt
- `billing_ids` (integer[]) - Array of billing IDs this payment applies to
- `billing_changes` (jsonb) - JSON field for payment allocation details
- `created_at` (timestamp) - Creation timestamp
- `created_by` (uuid) - User who created record
- `updated_by` (uuid) - User who last updated record
- `updated_at` (timestamp) - Last update timestamp

#### Expenses Table

- `id` (integer, PK) - Unique expense identifier
- `property_id` (integer, FK) - References properties.id
- `amount` (numeric) - Expense amount
- `description` (text) - Expense details
- `type` (expense_type) - Expense category (OPERATIONAL, CAPITAL, etc.)
- `status` (expense_status) - Expense status
- `created_by` (uuid) - User who recorded expense
- `created_at` (timestamp) - When expense was recorded

#### Readings Table

- `id` (integer, PK) - Unique reading identifier
- `meter_id` (integer, FK) - References meters.id
- `reading` (numeric) - Current meter reading
- `reading_date` (date) - Date reading was taken
- `consumption` (numeric) - Usage since last reading
- `cost` (numeric) - Calculated cost for this reading
- `cost_per_unit` (numeric) - Rate applied
- `previous_reading` (numeric) - Last recorded reading
- `meter_name` (text) - Name of the meter
- `created_at` (timestamp) - Creation timestamp

## Data Mapping Implementation

### Income Data Structure

The dashboard's income structure will map to the database as follows:

```
Dashboard Structure                 Database Mapping
------------------------------------------------------------------------------
floorData.secondFloor.income  →     SUM(leases.rent_amount)
                                    WHERE floors.floor_number = 2

floorData.thirdFloor.income   →     SUM(leases.rent_amount)
                                    WHERE floors.floor_number = 3

Floor notes                   →     Custom field derived from billings.notes or
                                    other special payment conditions
```

### Expenses Structure

The dashboard's expenses structure will map to the database as follows:

```
Dashboard Structure                 Database Mapping
------------------------------------------------------------------------------
operationalExpenses           →     Filtered expenses where type = 'OPERATIONAL'
                                    grouped by specific categories:
                                    - electricity
                                    - water
                                    - janitorialSupplies
                                    - internet
                                    - janitorialService

                                    Additionally, utility expenses can be derived
                                    from readings.cost for corresponding meters

capitalExpenses              →      Filtered expenses where type = 'CAPITAL'
                                    grouped by specific categories:
                                    - repairs
                                    - cctvInstallation
                                    - airconDownpayment
                                    - other capital improvements
```

### Financial Calculations

The dashboard's calculated totals will be derived as follows:

```
Dashboard Structure                 Database Calculation
------------------------------------------------------------------------------
grossIncome                  →      SUM of all floor incomes

operationalExpenses          →      SUM of all operational expense categories

netBeforeCapEx               →      grossIncome - operationalExpenses

capitalExpenses              →      SUM of all capital expense categories

finalNet                     →      netBeforeCapEx - capitalExpenses

profitSharing.forty          →      netBeforeCapEx * 0.4

profitSharing.sixty          →      netBeforeCapEx * 0.6
```

## Implementation Phases

### Phase 1: Database Connection & Base API

1. **Create API Endpoints**

   - Implement `/api/properties` endpoint
   - Implement `/api/floors/:propertyId` endpoint
   - Implement `/api/units/:floorId` endpoint
   - Implement `/api/leases/active` endpoint
   - Implement `/api/expenses/monthly/:year/:month` endpoint

2. **Update Dashboard Service Layer**
   - Create database connection service
   - Implement data fetching and transformation functions
   - Create caching mechanism for frequently accessed data

### Phase 2: Dashboard UI Update

1. **Modify Dashboard Components**

   - Update `RentCollectionDashboard.svelte` to fetch from API
   - Implement loading states during data retrieval
   - Add error handling for failed requests
   - Ensure reactive updates when data changes

2. **Enhance Filtering Capabilities**
   - Implement year/month selection to filter data
   - Add property selection dropdown if multiple properties exist
   - Create filter persistence mechanism

### Phase 3: Data Entry & Management

1. **Add Data Management Forms**

   - Create income entry/modification form
   - Implement expense entry/categorization form
   - Add utility reading input interface
   - Build payment recording system

2. **Implement Data Validation**
   - Add form validation for all inputs
   - Implement business logic rules
   - Create confirmation workflows for data changes

### Phase 4: Reporting & Analytics

1. **Create Financial Reports**

   - Implement monthly financial summary report
   - Create quarterly comparison reports
   - Build year-over-year analysis tools
   - Add export functionality (PDF, Excel)

2. **Develop Analytics Dashboard**
   - Create occupancy rate tracking
   - Implement expense trend analysis
   - Build income projection tools
   - Add profit margin visualization

## SQL Query Examples

### Monthly Income Query

```sql
SELECT
    f.floor_number,
    SUM(l.rent_amount) AS total_income,
    STRING_AGG(DISTINCT b.notes, ', ') AS floor_notes
FROM
    leases l
JOIN
    rental_unit ru ON l.rental_unit_id = ru.id
JOIN
    floors f ON ru.floor_id = f.id
LEFT JOIN
    billings b ON l.id = b.lease_id
WHERE
    l.status = 'ACTIVE'
    AND (l.start_date <= $end_date AND l.end_date >= $start_date)
    AND f.property_id = $property_id
GROUP BY
    f.floor_number;
```

### Monthly Expenses Query

```sql
SELECT
    e.type AS expense_type,
    e.description,
    SUM(e.amount) AS total_amount
FROM
    expenses e
WHERE
    e.created_at BETWEEN $start_date AND $end_date
    AND e.property_id = $property_id
    AND e.status = 'APPROVED'
GROUP BY
    e.type, e.description
ORDER BY
    e.type, SUM(e.amount) DESC;
```

### Utility Expense Query

```sql
SELECT
    m.type AS utility_type,
    SUM(r.cost) AS total_cost
FROM
    readings r
JOIN
    meters m ON r.meter_id = m.id
WHERE
    r.reading_date BETWEEN $start_date AND $end_date
    AND m.property_id = $property_id
    AND m.is_active = true
GROUP BY
    m.type;
```

## Next Steps & Recommendations

1. **Implement User Authentication**

   - Add role-based access control
   - Create audit trail for financial changes
   - Implement digital signatures for approvals

2. **Enhance Mobile Experience**

   - Optimize dashboard for mobile devices
   - Create dedicated mobile app for field data collection
   - Implement push notifications for important alerts

3. **Add Integration Capabilities**
   - Implement accounting software integration
   - Add payment gateway connections
   - Create API for third-party integrations
   - Build document management system integration
