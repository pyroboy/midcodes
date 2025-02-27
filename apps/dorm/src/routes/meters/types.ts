// Define types for the meter readings

export type Property = { id: number; name: string; status: string };
export type Floor = { id: number; property_id: number; floor_number: number; status: string };
export type RentalUnit = { id: number; floor_id: number; number: string; status: string };
export type Meter = {
  id?: number;
  name: string;
  location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
  property_id?: number;
  floor_id?: number;
  rental_unit_id?: number;
  initial_reading: number;
  type: 'ELECTRICITY' | 'WATER' | 'INTERNET';
  notes?: string;
};


export interface Reading {
    id: number;
    meter_id: number;
    reading: number;
    reading_date: string;
    created_at: string;
    meter_name?: string;
    consumption?: number;
    cost?: number;
    cost_per_kwh?: number;
    previous_reading?: number;
  }
  
  // Define types for the meter with readings
  export interface LatestReading {
    value: number;
    date: string;
  }
  
  export interface MeterWithReading {
    id: number;
    name: string;
    location_type: 'PROPERTY' | 'FLOOR' | 'RENTAL_UNIT';
    property_id: number | null;
    floor_id: number | null;
    rental_unit_id: number | null;
    type: 'ELECTRICITY' | 'WATER' | 'INTERNET';
    is_active: boolean;
    initial_reading: number;
    notes: string | null;
    created_at: string;
    latest_reading?: LatestReading;
  }