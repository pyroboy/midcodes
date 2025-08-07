# Dorm App Migration Integration Instructions

This document provides instructions for integrating the new database schema migrations with each route in the dorm application.

## General Changes

1. Update all references from `locations` to `rental_unit`
2. Update all references from `status` to `rental_unit_status` when dealing with rental_unit status
3. Ensure all database queries use the new table and column names
4. Add RLS policy awareness to all routes:
   - Use proper role-based access control
   - Add auth.uid() checks where needed
   - Implement proper joins for tenant-specific queries
5. Update all database queries to respect RLS policies:
   - Admin level roles (super_admin, property_admin): Full access to all tables
   - Staff level roles: View access with specific create/update permissions
   - Tenant role: Access only to their own data

## Route-Specific Instructions

### `/dorm/locations` → `/dorm/rental_unit`

1. Rename the directory from `locations` to `rental_unit`
2. Update `+page.server.ts`:
   ```typescript
   // Change queries from
   const { data: locations } = await supabase.from('locations').select('*');
   // to
   const { data: rental_unit } = await supabase.from('rental_unit').select('*');
   ```
3. Update `+page.svelte`:
   - Rename all variables and references from `location` to `rental_unit`
   - Update form fields to use `rental_unit_status` instead of `status`
   - Add role-based UI controls:
     ```typescript
     {#if isAdminLevel}
       <!-- Show admin controls -->
     {:else if isStaffLevel}
       <!-- Show staff controls -->
     {/if}
     ```
4. Rename `LocationForm.svelte` to `Rental_UnitForm.svelte` and update its contents
5. Rename `RandomLocation.svelte` to `RandomRental_Unit.svelte` and update its contents
6. Implement RLS policies:
   - Admin levels: Full access
   - Staff: View access
   - Tenants/Guests: View access

### `/dorm/leases`

1. Update `+page.server.ts`:
   ```typescript
   // Update join queries from
   const { data: leases } = await supabase.from('leases').select('*, location:locations(*)');
   // to
   const { data: leases } = await supabase.from('leases').select('*, rental_unit:rental_unit(*)');
   ```
2. Update `+page.svelte`:
   - Update form references from `location_id` to `rental_unit_id`
   - Update display of rental_unit information
   - Add role-based UI controls
3. Update `LeaseList.svelte`:
   - Change location references to rental_unit references
   - Add tenant-specific filtering
4. Update `formSchema.ts`:
   - Update validation schema to reflect new field names
5. Implement RLS policies:
   - Admin levels: Full access
   - Accountant: Full access
   - Frontdesk: View and create
   - Tenants: View own leases only

### `/dorm/meters`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries from
   const { data: meters } = await supabase.from('meters').select('*, location:locations(*)');
   // to
   const { data: meters } = await supabase.from('meters').select('*, rental_unit:rental_unit(*)');
   ```
2. Update `+page.svelte`:
   - Change location selection to rental_unit selection
   - Add role-based UI controls
3. Update `MeterForm.svelte`:
   - Update form fields from `location_id` to `rental_unit_id`
   - Update labels and references
4. Implement RLS policies:
   - Admin and Utility: Full access
   - Maintenance: View and update
   - Staff: View access

### `/dorm/readings`

1. Update `schema.ts`:
   - Update types to reflect new rental_unit terminology
2. Update `+page.server.ts`:
   ```typescript
   // Update queries to use new rental_unit references and respect RLS
   const { data: readings } = await supabase
   	.from('readings')
   	.select('*, meter:meters(*, rental_unit:rental_unit(*))');
   ```
3. Update `+page.svelte`:
   - Update display of rental_unit information
   - Update form references
   - Add role-based UI controls
4. Implement RLS policies:
   - Admin and Utility: Full access
   - Staff: View access
   - Tenants: View own readings

### `/dorm/utility-billings`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries to use new rental_unit references and respect RLS
   const { data: billings } = await supabase
   	.from('billings')
   	.select('*, lease:leases(*, rental_unit:rental_unit(*))');
   ```
2. Update `+page.svelte`:
   - Update rental_unit information display
   - Update billing form references
   - Add role-based UI controls
3. Implement RLS policies:
   - Admin and Accountant: Full access
   - Manager: View and update
   - Frontdesk: View and create
   - Tenants: View own bills

### `/dorm/tenants`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries to include rental_unit information and respect RLS
   const { data: tenants } = await supabase
   	.from('lease_tenants')
   	.select('*, tenant:tenants(*), lease:leases(*, rental_unit:rental_unit(*))');
   ```
2. Update `+page.svelte` and `TenantList.svelte`:
   - Update rental_unit information display
   - Add role-based UI controls
3. Implement RLS policies:
   - Admin levels: Full access
   - Staff: View and update
   - Frontdesk: Create and update
   - Tenants: View own data

### `/dorm/transactions`

1. Update `+page.server.ts`:
   ```typescript
   // Update payment queries to include rental_unit information and respect RLS
   const { data: payments } = await supabase
   	.from('payments')
   	.select('*, billing:billings(*, lease:leases(*, rental_unit:rental_unit(*)))');
   ```
2. Update `+page.svelte` and `TransactionList.svelte`:
   - Update rental_unit information display
   - Add role-based UI controls
3. Implement RLS policies:
   - Admin and Accountant: Full access
   - Manager: View all
   - Frontdesk: Create and view
   - Tenants: View own payments

### `/dorm/overview/monthly`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries to use rental_unit instead of locations and respect RLS
   const { data: rental_unitStats } = await supabase.from('rental_unit').select('*');
   ```
2. Update `+page.svelte`:
   - Update statistics and charts to use rental_unit terminology
   - Add role-based UI controls
3. Implement RLS policies:
   - Admin levels: Full access
   - Staff: View access

### `/dorm/properties`

1. Create the route directory structure:

   ```
   /dorm/properties/
   ├── +page.server.ts
   ├── +page.svelte
   ├── Form.svelte
   └── formSchema.ts
   ```

2. In `formSchema.ts`:

   - Define `propertyStatusEnum` with values: 'ACTIVE', 'INACTIVE', 'MAINTENANCE'
   - Create `propertySchema` with fields:
     - id (optional number)
     - name (required string)
     - address (required string)
     - type (required string)
     - status (enum from propertyStatusEnum)
   - Export PropertySchema type

3. In `+page.server.ts`:

   - Implement load function to fetch properties with RLS
   - Add create and update actions with form validation
   - Include error handling for database operations
   - Use superValidate for form processing
   - Order properties by name

4. In `Form.svelte`:

   - Create form with superForm integration
   - Add input fields for all property fields
   - Include status dropdown with enum values
   - Add proper validation messages
   - Style form elements consistently

5. In `+page.svelte`:
   - Display properties list in grid/card layout
   - Show property details: name, address, type, status
   - Include form component
   - Add role-based UI controls
   - Style with responsive design

### `/dorm/floors`

1. Create the route directory structure:

   ```
   /dorm/floors/
   ├── +page.server.ts
   ├── +page.svelte
   ├── Form.svelte
   └── formSchema.ts
   ```

2. In `formSchema.ts`:

   - Define `floorStatusEnum` with values: 'ACTIVE', 'INACTIVE', 'MAINTENANCE'
   - Create `floorSchema` with fields:
     - id (optional number)
     - property_id (required number)
     - floor_number (required integer)
     - wing (optional string)
     - status (enum from floorStatusEnum)
   - Export FloorSchema type

3. In `+page.server.ts`:

   - Implement load function to fetch:
     - Floors with property information
     - Properties list for dropdown
   - Add create and update actions
   - Include proper error handling
   - Use RLS-aware queries
   - Order by property and floor number

4. In `Form.svelte`:

   - Create form with superForm integration
   - Add property selection dropdown
   - Include fields for floor details
   - Add status selection
   - Style consistently with other forms

5. In `+page.svelte`:

   - Display floors in organized list/grid
   - Show floor details with property name
   - Include form component
   - Add role-based UI controls
   - Implement responsive design

6. Update `$lib/types/database.ts`:
   - Add Property interface
   - Add Floor interface
   - Include proper typing for status enums
   - Add created_at and updated_at fields

### `/dorm/accounts`

1. Update `formSchema.ts`:

   ```typescript
   // Update schema to use new billing structure
   const billingSchema = z.object({
   	leaseId: z.string(),
   	type: z.enum(['RENT', 'UTILITY', 'PENALTY']),
   	utilityType: z.enum(['WATER', 'ELECTRICITY']).optional(),
   	amount: z.number(),
   	paidAmount: z.number(),
   	status: z.enum(['UNPAID', 'PARTIAL', 'PAID']),
   	dueDate: z.date(),
   	billingDate: z.date(),
   	penaltyAmount: z.number(),
   	notes: z.string().optional()
   });
   ```

2. Update `+page.server.ts`:

   ```typescript
   // Update queries to use billings table instead of accounts
   const { data: billings } = await supabase
   	.from('billings')
   	.select('*, lease:leases(*, rental_unit:rental_unit(*), tenant:tenants(*))');
   ```

3. Update `+page.svelte`:

   - Update form to use new billing schema
   - Add support for utility types when billing type is UTILITY
   - Add proper date handling for billing and due dates
   - Add dynamic balance calculation
   - Display associated payments
   - Add role-based UI controls

4. Implement RLS policies:

   - Admin and Accountant: Full access
   - Manager: View and update
   - Frontdesk: Create and view
   - Tenants: View own billings

5. Key Changes:
   - Switched from `accounts` to `billings` table
   - Added support for different billing types (RENT, UTILITY, PENALTY)
   - Added utility type selection for UTILITY billings
   - Improved payment status tracking
   - Added penalty amount support
   - Enhanced date handling for billing and due dates
   - Dynamic balance calculation based on amount and paidAmount
   - Better integration with leases, rental_unit, and tenants

### Testing Instructions

1. Test Property Management:

   - Create property with all required fields
   - Update existing property details
   - Verify status changes are reflected
   - Check RLS policies:
     - Admin can perform all operations
     - Staff can view properties
     - Tenants can only view

2. Test Floor Management:

   - Create floor for existing property
   - Update floor details
   - Test wing field (optional)
   - Verify property relationship
   - Check RLS policies:
     - Admin can perform all operations
     - Staff can view floors
     - Tenants can only view

3. Verify Data Relationships:

   - Properties appear in floor creation form
   - Floor updates reflect in rental_unit management
   - Status changes propagate correctly

4. UI/UX Testing:
   - Responsive design works on all screens
   - Forms provide proper validation feedback
   - Navigation between properties and floors is intuitive
   - Role-based UI elements show/hide correctly

### Security Considerations

1. Ensure RLS Policies:

   - Properties table:

     - Full access for admin levels
     - View access for staff
     - View only for tenants/guests

   - Floors table:
     - Full access for admin levels
     - View access for staff
     - View only for tenants/guests

2. Validate User Roles:

   - Check session in load functions
   - Verify permissions before operations
   - Handle unauthorized access gracefully

3. Data Validation:
   - Sanitize all input fields
   - Validate relationships before operations
   - Ensure proper error messages

## Database Types Update

Update your database types file (if exists) to reflect the new schema:

```typescript
interface Rental_unit {
	id: number;
	name: string;
	floor_level: number;
	capacity: number;
	rental_unit_status: 'VACANT' | 'OCCUPIED' | 'RESERVED';
	base_rate: number;
	created_at: string;
	updated_at: string | null;
}

// Update all references to Location with Rental_unit
type Database = {
	public: {
		Tables: {
			rental_unit: {
				Row: Rental_unit;
				Insert: Omit<Rental_unit, 'id' | 'created_at' | 'updated_at'>;
				Update: Partial<Omit<Rental_unit, 'id' | 'created_at' | 'updated_at'>>;
			};
			// ... other tables
		};
	};
};
```

## Testing Instructions

1. After applying migrations, test each route thoroughly
2. Pay special attention to:
   - Form submissions
   - Data display
   - Search/filter functionality
   - Related data queries
   - Role-based access control
   - Tenant-specific data filtering
3. Verify that all foreign key relationships work correctly
4. Test the penalty calculation system
5. Verify that payment processing works correctly
6. Test utility meter readings and billing generation
7. Test RLS policies for each role:
   - Super Admin
   - Property Admin
   - Property Manager
   - Property Accountant
   - Property Maintenance
   - Property Utility
   - Property Frontdesk
   - Property Tenant
   - Property Guest

## Rollback Instructions

In case of issues, the following rollback steps can be taken:

1. Revert the second migration:
   ```sql
   ALTER TABLE public.rental_unit RENAME TO locations;
   ALTER TABLE public.locations RENAME COLUMN rental_unit_status TO status;
   ```
2. Update all code changes back to original names
3. Restore original indexes and constraints
4. Disable RLS if needed:
   ```sql
   ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;
   ```

## Notes

- Ensure all API endpoints are updated to reflect the new schema
- Update any cached queries in the frontend
- Update any hardcoded references to 'locations' or 'status'
- Test all form submissions thoroughly
- Verify that all reports and analytics still work correctly
- Ensure proper error handling for RLS policy violations
- Add appropriate UI feedback for unauthorized actions
- Document any role-specific features or limitations
