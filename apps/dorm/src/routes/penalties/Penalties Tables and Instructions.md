# Penalties Tables and Instructions

## Tables

### billings
- Columns: 
  - id (serial, primary key)
  - lease_id (integer, foreign key to leases.id)
  - type (billing_type)
  - utility_type (utility_type, nullable)
  - amount (numeric(10, 2))
  - paid_amount (numeric(10, 2), default 0)
  - balance (numeric(10, 2))
  - status (payment_status, default 'PENDING')
  - due_date (date)
  - billing_date (date)
  - penalty_amount (numeric(10, 2), default 0)
  - notes (text, nullable)
  - created_at (timestamp with time zone, default now())
  - updated_at (timestamp with time zone, nullable)

### leases
- Columns: id, tenantIds, rental_unit_id, name, status, start_date, end_date, terms_month, security_deposit, rent_amount, prorated_first_month, prorated_amount, notes, balance, unit_type

## Relationships
- billings.lease_id → leases.id (Many-to-One)

## Workflow
1. User views the list of penalty billings (billings with penalty_amount > 0)
2. User can filter and sort the list by various criteria (due date, billing date, payment status)
3. User can view detailed information for a specific penalty billing
4. User can manually adjust the penalty amount if needed (with proper authorization)
5. User can generate reports and analyze penalty trends

## Key Calculations
- Penalty amounts are calculated when a billing record becomes overdue
- The system may implement specific business rules for penalty calculation (e.g., percentage of the original amount)

## Data Entry Constraints
- Penalty amounts must be non-negative
- Only authorized users can manually adjust penalty amounts
- When a billing is marked as PAID, the system should ensure that the paid_amount equals the sum of amount + penalty_amount

## Per Component instructions

### @PenaltyTable.svelte
#### Description
A table component that displays all billing records with penalty amounts greater than 0.

#### Props
- penalties: Array of billing records with penalty amounts
- onPenaltyClick: Function to handle when a penalty record is clicked
- onStatusChange: Function to handle status changes

#### Instructions
- Display key information for each penalty: billing date, due date, amount, penalty amount, status
- Include filtering and sorting options
- Implement pagination if needed

### @PenaltyCard.svelte
#### Description
A detailed card view for a specific penalty billing record.

#### Props
- penalty: The penalty billing record
- onUpdate: Function to handle updates to the penalty record

#### Instructions
- Display all relevant information about the penalty
- Include lease details
- Provide options to adjust the penalty amount (for authorized users)
- Show payment history related to the penalty

### @PenaltyModal.svelte
#### Description
A modal component for manually adjusting penalty amounts.

#### Props
- penalty: The penalty billing record to be adjusted
- open: Boolean to control modal visibility
- onOpenChange: Function to handle modal open/close events
- onSubmit: Function to handle form submission

#### Instructions
- Include fields for the new penalty amount
- Require notes/justification for manual adjustments
- Implement validation
- Display current and proposed values for comparison
- Use standard modal design patterns
