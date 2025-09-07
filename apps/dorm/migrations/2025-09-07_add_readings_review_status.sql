-- Simplified: single review_status column only
ALTER TABLE readings
	ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (review_status IN ('PENDING_REVIEW','APPROVED','REJECTED'));

-- Existing rows will get the default of APPROVED automatically when adding a NOT NULL column with default.
-- Helpful indexes for filtering and recency
CREATE INDEX IF NOT EXISTS idx_readings_review_status ON readings (review_status);
CREATE INDEX IF NOT EXISTS idx_readings_reading_date ON readings (reading_date);
