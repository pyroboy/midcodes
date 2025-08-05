export interface Reading {
    id: number;
    meter_id: number;
    reading_date: string;
    reading: number;
    consumption?: number | null;
    cost?: number | null;
    rate_at_reading?: number | null; // Renamed from cost_per_unit
    previous_reading?: number | null;
    previous_reading_date?: string | null; // Date of the previous reading
    meter_name?: string | null;
    days_diff?: number | null; // Days between readings for billing period
    period?: string | null; // Billing period (e.g., "2025-04")
    meters?: {
      id: number;
      name: string;
      type: string;
      property_id: number;
    } | null;
  }
  
  export interface Rental_unit {
    id: number;
    name: string;
    number: string;
  }
  
  export interface Meter {
    id: number;
    name: string;
    type: string;
    initial_reading: number;
    location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
    property_id: number | null;
    floor_id: number | null;
    rental_unit_id: number | null;
    rental_unit: Rental_unit | null;
    unit: { name: string } | null;
  }
  
  export interface Property {
    id: number;
    name: string;
  }

export type ShareData = {
	tenant: Tenant;
	lease: { id: number; name: string };
	share: number;
};

// Defines the filters used for the utility billings page.
export type Filters = {
    property: Property | null;
    type: string | null;
    date: string;
    search: string;
  };


  // Structure for meter billings
  export type MeterBilling = {
    meter_id: number;
    meter_name: string;
    start_reading: number;
    end_reading: number;
    consumption: number;
    total_cost: number;
    tenant_count: number;
    per_tenant_cost: number;
  };
  
  // Structure for each meter reading entry
  export type MeterReadingEntry = {
    meterId: number;
    meterName: string;
    previousReading: number | null;
    previousDate: string | null;
    currentReading: number | null;
    consumption: number | null;
    cost: number | null;
    initialReading?: number | null;
  };
  
  export type FilterChangeEvent = {
    property?: number | null;
    type: string | null;
    date: string;
    search: string;
  };

  export type Tenant = {
    id: number;
    full_name: string;
    tenant_status?: string;
  };

  export type Lease = {
    id: number;
    name: string;
    rental_unit_id: number;
    status: string;
    rental_unit?: {
      id: number;
      name: string;
      number: number;
      type: string;
    } | null;
    roomName?: string;
    tenants: Tenant[] | null;
  };

  export type ReadingSaveEvent = {
    readings: Array<{
      meter_id: number;
      reading: number | null;
      reading_date: string;
      consumption?: number | null;
      previous_reading?: number | null;
      cost?: number | null;
    }>;
    readingDate: string;
    costPerUnit: number;
  };
  
  export type ExportEvent = {
    format: string;
    fromDate: string;
    toDate: string;
  };
  
  // New types for the consumption chart
  export type ChartData = {
    label: string;
    value: number;
    color: string;
  };
  
  export type ChartDataset = {
    labels: string[];
    values: number[];
    colors: string[];
  };
  
  export type ConsumptionByType = {
    [key: string]: number;
  };
  
  export type ConsumptionTrend = {
    date: string;
    consumption: number;
  };
  
  export type ChartProps = {
    readings: Reading[];
    meters: Meter[];
    selectedType: string | null;
  };
  
  // Grouped reading structure for the table
  export interface GroupedReading {
    date: string;
    properties: PropertyGroup[];
    totalConsumption: number;
    totalCost: number;
  }
  
  export interface PropertyGroup {
    propertyId: number;
    propertyName: string;
    meters: MeterData[];
    totalConsumption: number;
    totalCost: number;
  }
  
  export interface MeterData {
	meterId: number;
	meterName: string;
	meterType: string;
	unit: string; 
	currentReading: number | null;
	currentReadingDate: string | null;
	lastReading: number | null; 
	lastReadingDate: string | null;
	consumption: number | null;
	costPerUnit: number | null;
	totalCost: number | null;
	history: Reading[];
  }

  // Reading group structure for previous readings
  export interface ReadingGroup {
    date: string;
    readings: any[];
    monthName?: string;
  }