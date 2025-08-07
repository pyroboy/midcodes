-- Migration: Add backdating_enabled field to readings table for audit purposes
-- This field tracks when readings were entered with backdating enabled

ALTER TABLE readings 
ADD COLUMN backdating_enabled BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN readings.backdating_enabled IS 'Indicates if this reading was entered with backdating enabled for audit purposes';

-- Create index for efficient querying of backdated readings
CREATE INDEX idx_readings_backdating_enabled ON readings(backdating_enabled) WHERE backdating_enabled = TRUE;

-- Add RLS policy to allow users to see backdating status for their properties
-- (This assumes existing RLS policies are in place)
-- The existing policies should already cover this new column
