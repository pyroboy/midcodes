-- Add slug column to properties table for URL-friendly names
-- Migration: add_property_slug.sql

-- Add the slug column
ALTER TABLE properties ADD COLUMN slug TEXT;

-- Create a function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_property_slug(property_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special characters
  RETURN regexp_replace(lower(property_name), '[^a-z0-9]+', '-', 'g');
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing properties
UPDATE properties
SET slug = generate_property_slug(name)
WHERE slug IS NULL;

-- Make slug NOT NULL and add unique constraint
ALTER TABLE properties ALTER COLUMN slug SET NOT NULL;
ALTER TABLE properties ADD CONSTRAINT properties_slug_unique UNIQUE (slug);

-- Create index on slug for faster lookups
CREATE INDEX idx_properties_slug ON properties (slug);

-- Clean up the function
DROP FUNCTION generate_property_slug(TEXT);
