-- Fix billing_type enum to include correct SECURITY_DEPOSIT value
-- This migration fixes the typo in the billing_type enum

-- First, add the correct value to the enum
ALTER TYPE billing_type ADD VALUE IF NOT EXISTS 'SECURITY_DEPOSIT';

-- Note: PostgreSQL doesn't allow removing enum values directly
-- If there are existing records with 'SECURITY_DEPOST', they need to be updated first
-- This migration assumes no existing records use the incorrect 'SECURITY_DEPOST' value

-- Update any existing records that might have the incorrect value
UPDATE billings 
SET type = 'SECURITY_DEPOSIT'::billing_type 
WHERE type = 'SECURITY_DEPOST'::billing_type;

-- Comment: The incorrect 'SECURITY_DEPOST' value cannot be removed from the enum
-- without recreating the enum type, which would require more complex migration
-- For now, we ensure the correct value exists and update any existing records 