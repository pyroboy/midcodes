import type { Database } from '../database.types';

type DBLease = Database['public']['Tables']['leases']['Row'];
type DBTenant = Database['public']['Tables']['tenants']['Row'];
type DBRentalUnit = Database['public']['Tables']['rental_unit']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];
type DBFloor = Database['public']['Tables']['floors']['Row'];

export interface LeaseResponse extends DBLease {
  tenant: Pick<DBTenant, 'id' | 'name' | 'email' | 'contact_number'>;
  rental_unit: Pick<DBRentalUnit, 'id' | 'name'> & {
    property: Pick<DBProperty, 'id' | 'name'>;
    floor: Pick<DBFloor, 'floor_number' | 'wing'>;
  };
  payment_schedules: PaymentSchedule[];
  balance: number;
}

export interface LeaseTenant {
  tenant: {
    id: number;
    name: string;
    email: string | null;
    contact_number: string | null;
  };
}

export interface RentalUnit {
  id: number;
  rental_unit_number: string;
  property_id: number;
  floor_id?: number;
}

export interface PaymentSchedule {
  id: number;
  lease_id: number;
  due_date: string;
  expected_amount: number;
  status: string;
  type: string;
  frequency: string;
}

export interface Lease {
  id: number;
  name?: string;
  status: string;
  type: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  notes?: string;
  rental_unit_id: number;
}
