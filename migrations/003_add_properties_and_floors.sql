-- Add new property_status enum
CREATE TYPE property_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- Add new floor_status enum
CREATE TYPE floor_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- Create properties table
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    type TEXT NOT NULL, -- hotel, apartment, etc.
    status property_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create floors table
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) NOT NULL,
    floor_number INTEGER NOT NULL,
    wing TEXT, -- for complex layouts
    status floor_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Add property_id and floor_id to rental_unit table
ALTER TABLE rental_unit 
ADD COLUMN property_id INTEGER REFERENCES properties(id),
ADD COLUMN floor_id INTEGER REFERENCES floors(id),
ADD COLUMN type TEXT,
ADD COLUMN amenities JSONB DEFAULT '{}'::jsonb;

-- Rename floor_level to number for consistency
ALTER TABLE rental_unit RENAME COLUMN floor_level TO number;

-- Create a default property for existing rental_unit
INSERT INTO properties (name, address, type, status)
VALUES ('Default Property', 'Default Address', 'dormitory', 'ACTIVE');

-- Create default floors for existing rental_unit
WITH distinct_floors AS (
    SELECT DISTINCT number as floor_number
    FROM rental_unit
    ORDER BY floor_number
)
INSERT INTO floors (property_id, floor_number, status)
SELECT 
    (SELECT id FROM properties WHERE name = 'Default Property'),
    floor_number,
    'ACTIVE'
FROM distinct_floors;

-- Update existing rental_unit with property_id and floor_id
UPDATE rental_unit r
SET 
    property_id = (SELECT id FROM properties WHERE name = 'Default Property'),
    floor_id = f.id,
    type = 'standard' -- default type for existing rental_unit
FROM floors f
WHERE f.floor_number = r.number;

-- Make property_id and floor_id NOT NULL after populating data
ALTER TABLE rental_unit 
ALTER COLUMN property_id SET NOT NULL,
ALTER COLUMN floor_id SET NOT NULL,
ALTER COLUMN type SET NOT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_rental_unit_property ON rental_unit(property_id);
CREATE INDEX idx_rental_unit_floor ON rental_unit(floor_id);
CREATE INDEX idx_floors_property ON floors(property_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_properties_modtime
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_floors_modtime
    BEFORE UPDATE ON floors
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
