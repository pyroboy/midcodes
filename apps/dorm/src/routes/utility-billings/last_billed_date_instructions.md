## New Task: Display Last Billed Date and Track Utility Type

This document outlines the plan to display the last billed date for each meter and correctly populate the `utility_type` for each billing.

### 1. Database Schema Update

Based on the provided schema, the `billings` table needs a `meter_id` column to reliably link a utility billing to a specific meter. The `utility_type` column also needs to be populated.

-   **Action**: Add a `meter_id` column to the `billings` table in Supabase. This column should be a foreign key referencing `meters(id)`.

-   **SQL Snippet for adding the column**:
    ```sql
    ALTER TABLE public.billings
    ADD COLUMN meter_id INTEGER,
    ADD CONSTRAINT billings_meter_id_fkey FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE SET NULL;
    ```

### 2. Backend Changes (`apps/dorm/src/routes/utility-billings/+page.server.ts`)

-   **Update `createUtilityBillings` Action**:
    -   Modify the action to receive `meter_id` and `utility_type` from the frontend form data.
    -   When creating billing records, ensure both `meter_id` and `utility_type` are included in the object being inserted into the database.

-   **Update `load` Function**:
    -   Query the `billings` table to fetch all records of `type: 'UTILITY'` that have a non-null `meter_id`.
    -   Process these records to create a `meterLastBilledDates` map (`Record<string, string>`) that stores the most recent `billing_date` for each `meter_id`.
    -   Pass this map to the page component in the return object.

### 3. Frontend Changes

-   **`TenantShareModal.svelte`**:
    -   Update the hidden form input to include `meter_id` (from `reading.meterId`) and `utility_type` (from `reading.meterType`) in the JSON payload sent to the `createUtilityBillings` action.

-   **`+page.svelte`**:
    -   Receive the `meterLastBilledDates` map from the `load` function's data.
    -   Pass this map as a new prop to the `ConsolidatedReadingsTable` component.

-   **`ConsolidatedReadingsTable.svelte`**:
    -   Add a new prop `meterLastBilledDates?: Record<string, string>` to accept the map.
    -   In the component's markup, for each meter row, check if a `lastBilledDate` exists in the map using the `meter.meterId`.
    -   Display the date (e.g., "Last Billed: [date]") below the meter name. If no date exists, display nothing.
