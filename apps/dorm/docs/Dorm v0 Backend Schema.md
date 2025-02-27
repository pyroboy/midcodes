# Backend Documentation

## Database Schema

### Tables

#### utility_rates
```sql
CREATE TABLE utility_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utility_type TEXT NOT NULL CHECK (utility_type IN ('electricity', 'water')),
    rate_per_unit DECIMAL(10,2) NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### utility_readings
```sql
CREATE TABLE utility_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id),
    utility_type TEXT NOT NULL CHECK (utility_type IN ('electricity', 'water')),
    previous_reading DECIMAL(10,2) NOT NULL,
    current_reading DECIMAL(10,2) NOT NULL,
    consumption DECIMAL(10,2) NOT NULL,
    reading_date DATE NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### monthly_summaries
```sql
CREATE TABLE monthly_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID REFERENCES floors(id),
    month DATE NOT NULL,
    total_occupancy INTEGER NOT NULL,
    total_rent_collected DECIMAL(10,2) NOT NULL,
    total_utility_charges DECIMAL(10,2) NOT NULL,
    overall_balance DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Utility Management

#### POST /api/utility-readings/batch
- Accepts batch readings for multiple rooms
- Calculates consumption
- Flags unusual patterns
- Returns generated bills

#### GET /api/monthly-report/:year/:month
- Returns floor-wise summary
- Includes occupancy rates
- Shows utility consumption
- Provides overall balance

#### GET /api/utility-rates/current
- Returns current rates for all utility types

#### POST /api/utility-rates
- Sets new utility rates
- Validates rate values
- Records effective date