# Properties Module Instructions

## Overview
The Properties module is the foundation of the dormitory management system. It manages property creation, updates, and management, serving as the top-level organizational unit for floors, rental_unit, and all related entities.

## Core Functionality

### 1. Property Management
- **Create Properties**
  - Basic property information:
    - Name (required, text)
    - Address (required, text)
    - Type (required, text)
    - Status (property_status: ACTIVE/INACTIVE)
  - Validate required fields
  - Set default status to ACTIVE
  - Record creation timestamp (UTC)

- **Update Properties**
  - Modify property details
  - Update status
  - Track modification timestamp
  - Validate changes against active floors/rental_unit

- **View Properties**
  - List all properties with status
  - Show floor count
  - Show rental_unit count
  - Support filtering and sorting

### 2. Property-Floor Relationship
- One property has many floors
- Track per floor:
  - Floor number (required, integer)
  - Property ID (required, references properties.id)
  - Wing (optional, text)
  - Status (floor_status: ACTIVE/INACTIVE/MAINTENANCE)
  - Creation/update timestamps (UTC)

### 3. Property-Rental_unit Relationship
- Rental_Units linked to property via floors
- Track per rental_unit:
  - Name (required, text)
  - Number (required, integer)
  - Capacity (required, integer)
  - Base rate (required, numeric(10,2))
  - Type (required, text)
  - Property ID (required, references properties.id)
  - Floor ID (required, references floors.id)
  - Status (location_status: VACANT/OCCUPIED/MAINTENANCE/RESERVED)
  - Amenities (jsonb, default '{}')
  - Creation/update timestamps (UTC)

## Database Schema

### Primary Tables
```sql
-- Properties Table (Matches CURRENT_SCHEMA.md exactly)
CREATE TABLE public.properties (
    id integer NOT NULL DEFAULT nextval('properties_id_seq'::regclass),
    name text NOT NULL,
    address text NOT NULL,
    type text NOT NULL,
    status property_status NOT NULL DEFAULT 'ACTIVE',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Floors Table (Matches CURRENT_SCHEMA.md exactly)
CREATE TABLE public.floors (
    id integer NOT NULL DEFAULT nextval('floors_id_seq'::regclass),
    property_id integer NOT NULL,
    floor_number integer NOT NULL,
    wing text,
    status floor_status NOT NULL DEFAULT 'ACTIVE',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone
);

-- Rental_Units Table (Matches CURRENT_SCHEMA.md exactly)
CREATE TABLE public.rental_unit (
    id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
    name text NOT NULL,
    number integer NOT NULL,
    capacity integer NOT NULL,
    rental_unit_status location_status NOT NULL DEFAULT 'VACANT',
    base_rate numeric(10,2) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    property_id integer NOT NULL,
    floor_id integer NOT NULL,
    type text NOT NULL,
    amenities jsonb DEFAULT '{}'
);
```

### Status Types (Matches CURRENT_SCHEMA.md exactly)
```sql
-- Property Status Type
CREATE TYPE property_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
);

-- Floor Status Type
CREATE TYPE floor_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);

-- Rental_unit Status Type
CREATE TYPE location_status AS ENUM (
    'VACANT',
    'OCCUPIED',
    'MAINTENANCE',
    'RESERVED'
);
```

okay 
## UI Components

### 1. Property List View
- Display properties in card/table format
- Show key information:
  - Name and status
  - Address and type
  - Floor count
  - Rental_unit count

### 2. Property Form
- Input fields for:
  - Property name (required, text)
  - Address (required, text)
  - Type (required, text)
  - Status (property_status)

### 3. Property Details
- Property information
- Floor list with status
- Rental_unit summary by status

## Core Features

### 1. Basic Analytics
- Count of properties by status
- Count of floors per property
- Count of rental_unit by status
- Basic occupancy tracking

### 2. Status Management
- Update property status (ACTIVE/INACTIVE only)
- Track status changes via timestamps
- Validate status changes

### 3. Search and Filter
- Search by property name
- Filter by status
- Sort by available fields
