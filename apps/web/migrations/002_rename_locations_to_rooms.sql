-- Rename locations table to rental_unit
ALTER TABLE public.locations RENAME TO rental_unit;

-- Rename status column to rental_unit_status
ALTER TABLE public.rental_unit RENAME COLUMN status TO rental_unit_status;

-- Ensure the column type is correct (this is actually redundant since it's already the correct type,
-- but included for completeness and clarity)
ALTER TABLE public.rental_unit ALTER COLUMN rental_unit_status TYPE location_status USING rental_unit_status::location_status;

-- Update foreign key references in other tables
ALTER TABLE public.leases RENAME CONSTRAINT leases_location_id_fkey TO leases_rental_unit_id_fkey;
ALTER TABLE public.meters RENAME CONSTRAINT meters_location_id_fkey TO meters_rental_unit_id_fkey;
ALTER TABLE public.maintenance RENAME CONSTRAINT maintenance_location_id_fkey TO maintenance_rental_unit_id_fkey;

-- Rename indexes to match new table name
ALTER INDEX idx_leases_location RENAME TO idx_leases_rental_unit;
ALTER INDEX idx_meters_location RENAME TO idx_meters_rental_unit;
ALTER INDEX idx_maintenance_location RENAME TO idx_maintenance_rental_unit;
