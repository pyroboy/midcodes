# Utility Billings Route - Tables and Instructions

## Related Tables

### 1. meters
- `id`: Unique identifier for the meter
- `name`: Name of the meter
- `location_type`: Location type (from meter_location_type enum)
- `property_id`: Reference to the property (nullable)
- `floor_id`: Reference to the floor (nullable)
- `rental_unit_id`: Reference to the rental unit (nullable)
- `type`: Utility type (from utility_type enum)
- `is_active`: Boolean indicating if meter is active
- `status`: Meter status (default 'ACTIVE')
- `initial_reading`: Initial meter reading

### 2. readings
- `id`: Unique identifier for the reading
- `meter_id`: Reference to the meter
- `reading`: Meter reading value
- `reading_date`: Date of the reading
- `meter_name`: Name of the meter
- `consumption`: Units consumed
- `cost`: Total cost of consumption
- `cost_per_unit`: Cost per unit of consumption
- `previous_reading`: Previous meter reading

### 3. properties
- `id`: Unique identifier for the property
- `name`: Name of the property
- `address`: Property address
- `type`: Property type
- `status`: Property status (default 'ACTIVE')

### 4. rental_unit
- `id`: Unique identifier for the rental unit
- `name`: Name of the rental unit
- `property_id`: Reference to the property
- `floor_id`: Reference to the floor
- `type`: Rental unit type
- `rental_unit_status`: Status of the unit (default 'VACANT')



## Relationships
- A property can have multiple meters
- A meter can be associated with:
  - A property
  - A floor
  - A rental unit
- Readings are tied to specific meters
- Rental units are associated with properties and floors

## Utility Types (from utility_type enum)
- Likely includes:
  - WATER
  - ELECTRICITY
  - GAS
  - INTERNET
  - CABLE

## Workflow
1. Select a property
2. Choose a meter/utility type
3. Enter meter readings
4. System calculates:
   - Consumption
   - Cost per unit
   - Total cost

## For the @ ConsolidatedReadingsTable
STATUS : Okay good
- Group by reading date, and property, so no need to show the reading date and property column
- and make sure to show the total calculation per row,
- as per readingdate propert table group show the grand total outside the table per reading date group,
- only display one meter at a time and onclick show the readings history
- Chronological, expandable view of meter readings (reading history)

## For the @ ReadingEntryModal
STATUS : almost good
- lets just fix the input validation the we cant input the current value that is less than the prvious reading


## Key Calculations
- Consumption = Current Reading - Previous Reading
- Total Cost = Consumption * Cost per Unit

## Data Entry Constraints
- Reading must be a positive number
- Meter must be active
- Reading date must be valid
- Must reference an existing meter
- reading can never be below the previous reading  @ ReadingEntryModal
