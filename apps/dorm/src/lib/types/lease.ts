import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

export interface Floor {
  id: number;
  name: string;
  property_id: number;
}

export interface Property {
  id: number;
  name: string;
}

export interface RentalUnit {
  id: number;
  name: string;
  floor_id: number;
  property_id: number;
  floor: Floor;
  property: Property;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  contact_number: string;
}

export interface LeaseTenant {
  tenant: Tenant;
}

export interface PaymentAllocation {
  id: number;
  payment_id: number;
  billing_id: number;
  amount: number;
  created_at: string;
  payment: {
    id: number;
    paid_at: string;
    method: string;
    reference_number?: string;
  };
}

export interface Billing {
	id: number;
	lease_id: string;
	type: 'RENT' | 'UTILITY' | 'OTHER';
	utility_type?: 'ELECTRICITY' | 'WATER' | 'INTERNET' | 'OTHER';
	amount: number;
	paid_amount: number;
	balance: number;
	status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'PENALIZED';
	due_date: string;
	billing_date: string;
	paid_at?: string; // This should be the date the billing status becomes PAID
	notes?: string;
	allocations?: PaymentAllocation[];
	penalty_amount: number;
}

export interface LeaseResponse {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING';
  rental_unit: RentalUnit;
  lease_tenants: LeaseTenant[];
  billings: Billing[];
}

export interface Lease {
  id: string;
  name: string;
  type: 'STANDARD' | 'GROUP';
  balance: number;
  start_date: string;
  end_date: string;
  notes: string;
  security_deposit: number;
  rent_amount: number;
  terms_month: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING';
  unitName: string;
  floorName: string;
  propertyName: string;
  tenants: Tenant[];
  billings: Billing[];
  lease_tenants: {
    name: string;
    contact_number?: string;
    email?: string;
  }[];
  rental_unit: {
    rental_unit_number: string;
    floor?: {
      floor_number: string;
      wing?: string;
    };
    property?: {
      name: string;
    };
  };
}
