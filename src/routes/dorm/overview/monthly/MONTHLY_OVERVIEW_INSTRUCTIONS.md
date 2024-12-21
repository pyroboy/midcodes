# Monthly Overview Route Instructions

## Overview
The Monthly Overview route serves as a comprehensive financial and occupancy dashboard for property managers. Its primary purpose is to provide a clear month-by-month view of:

1. **Financial Health**
   - Tenant payment histories and current balances
   - Rent collection status
   - Utility payment tracking
   - Outstanding balances and aging
   - Penalty accumulation
   - Monthly expense tracking
   - Payment schedule monitoring
   - Security deposit management

2. **Occupancy Management**
   - Room status (Vacant/Occupied/Reserved)
   - Tenant assignments and capacity utilization
   - Lease status and expiration tracking
   - Room type distribution
   - Floor-wise organization
   - Wing assignments

3. **Utility Monitoring**
   - Meter readings and consumption patterns
   - Utility billing status
   - Rate adjustments and charges
   - Latest reading tracking
   - Unit rate management

4. **Maintenance Tracking**
   - Active maintenance issues
   - Issue resolution status
   - Completion tracking
   - Room maintenance history
   - Priority management

## Key Goals

1. **Financial Oversight**
   - Track monthly revenue streams (rent, utilities, other charges)
   - Monitor payment compliance and identify delayed payments
   - Analyze payment patterns for better forecasting
   - Calculate occupancy rates and revenue per room
   - Track property expenses and budgets
   - Monitor upcoming payment schedules
   - Manage security deposits effectively

2. **Operational Efficiency**
   - Quick identification of vacant rooms for marketing
   - Early warning for lease expirations
   - Streamlined utility billing process
   - Automated penalty calculations
   - Maintenance issue tracking
   - Floor-wise organization of data
   - Batch operations for common tasks

3. **Decision Support**
   - Identify problematic payment patterns
   - Guide room rate adjustments based on occupancy
   - Support maintenance scheduling decisions
   - Help optimize utility rate structures
   - Expense analysis and budgeting
   - Resource allocation for maintenance
   - Occupancy optimization

4. **Compliance & Reporting**
   - Generate monthly financial summaries
   - Track security deposit status
   - Monitor lease agreement compliance
   - Document utility consumption patterns
   - Maintenance record keeping
   - Expense documentation
   - Payment schedule tracking

5. **Maintenance Management**
   - Track maintenance requests and status
   - Monitor completion rates
   - Document maintenance history
   - Prioritize maintenance tasks
   - Resource allocation tracking
   - Cost monitoring for repairs

6. **Expense Management**
   - Track monthly property expenses
   - Monitor expense categories
   - Budget compliance checking
   - Expense approval workflow
   - Payment status tracking
   - Vendor payment management

## Target Users
1. **Property Managers**: Daily operations and tenant management
2. **Financial Staff**: Revenue tracking and payment processing
3. **Maintenance Staff**: Room status and utility monitoring
4. **Property Owners**: Financial performance overview
5. **Accountants**: Expense tracking and reconciliation
6. **Maintenance Supervisors**: Issue tracking and resource allocation

## Database Schema Dependencies

### Primary Tables
```sql
-- Properties Table
CREATE TABLE public.properties (
    id integer NOT NULL DEFAULT nextval('properties_id_seq'::regclass),
    name text NOT NULL,
    address text NOT NULL,
    type text NOT NULL,
    status property_status NOT NULL DEFAULT 'ACTIVE',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Floors Table
CREATE TABLE public.floors (
    id integer NOT NULL DEFAULT nextval('floors_id_seq'::regclass),
    property_id integer NOT NULL,
    floor_number integer NOT NULL,
    wing text,
    status floor_status NOT NULL DEFAULT 'ACTIVE',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Rooms Table
CREATE TABLE public.rooms (
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    name text NOT NULL,
    number integer NOT NULL,
    capacity integer NOT NULL,
    room_status location_status NOT NULL DEFAULT 'VACANT',
    base_rate numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    property_id integer NOT NULL,
    floor_id integer NOT NULL,
    type text NOT NULL,
    amenities jsonb DEFAULT '{}'
);

-- Maintenance Table
CREATE TABLE public.maintenance (
    id integer NOT NULL DEFAULT nextval('maintenance_id_seq'::regclass),
    location_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status maintenance_status DEFAULT 'PENDING',
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Expenses Table
CREATE TABLE public.expenses (
    id integer NOT NULL,
    property_id integer,
    amount numeric(10,2) NOT NULL,
    description text NOT NULL,
    type expense_type NOT NULL,
    status expense_status NOT NULL DEFAULT 'PENDING',
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Leases Table
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
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Lease Tenants Table
CREATE TABLE public.lease_tenants (
    id integer NOT NULL DEFAULT nextval('lease_tenants_id_seq'::regclass),
    lease_id integer NOT NULL,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tenants Table
CREATE TABLE public.tenants (
    id integer NOT NULL DEFAULT nextval('tenants_id_seq'::regclass),
    name text NOT NULL,
    contact_number text,
    email character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    auth_id uuid
);

-- Billings Table
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

-- Payments Table
CREATE TABLE public.payments (
    id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
    billing_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    method payment_method NOT NULL,
    reference_number text,
    paid_by text NOT NULL,
    paid_at timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Payment Schedules Table
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

-- Penalty Configs Table
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

-- Meters Table
CREATE TABLE public.meters (
    id integer NOT NULL DEFAULT nextval('meters_id_seq'::regclass),
    name text NOT NULL,
    location_type meter_location_type NOT NULL,
    property_id integer,
    floor_id integer,
    rooms_id integer,
    type utility_type NOT NULL,
    is_active boolean DEFAULT true,
    status meter_status NOT NULL DEFAULT 'ACTIVE',
    initial_reading numeric(10,2) NOT NULL DEFAULT 0,
    unit_rate numeric(10,2) NOT NULL DEFAULT 0,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Readings Table
CREATE TABLE public.readings (
    id integer NOT NULL DEFAULT nextval('readings_id_seq'::regclass),
    meter_id integer NOT NULL,
    reading numeric(10,2) NOT NULL,
    reading_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

### Enums Used
```sql
-- Billing Types
CREATE TYPE billing_type AS ENUM (
    'RENT',
    'UTILITY',
    'PENALTY',
    'MAINTENANCE',
    'SERVICE'
);

-- Expense Status
CREATE TYPE expense_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

-- Expense Types
CREATE TYPE expense_type AS ENUM (
    'UTILITY',
    'MAINTENANCE',
    'SUPPLIES',
    'OTHER'
);

-- Floor Status
CREATE TYPE floor_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);

-- Lease Status
CREATE TYPE lease_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXPIRED',
    'TERMINATED'
);

-- Lease Types
CREATE TYPE lease_type AS ENUM (
    'BEDSPACER',
    'PRIVATEROOM'
);

-- Location Status
CREATE TYPE location_status AS ENUM (
    'VACANT',
    'OCCUPIED',
    'RESERVED'
);

-- Maintenance Status
CREATE TYPE maintenance_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED'
);

-- Meter Location Type
CREATE TYPE meter_location_type AS ENUM (
    'PROPERTY',
    'FLOOR',
    'ROOM'
);

-- Meter Status
CREATE TYPE meter_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);

-- Payment Frequency
CREATE TYPE payment_frequency AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'ANNUAL',
    'CUSTOM'
);

-- Payment Method
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'BANK',
    'GCASH',
    'OTHER'
);

-- Payment Status
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE'
);

-- Property Status
CREATE TYPE property_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
);

-- Utility Type
CREATE TYPE utility_type AS ENUM (
    'ELECTRICITY',
    'WATER',
    'GAS',
    'INTERNET'
);

### Database Functions
```sql
-- Function to get tenant monthly balances
CREATE OR REPLACE FUNCTION get_tenant_monthly_balances(
    p_property_id INT,
    p_months_back INT
) RETURNS TABLE (
    tenant_id INT,
    month DATE,
    balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_balances AS (
        SELECT 
            lt.tenant_id,
            date_trunc('month', b.billing_date) as month,
            SUM(b.balance) as balance
        FROM billings b
        JOIN leases l ON l.id = b.lease_id
        JOIN lease_tenants lt ON lt.lease_id = l.id
        JOIN rooms r ON r.id = l.location_id
        WHERE r.property_id = p_property_id
        AND b.billing_date >= date_trunc('month', NOW()) - (p_months_back || ' months')::INTERVAL
        GROUP BY lt.tenant_id, date_trunc('month', b.billing_date)
    )
    SELECT * FROM monthly_balances
    ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

## Access Control

### Role-Based Access
1. Admin Level Access (Full Access)
   - super_admin
   - property_admin

2. Staff Level Access (Property-Specific)
   - property_manager
   - property_maintenance
   - property_accountant

3. No Access
   - All other roles

## Features

### 1. Data Loading (+page.server.ts)
```typescript
// Load rooms with active leases
const { data: rooms } = await supabase
  .from('rooms')
  .select(`
    id,
    name,
    number,
    capacity,
    room_status,
    base_rate,
    property_id,
    floor_id,
    type,
    amenities,
    leases!location_id(
      id,
      name,
      status,
      type,
      start_date,
      end_date,
      rent_amount,
      balance,
      lease_tenants!lease_id(
        tenant:tenants!tenant_id(
          id,
          name,
          email,
          contact_number
        )
      )
    )
  `)
  .eq('property_id', profile.property)
  .eq('leases.status', 'ACTIVE');

// Get monthly balances
const { data: balances } = await supabase
  .rpc('get_tenant_monthly_balances', {
    p_property_id: profile.property,
    p_months_back: 12
  });
```

### 2. User Interface (+page.svelte)

1. Data Organization
```typescript
interface Room {
  id: number;
  name: string;
  number: number;
  capacity: number;
  room_status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  base_rate: number;
  property_id: number;
  floor_id: number;
  type: string;
  amenities: Record<string, any>;
  leases: Array<{
    id: number;
    name: string;
    status: string;
    type: string;
    start_date: string;
    end_date: string;
    rent_amount: number;
    balance: number;
    lease_tenants: Array<{
      tenant: {
        id: number;
        name: string;
        email: string | null;
        contact_number: string | null;
      };
    }>;
  }>;
}
```

2. UI Components
```svelte
<!-- Floor Section -->
<Card.Root>
  <Card.Header>
    <Card.Title>Floor {floor}</Card.Title>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <!-- Table Headers -->
      <Table.Header>
        <Table.Row>
          <Table.Head>Room</Table.Head>
          <Table.Head>Type</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>Tenant</Table.Head>
          <Table.Head>Base Rate</Table.Head>
          {#each months as month}
            <Table.Head>{month}</Table.Head>
          {/each}
        </Table.Row>
      </Table.Header>
      
      <!-- Table Body -->
      <Table.Body>
        {#each rooms as room}
          {#each room.leases as lease}
            {#each lease.lease_tenants as tenant}
              <Table.Row>
                <Table.Cell>{room.number}</Table.Cell>
                <Table.Cell>{room.type}</Table.Cell>
                <Table.Cell>
                  <Badge variant={getStatusVariant(room.room_status)}>
                    {room.room_status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {tenant.tenant.name}
                  {#if tenant.tenant.contact_number}
                    <br />
                    <span class="text-sm text-muted-foreground">
                      {tenant.tenant.contact_number}
                    </span>
                  {/if}
                </Table.Cell>
                <Table.Cell>{formatCurrency(room.base_rate)}</Table.Cell>
                {#each months as month}
                  <Table.Cell>
                    {formatCurrency(balancesByTenant[tenant.tenant.id]?.[month] ?? 0)}
                  </Table.Cell>
                {/each}
              </Table.Row>
            {/each}
          {/each}
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
```

## Error Handling

### Server-Side Errors
1. Authentication Errors (401)
2. Authorization Errors (403)
3. Database Query Errors (500)
4. Data Validation Errors (400)

### Client-Side Error Boundaries
1. Loading States
2. Error States
3. Empty States
4. Network Error Recovery

## Performance Considerations

### Database Optimization
1. Create indexes for commonly queried fields:
```sql
-- Indexes for rooms table
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX idx_rooms_status ON rooms(room_status);

-- Indexes for leases table
CREATE INDEX idx_leases_location_id ON leases(location_id);
CREATE INDEX idx_leases_status ON leases(status);

-- Indexes for lease_tenants table
CREATE INDEX idx_lease_tenants_lease_id ON lease_tenants(lease_id);
CREATE INDEX idx_lease_tenants_tenant_id ON lease_tenants(tenant_id);

-- Indexes for billings table
CREATE INDEX idx_billings_lease_id ON billings(lease_id);
CREATE INDEX idx_billings_billing_date ON billings(billing_date);
```

2. Create materialized view for monthly balances:
```sql
CREATE MATERIALIZED VIEW monthly_tenant_balances AS
SELECT 
    lt.tenant_id,
    date_trunc('month', b.billing_date) as month,
    SUM(b.balance) as balance
FROM billings b
JOIN leases l ON l.id = b.lease_id
JOIN lease_tenants lt ON lt.lease_id = l.id
JOIN rooms r ON r.id = l.location_id
GROUP BY lt.tenant_id, date_trunc('month', b.billing_date);

CREATE INDEX idx_mtb_tenant_month 
ON monthly_tenant_balances(tenant_id, month);
```

### UI Performance
1. Implement virtual scrolling for large datasets
2. Optimize re-renders using proper Svelte reactivity
3. Lazy load components when possible

## Testing Requirements

### Unit Tests
1. Data transformation functions
2. Component logic
3. Error handling

### Integration Tests
1. Data loading flow
2. Role-based access
3. Filter functionality

### End-to-End Tests
1. Complete user flows
2. Error scenarios
3. Performance benchmarks

## Future Enhancements

### Planned Features
1. Advanced filtering options:
   - By room type
   - By tenant status
   - By balance range
   - By date range
2. Export functionality
3. Print view
4. Payment trend analysis
5. Occupancy rate tracking

### Budget Management
1. **Budget Configuration Table**
   - Currently, the budget allocation is hardcoded (100,000)
   - Need to create a proper configuration table with:
     ```sql
     CREATE TABLE public.budget_configs (
         id integer NOT NULL DEFAULT nextval('budget_configs_id_seq'::regclass),
         property_id integer NOT NULL,
         year integer NOT NULL,
         month integer NOT NULL,
         allocated_amount numeric(10,2) NOT NULL,
         category expense_type NOT NULL,
         notes text,
         created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
         updated_at timestamp with time zone,
         CONSTRAINT unique_property_year_month UNIQUE (property_id, year, month)
     );
     ```
   - This will allow:
     - Property-specific budget allocation
     - Monthly/Yearly budget planning
     - Category-wise budget allocation
     - Historical budget tracking

2. **Implementation Steps**
   - Create budget_configs table
   - Add API endpoints for budget CRUD operations
   - Update monthly overview to fetch budget from configuration
   - Add budget planning interface for administrators
   - Implement budget vs actual comparison reports

### Technical Improvements
1. Implement Redis caching for frequently accessed data
2. Add real-time updates using Supabase realtime
3. Improve error reporting
4. Add performance monitoring

## Maintenance

### Regular Tasks
1. Refresh materialized views
2. Monitor query performance
3. Update cached data
4. Review error logs

### Documentation
1. Keep API documentation updated
2. Document new features
3. Update testing procedures
4. Maintain user guides
