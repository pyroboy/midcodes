-- SECURITY: Template Elements JSON Schema Validation
-- Ensures template_elements JSONB column contains properly structured data

-- Add constraint to verify template_elements is an array with valid structure
-- Note: This constraint is permissive to allow existing data while ensuring basic structure

-- First, create a function to validate template element structure
CREATE OR REPLACE FUNCTION validate_template_element(elem JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check that element has required fields
    IF NOT (elem ? 'type') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate type is one of allowed values
    IF NOT (elem->>'type' IN ('text', 'image', 'shape', 'line', 'qrcode', 'barcode', 'photo', 'signature')) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for properties object (can be empty but should exist)
    IF NOT (elem ? 'properties') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to validate the entire template_elements array
CREATE OR REPLACE FUNCTION validate_template_elements(elements JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow NULL or empty
    IF elements IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Must be an array
    IF jsonb_typeof(elements) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Empty array is valid
    IF jsonb_array_length(elements) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Validate each element
    RETURN (
        SELECT bool_and(validate_template_element(elem))
        FROM jsonb_array_elements(elements) AS elem
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the constraint to templates table
-- Using a DO block to check if constraint exists first
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'template_elements_valid_structure'
    ) THEN
        -- Add the constraint
        ALTER TABLE templates
        ADD CONSTRAINT template_elements_valid_structure
        CHECK (validate_template_elements(template_elements));
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON CONSTRAINT template_elements_valid_structure ON templates IS 
    'Ensures template_elements contains valid JSON array with properly structured elements';
