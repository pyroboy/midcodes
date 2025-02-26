export interface Reading {
    id: number;
    meter_id: number;
    reading_date: string;
    reading: number;
    consumption?: number | null;
    cost?: number | null;
    cost_per_unit?: number | null;
    previous_reading?: number | null;
    meter_name?: string | null;
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
    location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
    property_id: number | null;
    floor_id: number | null;
    rental_unit_id: number | null;
    rental_unit: Rental_unit[] | null;
  }
  
  export interface Property {
    id: number;
    name: string;
  }
  
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
  };
  
  export type FilterChangeEvent = {
    property: number | null;
    type: string | null;
    date: string;
    search: string;
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