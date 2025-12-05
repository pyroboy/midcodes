-- Add database-level constraints to readings table for data integrity
-- This provides defense-in-depth alongside application-level validation

-- 1. Add UNIQUE constraint to prevent duplicate readings for same meter/date
-- This prevents race conditions where two simultaneous requests could both pass app checks
ALTER TABLE readings
ADD CONSTRAINT readings_meter_date_unique
UNIQUE (meter_id, reading_date);

-- 2. Add CHECK constraint to ensure readings are positive and within reasonable limits
-- Matches the application-level max validation (999,999,999)
ALTER TABLE readings
ADD CONSTRAINT readings_value_check
CHECK (reading >= 0 AND reading <= 999999999);

-- 3. Add CHECK constraint to prevent future dates
-- Readings should only be recorded for today or past dates
ALTER TABLE readings
ADD CONSTRAINT readings_date_not_future_check
CHECK (reading_date <= CURRENT_DATE);

-- Add index on the unique constraint for faster lookups
-- (The UNIQUE constraint automatically creates an index, but this documents it)

-- Note: These constraints work together with application validation:
-- - App validates user input and provides friendly error messages
-- - Database enforces data integrity as final safeguard
-- - Prevents bad data from being inserted via SQL or race conditions
