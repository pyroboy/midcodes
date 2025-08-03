

## New Task: Bill Leases from TenantShareModal

This section outlines the steps to implement the functionality to bill tenants for their share of utilities directly from the `TenantShareModal`.

### 1. Frontend Changes (`apps/dorm/src/routes/utility-billings/TenantShareModal.svelte`)

-   **Add a "Bill Leases" button:**
    -   Place a new button in the modal's footer.
    -   The button should be styled consistently with other action buttons.
-   **Button Click Handler:**
    -   The button will be disabled if no tenants are selected.
    -   On click, the handler will:
        1.  Gather the list of selected leases and their corresponding shared amounts.
        2.  Make a `POST` request to a new form action, e.g., `?/createUtilityBillings`, on the `utility-billings` page.
        3.  The request body will contain the data for the billings to be created (e.g., an array of objects with `lease_id`, `amount`, `due_date`, and detailed `notes` including meter type, meter name, last reading date, and current reading date).
        4.  Upon a successful response from the server, display a toast notification confirming that the selected leases have been billed.

### 2. Backend Changes (`apps/dorm/src/routes/utility-billings/+page.server.ts`)

-   **Create a new Form Action:**
    -   Add a new named action called `createUtilityBillings` to the `actions` object.
-   **Implement Billing Logic:**
    -   This action will receive the list of leases and amounts from the frontend.
    -   For each item in the list, it will construct a new billing record.
    -   The billing object will have the following structure, similar to the one in `leases/+page.server.ts`:
        ```javascript
        {
          lease_id: lease.id, // from the request
          amount: sharedAmount, // from the request
          due_date: new Date().toISOString().split('T')[0], // Or another appropriate date
          type: 'UTILITY',
          status: 'PENDING',
          notes: `Utility bill for ${meter_name} (${meter_type}) from ${last_reading_date} to ${current_reading_date}`,
          billing_date: new Date().toISOString().split('T')[0],
          balance: sharedAmount,
          paid_amount: 0
        }
        ```
    -   Insert these new billing records into the `billings` table in the database.
    -   Return a success status to the frontend.
