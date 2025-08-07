# Meters Management Route

## Overview

This route manages utility meters (electricity, water, internet) for properties, floors, and rental_unit in the dorm management system. It provides functionality to create, read, update, and delete meters with proper access control.

## Database Schema

### Meters Table

```sql
CREATE TABLE public.meters (
    id integer NOT NULL DEFAULT nextval('meters_id_seq'::regclass),
    name text NOT NULL,
    location_type meter_location_type NOT NULL,
    property_id integer,
    floor_id integer,
    rental_unit_id integer,
    type utility_type NOT NULL,
    is_active boolean DEFAULT true,
    status meter_status NOT NULL DEFAULT 'ACTIVE',
    initial_reading numeric(10,2) NOT NULL DEFAULT 0,
    unit_rate numeric(10,2) NOT NULL DEFAULT 0,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Readings Table

```sql
CREATE TABLE public.readings (
    id integer NOT NULL DEFAULT nextval('readings_id_seq'::regclass),
    meter_id integer NOT NULL,
    reading numeric(10,2) NOT NULL,
    reading_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Relevant Enums

```sql
CREATE TYPE meter_location_type AS ENUM ('PROPERTY', 'FLOOR', 'RENTAL_UNIT');
CREATE TYPE meter_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
CREATE TYPE utility_type AS ENUM ('ELECTRICITY', 'WATER', 'INTERNET');
```

### Access Control

Based on user_role enum:

- property_admin: Full access to all meters
- property_utility: Can create/edit meters and readings
- property_maintenance: Read-only access to meters and readings

## Features

### 1. Meter Assignment

- Assign meters to:
  - Entire property (property_id)
  - Specific floor (floor_id)
  - Individual rental_unit (rental_unit_id)

Note: Only one location type should be set based on meter_location_type

### 2. Meter Types (utility_type)

- ELECTRICITY
- WATER
- INTERNET

### 3. Meter Status

- ACTIVE: Meter is in use
- INACTIVE: Meter is not in use
- MAINTENANCE: Meter is under maintenance

### 4. Required Fields

- name: Unique identifier for the meter
- type: utility_type (ELECTRICITY/WATER/INTERNET)
- location_type: meter_location_type (PROPERTY/FLOOR/RENTAL_UNIT)
- location_id: Based on location_type (property_id/floor_id/rental_unit_id)
- initial_reading: Starting meter reading (numeric(10,2))
- unit_rate: Cost per unit of consumption (numeric(10,2))

### 5. Optional Fields

- notes: Additional information about the meter
- status: meter_status (defaults to ACTIVE)

## Implementation Notes

### Form Validation

1. Location Type Constraints:

   - If location_type = 'PROPERTY': Only property_id should be set
   - If location_type = 'FLOOR': Only floor_id should be set
   - If location_type = 'RENTAL_UNIT': Only rental_unit_id should be set

2. Numeric Validations:

   - initial_reading >= 0
   - unit_rate >= 0

3. Name Uniqueness:
   - Ensure meter name is unique within the same property hierarchy

### UI/UX Guidelines

1. Hierarchical Selection:

   ```typescript
   interface LocationSelection {
   	type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
   	property_id?: number;
   	floor_id?: number;
   	rental_unit_id?: number;
   }
   ```

2. Display Format:
   ```typescript
   interface MeterDisplay {
   	id: number;
   	name: string;
   	type: 'ELECTRICITY' | 'WATER' | 'INTERNET';
   	status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
   	location: {
   		type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
   		details: string; // e.g., "Floor 2, Wing A" or "Rental_unit 201"
   	};
   	latest_reading?: {
   		value: number;
   		date: string;
   	};
   }
   ```

### Error Handling

1. Database Constraints:

   - Foreign key violations for property_id, floor_id, rental_unit_id
   - Unique constraint on name within property scope
   - Check constraints on numeric fields

2. Business Logic:
   - Validate user role permissions
   - Ensure proper location reference based on type
   - Handle duplicate meter names

### Audit Trail

Using the built-in timestamp fields:

- created_at: Creation timestamp
- readings.created_at: Reading entry timestamps

## API Endpoints

### GET /meters

Query Parameters:

```typescript
interface MeterQuery {
	location_type?: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
	property_id?: number;
	floor_id?: number;
	rental_unit_id?: number;
	status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
	type?: 'ELECTRICITY' | 'WATER' | 'INTERNET';
	page?: number;
	limit?: number;
}
```

### POST /meters

Request Body:

```typescript
interface CreateMeterRequest {
	name: string;
	location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
	property_id?: number;
	floor_id?: number;
	rental_unit_id?: number;
	type: 'ELECTRICITY' | 'WATER' | 'INTERNET';
	initial_reading: number;
	unit_rate: number;
	notes?: string;
}
```

### PUT /meters/:id

Request Body:

```typescript
interface UpdateMeterRequest {
	name?: string;
	status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
	unit_rate?: number;
	notes?: string;
}
```

### POST /meters/:id/readings

Request Body:

```typescript
interface CreateReadingRequest {
	reading: number;
	reading_date: string; // ISO date format
}
```
