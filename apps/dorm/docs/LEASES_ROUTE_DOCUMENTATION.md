# Leases Route Documentation - Central Business Logic

## Overview

The **Leases Route** (`/src/routes/leases/`) is the **central hub of the entire dorm management business logic**. It orchestrates all critical business operations including lease management, billing generation, payment processing, tenant relationships, and financial tracking. This route integrates with virtually every other component of the system and serves as the primary interface for property managers to handle their core business operations.

## 🏗️ Architecture & File Structure

```
src/routes/leases/
├── +page.server.ts          # Core server-side business logic (681 lines)
├── +page.svelte             # Main UI orchestrator (175 lines)
├── LeaseCard.svelte         # Individual lease display & actions (721 lines)
├── LeaseFormModal.svelte    # Lease creation/editing modal (457 lines)
├── LeaseList.svelte         # Lease listing component (56 lines)
├── PaymentModal.svelte      # Payment processing modal (551 lines)
├── RentManagerModal.svelte  # Rent billing management (194 lines)
├── SecurityDepositModal.svelte # Security deposit management (452 lines)
├── formSchema.ts            # Zod validation schemas (73 lines)
├── utils.ts                 # Payment schedule utilities (106 lines)
└── [id]/                    # Individual lease detail routes
    └── billings/            # Billing-specific operations
```

## 🎯 Core Business Functions

### 1. Lease Lifecycle Management

The route handles the complete lifecycle of lease agreements:

#### **Lease Creation** (`create` action)
- **Location**: `+page.server.ts:121-223`
- **Purpose**: Creates new lease agreements with tenant relationships
- **Key Features**:
  - Automatic end date calculation based on terms
  - Multi-tenant support via junction table
  - Transactional integrity (rollback on failure)
  - Default financial field initialization

```typescript
// Extract tenant IDs and prepare lease data
const { tenantIds, ...leaseData } = form.data;
const tenantIdsArray = tenantIds; // Already transformed to array by schema

// Create lease with calculated end date
const { data: lease, error: leaseError } = await supabase
  .from('leases')
  .insert({
    rental_unit_id: leaseData.rental_unit_id,
    name: leaseName,
    start_date: leaseData.start_date,
    end_date: endDate,
    // Financial defaults
    rent_amount: 0,
    security_deposit: 0,
    // ... other fields
  })
```

#### **Lease Updates** (`updateLease` action)
- **Location**: `+page.server.ts:225-328`
- **Purpose**: Modifies existing lease terms and tenant relationships
- **Key Features**:
  - Preserves existing financial data
  - Updates tenant relationships via junction table
  - Recalculates end dates when terms change

#### **Lease Archival** (`delete` action)
- **Location**: `+page.server.ts:330-365`
- **Purpose**: Soft-deletes leases while preserving audit trail
- **Key Features**:
  - Uses stored procedure `soft_delete_lease`
  - Preserves all payment and billing data
  - Records deletion reason and user

### 2. Financial Management Core

The leases route is the **primary financial control center** of the application:

#### **Billing System Integration**
- **Rent Billing Management**: Automated monthly rent billing generation
- **Security Deposit Tracking**: Dedicated security deposit billing workflows
- **Utility Billing**: Integration with utility meters and consumption tracking
- **Penalty Calculation**: Automated penalty assessment via database functions

#### **Payment Processing** (`submitPayment` action)
- **Location**: `+page.server.ts:367-428`
- **Payment Methods Supported**:
  - `CASH` - Physical cash payments
  - `GCASH` - Digital wallet transactions
  - `BANK_TRANSFER` - Bank transfer payments
  - `SECURITY_DEPOSIT` - Security deposit utilization

```typescript
// Different RPC functions based on payment method
if (paymentDetails.method === 'SECURITY_DEPOSIT') {
  const result = await supabase.rpc('create_security_deposit_payment', {
    p_amount: paymentDetails.amount,
    p_billing_ids: paymentDetails.billing_ids,
    p_paid_by: paymentDetails.paid_by,
    // ... other parameters
  });
} else {
  const result = await supabase.rpc('create_payment', {
    p_amount: paymentDetails.amount,
    p_method: paymentDetails.method,
    // ... other parameters
  });
}
```

### 3. Rent Management Operations

#### **Monthly Rent Billing** (`manageRentBillings` action)
- **Location**: `+page.server.ts:454-542`
- **Purpose**: Comprehensive yearly rent billing management
- **Features**:
  - Year-based billing generation
  - Month-by-month activation/deactivation
  - Automatic balance calculations
  - Payment validation before deletion

```typescript
type MonthlyRent = {
  month: number;
  isActive: boolean;
  amount: number;
  dueDate: string;
};

// Three billing operations:
// 1. Create new billing
// 2. Update existing billing  
// 3. Delete billing (with payment validation)
```

#### **Security Deposit Management** (`manageSecurityDepositBillings` action)
- **Location**: `+page.server.ts:586-680`
- **Purpose**: Full CRUD operations for security deposit billings
- **Operations**:
  - **Create**: New security deposit requirements
  - **Update**: Modify amounts and due dates
  - **Delete**: Remove billings (with allocation cleanup)

## 📊 Data Flow & Integration Points

### Database Relationships
The leases route integrates with multiple database entities:

```sql
-- Core lease query with all relationships
SELECT 
  leases.*,
  rental_unit:rental_unit_id (*, floor:floors (*), property:properties (*)),
  lease_tenants:lease_tenants!lease_id (tenant:tenants (name, email, contact_number)),
  billings (*)
FROM leases
WHERE deleted_at IS NULL
ORDER BY created_at DESC
```

### External System Integration

#### **Penalty Calculation System**
- **Integration**: Database function `calculate_penalty(p_billing_id)`
- **Purpose**: Real-time penalty assessment based on configurable rules
- **Implementation**: Automatically called for all billings during data load

#### **Payment Allocation System**
- **Integration**: `payment_allocations` table with payment relationships
- **Purpose**: Track partial payments across multiple billings
- **Features**: Complex allocation logic for multi-billing payments

## 🎨 User Interface Components

### LeaseCard.svelte - Individual Lease Management
- **Size**: 721 lines (largest component)
- **Purpose**: Complete lease interaction interface
- **Features**:
  - Billing summary with status indicators
  - Quick status changes
  - Payment processing integration
  - Rent and security deposit management
  - Print functionality for invoices

### Modal System Architecture
The route employs a sophisticated modal system:

1. **LeaseFormModal**: Lease creation/editing
2. **PaymentModal**: Payment processing with multi-billing support
3. **RentManagerModal**: Year-based rent billing management
4. **SecurityDepositModal**: Security deposit operations

## 🔐 Security & Authorization

### Row Level Security (RLS) Integration
- **Admin Levels**: Full access to all lease operations
- **Property Managers**: Access to assigned property leases
- **Accountants**: Financial operation permissions
- **Tenants**: Read-only access to own lease data

### Validation & Data Integrity

#### **Zod Schema Validation** (`formSchema.ts`)
```typescript
export const leaseSchema = z.object({
  tenantIds: z.string()
    .transform((val) => JSON.parse(val))
    .refine((val) => Array.isArray(val) && val.length > 0),
  rental_unit_id: z.coerce.number().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  terms_month: z.coerce.number().int().min(0).max(60),
  // ... additional validations
});
```

#### **Business Rule Validation**
- **Date Consistency**: End date matches calculated terms
- **Tenant Requirements**: At least one tenant required
- **Financial Integrity**: Balance calculations with payment validations

## 🔄 Business Process Workflows

### Standard Lease Creation Process
1. **User Input**: Property manager selects unit and tenants
2. **Validation**: Form validation with business rules
3. **Lease Creation**: Database transaction with rollback capability
4. **Tenant Linking**: Junction table relationships
5. **Initial Setup**: Default financial configurations

### Payment Processing Workflow
1. **Billing Selection**: User selects billings to pay
2. **Amount Allocation**: System calculates optimal allocation
3. **Payment Creation**: Database RPC with integrity checks
4. **Balance Updates**: Automatic balance recalculations
5. **Status Updates**: Billing status progression

### Billing Management Lifecycle
1. **Schedule Generation**: Automated based on lease terms
2. **Monthly Activation**: Property manager controls active months
3. **Penalty Assessment**: Automatic calculation for overdue bills
4. **Payment Tracking**: Real-time balance updates
5. **Completion Marking**: Status progression to PAID

## 📈 Performance Considerations

### Optimized Data Loading
```typescript
// Parallel data fetching for better performance
const [allocationsResponse, ...penaltyResponses] = await Promise.all([
  supabase.from('payment_allocations').select('*, payment:payments(*)'),
  ...allBillingIds.map((id) => supabase.rpc('calculate_penalty', { p_billing_id: id }))
]);
```

### Efficient State Management
- **Derived State**: Calculated values using Svelte 5 runes
- **Batched Operations**: Bulk billing operations
- **Optimistic Updates**: UI responsiveness with data invalidation

## 🐛 Error Handling & Resilience

### Comprehensive Error Management
```typescript
try {
  // Business logic operations
} catch (error) {
  console.error('Lease creation failed:', error);
  return fail(500, {
    message: 'Failed to create lease'
  });
}
```

### Transaction Safety
- **Rollback Mechanisms**: Failed operations cleanup
- **Validation Layers**: Client and server-side validation
- **Audit Trails**: Comprehensive logging for debugging

## 🔧 Configuration & Customization

### Business Rule Configuration
- **Penalty Rules**: Database-driven penalty configurations
- **Payment Methods**: Configurable payment method options
- **Billing Types**: Extensible billing type system

### UI Customization
- **Status Colors**: Configurable status badge colors
- **Date Formats**: Consistent date formatting utilities
- **Currency Display**: Localized currency formatting

## 📚 Related Documentation

### Connected Systems
- **Properties Route**: Rental unit management
- **Tenants Route**: Tenant information system
- **Payments Route**: Payment history and reporting
- **Meters Route**: Utility consumption tracking
- **Reports Route**: Financial and operational reporting

### Database Schema References
- **Primary Tables**: `leases`, `billings`, `payment_allocations`
- **Junction Tables**: `lease_tenants`
- **Related Tables**: `rental_unit`, `tenants`, `properties`, `floors`

## 🚀 Future Enhancements

### Planned Features
- **Automated Rent Increases**: Scheduled rent adjustments
- **Contract Generation**: PDF lease agreement generation
- **Tenant Communication**: Integrated messaging system
- **Financial Forecasting**: Predictive revenue analytics

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Mobile Optimization**: Enhanced mobile interface
- **API Integration**: External payment gateway connections
- **Audit Dashboard**: Enhanced audit trail visualization

---

**Note**: This documentation reflects the leases route as the central business logic hub of the dorm management application. All financial operations, tenant relationships, and property management workflows flow through this critical system component.