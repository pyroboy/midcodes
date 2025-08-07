# Expenses Tables and Instructions

## Tables

### expenses

- Columns:
  - id (serial, primary key)
  - property_id (integer, foreign key)
  - expense_date (date)
  - expense_type (enum: MAINTENANCE, UTILITIES, SUPPLIES, SALARY, OTHERS)
  - expense_status (enum: PENDING, APPROVED, REJECTED)
  - amount (numeric)
  - description (text)
  - receipt_url (text, optional)
  - notes (text, optional)
  - created_by (uuid, foreign key)
  - approved_by (uuid, foreign key, optional)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)

### properties

- Columns:
  - id (serial, primary key)
  - name (text)
  - address (text)
  - city (text)
  - province (text)
  - postal_code (text)
  - country (text)
  - is_active (boolean)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)
  - created_by (uuid, foreign key)
  - updated_by (uuid, foreign key, optional)

### profiles

- Columns:
  - id (uuid, primary key)
  - full_name (text)
  - role (enum: super_admin, property_admin, staff, frontdesk, user)
  - email (text)
  - created_at (timestamp with time zone)
  - updated_at (timestamp with time zone)

## Relationships

- expenses.property_id → properties.id (Many-to-One)
- expenses.created_by → profiles.id (Many-to-One)
- expenses.approved_by → profiles.id (Many-to-One)

## Workflow

1. Users can view a list of expenses
2. Users can add new expenses with required fields:
   - Property
   - Expense Type
   - Amount
   - Date
   - Description
3. Admin users can approve or reject expenses
4. Expenses can be filtered by property, date range, type, and status

## Monthly Expenses Entry

1. Select year and month
2. Add operational expenses (utilities, supplies, etc.)
3. Add capital expenses (repairs, equipment, etc.)
4. Submit all expenses at once
5. Each expense is saved individually in the expenses table

## Key Calculations

- Total expenses by property
- Total expenses by type
- Monthly expense reports
- Expense trends over time

## Data Entry Constraints

- Amount must be positive
- Expense date cannot be in the future
- Description is required
- Property is required for property-specific expenses

## Per Component Instructions

### @ExpenseInputForm.svelte

#### Description

A form component for entering multiple expenses at once, categorized by operational and capital expenses. Uses superForm for form handling and validation.

#### Props

- data: PageData
- editMode?: boolean
- form: SuperForm<z.infer<typeof monthlyExpensesSchema>>['form']
- errors: SuperForm<z.infer<typeof monthlyExpensesSchema>>['errors']
- enhance: SuperForm<z.infer<typeof monthlyExpensesSchema>>['enhance']
- constraints: SuperForm<z.infer<typeof monthlyExpensesSchema>>['constraints']
- submitting: SuperForm<z.infer<typeof monthlyExpensesSchema>>['submitting']

#### Events

- cancel: Dispatched when the cancel button is clicked

#### Instructions

- Use this component for bulk entry of monthly expenses
- All expenses entered will be saved with the selected year and month
- At least one expense (with both label and amount) must be provided before submission
- The component handles adding and removing expense items dynamically

### @schema.ts

#### Description

Contains Zod schemas for expense data validation and type definitions.

#### Schemas

- expenseItemSchema: Validates individual expense items (label and amount)
- monthlyExpensesSchema: Validates the complete monthly expenses form
- expenseSchema: Validates individual expense entries
- expenseTypeEnum: Defines valid expense types
- expenseStatusEnum: Defines valid expense statuses

#### Instructions

- Use these schemas for form validation with superForm
- Import types from this file for type safety in components

### @types.ts

#### Description

Contains TypeScript type definitions for the expenses module.

#### Types

- ExpenseItem: Type for individual expense items
- MonthlyExpenses: Type for the complete monthly expenses form
- Expense: Type for individual expense entries
- ExpenseType: Type for expense types
- ExpenseStatus: Type for expense statuses
- ExpenseTableRow: Extended type for displaying expenses in tables
- ExpenseFilterOptions: Type for filtering expenses

#### Instructions

- Use these types for type safety in components
- Extend these types as needed for new features
