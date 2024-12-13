# Dorm App Migration Integration Instructions

This document provides instructions for integrating the new database schema migrations with each route in the dorm application.

## General Changes

1. Update all references from `locations` to `rooms`
2. Update all references from `status` to `room_status` when dealing with room status
3. Ensure all database queries use the new table and column names

## Route-Specific Instructions

### `/dorm/locations` → `/dorm/rooms`

1. Rename the directory from `locations` to `rooms`
2. Update `+page.server.ts`:
   ```typescript
   // Change queries from
   const { data: locations } = await supabase.from('locations').select('*')
   // to
   const { data: rooms } = await supabase.from('rooms').select('*')
   ```
3. Update `+page.svelte`:
   - Rename all variables and references from `location` to `room`
   - Update form fields to use `room_status` instead of `status`
4. Rename `LocationForm.svelte` to `RoomForm.svelte` and update its contents
5. Rename `RandomLocation.svelte` to `RandomRoom.svelte` and update its contents

### `/dorm/leases`

1. Update `+page.server.ts`:
   ```typescript
   // Update join queries from
   const { data: leases } = await supabase
     .from('leases')
     .select('*, location:locations(*)')
   // to
   const { data: leases } = await supabase
     .from('leases')
     .select('*, room:rooms(*)')
   ```
2. Update `+page.svelte`:
   - Update form references from `location_id` to `room_id`
   - Update display of room information
3. Update `LeaseList.svelte`:
   - Change location references to room references
4. Update `formSchema.ts`:
   - Update validation schema to reflect new field names

### `/dorm/meters`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries from
   const { data: meters } = await supabase
     .from('meters')
     .select('*, location:locations(*)')
   // to
   const { data: meters } = await supabase
     .from('meters')
     .select('*, room:rooms(*)')
   ```
2. Update `+page.svelte`:
   - Change location selection to room selection
3. Update `MeterForm.svelte`:
   - Update form fields from `location_id` to `room_id`
   - Update labels and references

### `/dorm/readings`

1. Update `schema.ts`:
   - Update types to reflect new room terminology
2. Update `+page.server.ts`:
   ```typescript
   // Update queries to use new room references
   const { data: readings } = await supabase
     .from('readings')
     .select('*, meter:meters(*, room:rooms(*))')
   ```
3. Update `+page.svelte`:
   - Update display of room information
   - Update form references

### `/dorm/utility-billings`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries to use new room references
   const { data: billings } = await supabase
     .from('billings')
     .select('*, lease:leases(*, room:rooms(*))')
   ```
2. Update `+page.svelte`:
   - Update room information display
   - Update billing form references

### `/dorm/tenants`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries to include room information
   const { data: tenants } = await supabase
     .from('lease_tenants')
     .select('*, tenant:tenants(*), lease:leases(*, room:rooms(*))')
   ```
2. Update `+page.svelte` and `TenantList.svelte`:
   - Update room information display

### `/dorm/transactions`

1. Update `+page.server.ts`:
   ```typescript
   // Update payment queries to include room information
   const { data: payments } = await supabase
     .from('payments')
     .select('*, billing:billings(*, lease:leases(*, room:rooms(*)))')
   ```
2. Update `+page.svelte` and `TransactionList.svelte`:
   - Update room information display

### `/dorm/overview/monthly`

1. Update `+page.server.ts`:
   ```typescript
   // Update queries to use rooms instead of locations
   const { data: roomStats } = await supabase
     .from('rooms')
     .select('*')
   ```
2. Update `+page.svelte`:
   - Update statistics and charts to use room terminology

## Database Types Update

Update your database types file (if exists) to reflect the new schema:

```typescript
interface Room {
  id: number
  name: string
  floor_level: number
  capacity: number
  room_status: 'VACANT' | 'OCCUPIED' | 'RESERVED'
  base_rate: number
  created_at: string
  updated_at: string | null
}

// Update all references to Location with Room
type Database = {
  public: {
    Tables: {
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>
      }
      // ... other tables
    }
  }
}
```

## Testing Instructions

1. After applying migrations, test each route thoroughly
2. Pay special attention to:
   - Form submissions
   - Data display
   - Search/filter functionality
   - Related data queries
3. Verify that all foreign key relationships work correctly
4. Test the penalty calculation system
5. Verify that payment processing works correctly
6. Test utility meter readings and billing generation

## Rollback Instructions

In case of issues, the following rollback steps can be taken:

1. Revert the second migration:
   ```sql
   ALTER TABLE public.rooms RENAME TO locations;
   ALTER TABLE public.locations RENAME COLUMN room_status TO status;
   ```
2. Update all code changes back to original names
3. Restore original indexes and constraints

## Notes

- Ensure all API endpoints are updated to reflect the new schema
- Update any cached queries in the frontend
- Update any hardcoded references to 'locations' or 'status'
- Test all form submissions thoroughly
- Verify that all reports and analytics still work correctly
