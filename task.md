# Task Plan: Refactor Utility Billing Creation

This document outlines the plan to refactor the "Bill Leases" functionality, specifically the `?/createUtilityBillings` server action in `apps/dorm`. The goal is to improve robustness, ensure data integrity, and provide clearer user feedback, as per the requirements.

### Current State Analysis

The current implementation attempts to create multiple billings and skips any that it identifies as duplicates. This can lead to partial success, which is confusing for the user and can cause data inconsistencies. The new approach will be an "all-or-nothing" transaction.

### Core Requirements

1.  **Transactional Integrity**: The entire batch of billings must either succeed or fail together. No partial creations.
2.  **Strict Duplicate Rejection**: If any of the proposed billings already exist for a given period, the entire request should be rejected before any database writes occur.
3.  **Clear Error Feedback**: The user must be informed exactly why the operation failed (e.g., which lease(s) already have a bill for the period).
4.  **Robust Validation**: Ensure all incoming data is validated against the database schema to prevent errors.

---

## Refactoring Steps

### 1. Server Action (`?/createUtilityBillings`)

-   **[ ] Parse and Validate Input:**
    -   Receive the `billingData` array from the client.
    -   Validate the structure and data types of each object in the array.
    -   Ensure required fields like `lease_id`, `amount`, `billing_date`, and `utility_type` are present and valid.

-   **[ ] Pre-emptive Duplicate Check:**
    -   Before any `INSERT` statements, perform a single `SELECT` query to check for existing bills.
    -   The query should look for records that match a composite key of `(lease_id, utility_type, billing_date)`. A `meter_id` check should also be included.
    -   **Logic**: `SELECT lease_id FROM billings WHERE (lease_id, utility_type, billing_date) IN ((...),(...));`
    -   If this query returns any rows, it means at least one duplicate exists.

-   **[ ] Implement All-or-Nothing Logic:**
    -   **If duplicates are found:**
        -   Immediately stop processing.
        -   Return a `409 Conflict` failure from the action.
        -   The response should include a clear error message, e.g., `"Billings for this period already exist for the following leases: [Lease Name 1, Lease Name 2]."`
    -   **If no duplicates are found:**
        -   Proceed to the insertion step.

-   **[ ] Transactional Data Insertion:**
    -   Use a database transaction (`db.transaction()`) to wrap the `INSERT` operations.
    -   Map the incoming `billingData` to match the `billings` table schema. This includes:
        -   Setting `type` to `'UTILITY'`.
        -   Calculating `balance` (should be equal to `amount` on creation).
        -   Calculating `due_date` based on business logic (e.g., `billing_date` + 15 days).
    -   Use a single `INSERT` statement to insert all new billing records at once for efficiency.
    -   If the transaction fails for any reason, it will be automatically rolled back, ensuring no partial data is saved.
    -   On success, return a success message indicating how many billings were created.

### 2. Client-Side (`TenantShareModal.svelte`)

-   **[ ] Update `enhance` Function:**
    -   Modify the `case 'failure'` block within the `enhance` function.
    -   Check for the new, more specific error messages from the server.
    -   Use `toast.error()` to display the detailed conflict message to the user, so they know exactly what to fix.

### 3. Database Schema Review

-   **[ ] Confirm Key Fields for Duplicates:**
    -   The primary check for a duplicate will be a combination of `lease_id`, `utility_type`, and `billing_date`.
    -   The `meter_id` should also be considered in the check to ensure uniqueness per meter reading.

-   **[ ] Add a `UNIQUE` Constraint (Optional but Recommended):**
    -   To enforce this rule at the database level, consider adding a unique constraint:
    ```sql
    ALTER TABLE public.billings
    ADD CONSTRAINT unique_utility_billing UNIQUE (lease_id, utility_type, billing_date, meter_id);
    ```
    -   This provides a final layer of protection against race conditions and application bugs.
