-- Rename locations table to rooms
ALTER TABLE public.locations RENAME TO rooms;

-- Rename status column to room_status
ALTER TABLE public.rooms RENAME COLUMN status TO room_status;

-- Ensure the column type is correct (this is actually redundant since it's already the correct type,
-- but included for completeness and clarity)
ALTER TABLE public.rooms ALTER COLUMN room_status TYPE location_status USING room_status::location_status;

-- Update foreign key references in other tables
ALTER TABLE public.leases RENAME CONSTRAINT leases_location_id_fkey TO leases_room_id_fkey;
ALTER TABLE public.meters RENAME CONSTRAINT meters_location_id_fkey TO meters_room_id_fkey;
ALTER TABLE public.maintenance RENAME CONSTRAINT maintenance_location_id_fkey TO maintenance_room_id_fkey;

-- Rename indexes to match new table name
ALTER INDEX idx_leases_location RENAME TO idx_leases_room;
ALTER INDEX idx_meters_location RENAME TO idx_meters_room;
ALTER INDEX idx_maintenance_location RENAME TO idx_maintenance_room;
