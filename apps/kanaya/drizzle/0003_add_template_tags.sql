-- Migration: Add template tags column for organization/filtering (DB-04)
-- Date: 2025-12-26

ALTER TABLE templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array containment queries
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN (tags);

-- Comment for documentation
COMMENT ON COLUMN templates.tags IS 'Array of tags for template categorization and filtering';
