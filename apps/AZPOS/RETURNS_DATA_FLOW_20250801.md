# RETURNS_DATA_FLOW.md

## Database Schema Overview
### Tables Involved
- **Primary Tables**: returns, return_items
- **Related Tables**: products, users
- **Junction Tables**: None

### Key Relationships
- `returns` table has a one-to-many relationship with `return_items` table via `return_id` foreign key
- `returns` table references `users` table via `processed_by` and `user_id` foreign keys
- `return_items` table references `products` table via `product_id` foreign key

### Enums Used
- **return_status**: 'pending', 'approved', 'rejected', 'processed'
- **return_reason**: 'damaged', 'defective', 'wrong_item', 'expired', 'customer_request', 'other'
- **reference_type**: 'order', 'return', 'purchase_order', 'adjustment', 'transfer', 'count' (used in inventory_movements)

### Triggers & Functions
- **update_returns_updated_at**: Automatically updates the `updated_at` timestamp before UPDATE operations
- **update_updated_at_column()**: Generic function that sets `NEW.updated_at = NOW()`

## Database Schema Details

### returns table
- `id` (uuid, NOT NULL, DEFAULT uuid_generate_v4())
- `return_number` (character varying(100), NOT NULL)
- `customer_name` (character varying(255))
- `customer_email` (character varying(255))
- `customer_phone` (character varying(50))
- `status` (return_status, DEFAULT 'pending'::return_status)
- `reason` (return_reason, NOT NULL)
- `description` (text)
- `total_refund_amount` (numeric(10,2), DEFAULT 0)
- `processed_by` (uuid)
- `processed_at` (timestamp with time zone)
- `notes` (text)
- `created_at` (timestamp with time zone, DEFAULT now())
- `updated_at` (timestamp with time zone, DEFAULT now())

### return_items table
- `id` (uuid, NOT NULL, DEFAULT uuid_generate_v4())
- `return_id` (uuid)
- `product_id` (uuid)
- `quantity` (integer, NOT NULL)
- `unit_price` (numeric(10,2), NOT NULL)
- `refund_amount` (numeric(10,2), DEFAULT ((quantity)::numeric * unit_price))
- `condition` (character varying(100))
- `notes` (text)
- `created_at` (timestamp with time zone, DEFAULT now())

## Telefunc Functions Analysis

### Function: onGetReturns
- **Purpose**: Fetch all returns with optional filters
- **Tables Accessed**: returns, users
- **Columns Used**: 
  - returns: id, order_id, customer_name, items, return_date, status, reason, notes, admin_notes, processed_by, processed_at, user_id, created_at, updated_at
  - users: full_name (via join)
- **Columns Unused**: return_number, customer_email, customer_phone, description, total_refund_amount
- **Input Validation**: Uses returnFiltersSchema for validation
- **Business Rules**: 
  - RBAC implemented - regular users can only see their own returns
  - Filtering by status, reason, date range, customer name, and order ID
- **Error Scenarios**: Supabase errors are properly handled and thrown
- **Schema Compliance**: ❌ Partial - accessing non-existent columns (order_id, return_date, items)

### Function: onCreateReturn
- **Purpose**: Create a new return
- **Tables Accessed**: returns, orders
- **Columns Used**: order_id, customer_name, items, reason, notes, status, user_id, return_date
- **Columns Unused**: return_number, customer_email, customer_phone, description, total_refund_amount, processed_by, processed_at, admin_notes
- **Input Validation**: Uses newReturnSchema for validation
- **Business Rules**: 
  - Order validation for non-admin users
  - Default status set to 'pending'
  - Timestamps set manually
- **Error Scenarios**: Order validation errors, Supabase errors
- **Schema Compliance**: ❌ Partial - accessing non-existent columns, manually setting timestamps (should let trigger handle it)

### Function: onUpdateReturnStatus
- **Purpose**: Update return status (admin only)
- **Tables Accessed**: returns
- **Columns Used**: status, admin_notes, processed_by, processed_at, updated_at
- **Columns Unused**: return_number, customer_name, customer_email, customer_phone, reason, description, total_refund_amount, notes, user_id, created_at
- **Input Validation**: Uses updateReturnStatusSchema for validation
- **Business Rules**: 
  - Admin/manager access only
  - Setting processed info for final statuses
  - Manual timestamp setting
- **Error Scenarios**: Authorization errors, Supabase errors
- **Schema Compliance**: ❌ Partial - manually setting updated_at (should let trigger handle it)

### Function: onGetReturnById
- **Purpose**: Get a specific return by ID
- **Tables Accessed**: returns, users
- **Columns Used**: All return columns, users.full_name
- **Columns Unused**: None
- **Input Validation**: Direct ID parameter
- **Business Rules**: RBAC - users can only access their own returns unless admin
- **Error Scenarios**: Not found errors, Supabase errors
- **Schema Compliance**: ❌ Partial - accessing non-existent columns

### Function: onGetReturnStats
- **Purpose**: Get return statistics (admin only)
- **Tables Accessed**: returns
- **Columns Used**: status
- **Columns Unused**: All other columns
- **Input Validation**: None (admin only)
- **Business Rules**: Admin only access
- **Error Scenarios**: Supabase errors
- **Schema Compliance**: ✅ Good - only accessing existing columns

### Function: onDeleteReturn
- **Purpose**: Delete a return (admin only, soft delete)
- **Tables Accessed**: returns
- **Columns Used**: id
- **Columns Unused**: All other columns
- **Input Validation**: Direct ID parameter
- **Business Rules**: Admin only access
- **Error Scenarios**: Authorization errors, Supabase errors
- **Schema Compliance**: ✅ Good - only accessing existing columns

## Schema Compliance Summary
- **Tables Covered**: ✅ 2/2 (returns, return_items)
- **Columns Utilized**: ❌ 8/18 (many non-existent columns accessed)
- **Enums Implemented**: ❌ Partial (using different enum values than database)
- **RLS Policies Considered**: ✅ Yes
- **Triggers Accounted For**: ❌ No (manual timestamp setting instead of letting triggers handle it)

## TypeScript Schema Analysis

### Schema Compliance Issues:
1. **Missing Database Columns**:
   - `return_number` - exists in database but not in TypeScript schema
   - `customer_email` - exists in database but not in TypeScript schema
   - `customer_phone` - exists in database but not in TypeScript schema
   - `description` - exists in database but not in TypeScript schema
   - `total_refund_amount` - exists in database but not in TypeScript schema

2. **Extra TypeScript Fields Not in Database**:
   - `order_id` - exists in TypeScript but not in database
   - `return_date` - exists in TypeScript but not in database
   - `items` - exists in TypeScript but not in database
   - `product_name` in returnItemSchema - exists in TypeScript but not in database
   - `product_sku` in returnItemSchema - exists in TypeScript but not in database

3. **Enum Value Mismatches**:
   - `reason` enum in TypeScript: ['defective', 'wrong_item', 'changed_mind', 'other', 'no_longer_needed']
   - `reason` enum in database: ['damaged', 'defective', 'wrong_item', 'expired', 'customer_request', 'other']
   - `status` enum in TypeScript: ['pending', 'approved', 'rejected', 'completed', 'processing']
   - `status` enum in database: ['pending', 'approved', 'rejected', 'processed']

4. **Missing Computed Fields**:
   - `refund_amount` in return_items table is computed but not represented in schema

## Data Hooks Analysis

### Hook: useReturns
- **Query Keys**: ✅ Well-structured query key factory implemented
- **TanStack Query Types**: ✅ Match Telefunc return types
- **Error Handling**: ✅ Proper error handling with console logging
- **Cache Invalidation**: ✅ Proper cache invalidation on mutations
- **Optimistic Updates**: ✅ Implemented for create, update, and delete operations
- **Loading States**: ✅ Proper loading states exposed
- **Derived Stores**: ✅ Using Svelte 5 runes correctly

### Schema Compliance Issues:
- Passing through the TypeScript schema issues to the UI layer

## Components Analysis

### ReturnsProcessing.svelte
- **Form Fields**: ✅ Match TypeScript schema (but not database schema)
- **Validation**: ✅ Using proper derived stores
- **Enum Handling**: ✅ Using TypeScript enums (but not database enums)
- **Error Handling**: ✅ Basic error handling with toasts

### +page.svelte
- **Form Fields**: ✅ Match TypeScript schema
- **Validation**: ✅ Using proper data hooks
- **Enum Handling**: ✅ Using TypeScript enums
- **Error Handling**: ✅ Proper error handling with toasts

## Recommendations

### Critical Issues to Fix:
1. **Column Name Mismatches**: The TypeScript schema and Telefunc functions are using column names that don't exist in the database:
   - Replace `order_id` with `return_number` in returns table
   - Remove `return_date` (not in database) and use `created_at` instead
   - Remove `items` (not in database) and properly join with return_items table
   - Remove `product_name` and `product_sku` from returnItemSchema (not in return_items table)

2. **Enum Value Mismatches**: Align TypeScript enums with database enums:
   - Update `reason` enum to match database: ['damaged', 'defective', 'wrong_item', 'expired', 'customer_request', 'other']
   - Update `status` enum to match database: ['pending', 'approved', 'rejected', 'processed']

3. **Database Trigger Handling**: Remove manual timestamp setting in Telefunc functions:
   - Remove manual `updated_at` setting (let the database trigger handle it)
   - Remove manual `return_date` setting (use `created_at` from database)

4. **Data Relationship Handling**: Properly handle the relationship between returns and return_items:
   - Instead of storing items in the returns table, properly join with return_items table
   - Update Telefunc functions to create return_items records when creating a return

### Improvements:
1. **Add Missing Database Columns**: Add the missing database columns to the TypeScript schema
2. **Better Error Handling**: Add more specific error handling for different types of database errors
3. **Validation Improvements**: Add validation for all required database fields

## Unused Schema Elements

### Unused Database Columns:
- `customer_email` - Could be added to UI for better customer identification
- `customer_phone` - Could be added to UI for better customer identification
- `description` - Could be added to UI for more detailed return information
- `total_refund_amount` - Could be displayed in UI for financial tracking

### Unused Database Relationships:
- The relationship between returns and return_items is not properly utilized in the current implementation
