import type { Database } from '$lib/database.types';

export type BaseProfile = Database['public']['Tables']['profiles']['Row'] & {
  full_name: string;
  contact_number?: string;
};

export type Profile = BaseProfile;

export type Property = Database['public']['Tables']['properties']['Row'];

export type Floor = {
  id: number;
  property_id: number;
  floor_number: number;
  wing: string | null;
  status: Database['public']['Enums']['floor_status'];
  created_at: string;
  updated_at: string | null;
};

export type Room = {
  id: number;
  name: string;
  number: number;
  capacity: number;
  room_status: Database['public']['Enums']['location_status'];
  base_rate: number;
  created_at: string;
  updated_at: string | null;
  property_id: number;
  floor_id: number;
  type: string;
  amenities: Record<string, any> | null;
  floor?: Floor;
  property: Property;
};

export type Lease = Database['public']['Tables']['leases']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];

export type PaymentSchedule = {
  id: number;
  due_date: string;
  amount: number;
  type: 'RENT' | 'UTILITY' | 'MAINTENANCE';
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  created_at: string;
  updated_at: string;
};

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address: string;
};

export type ExtendedLease = {
  id: number;
  location: Room;
  user: Profile;
  name: string;
  status: Database['public']['Enums']['lease_status'];
  type: Database['public']['Enums']['lease_type'];
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  balance: number;
  notes: string | null;
  payment_schedules: PaymentSchedule[];
  outstanding_balance: number;
  last_payment_date: string | null;
  next_payment_due: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
};

export type ExtendedTenant = {
  id: number;
  name: string;
  contact_number: string | null;
  email: string | null;
  auth_id: string | null;
  tenant_status: Database['public']['Enums']['tenant_status'];
  lease_type: Database['public']['Enums']['lease_type'];
  lease_status: Database['public']['Enums']['lease_status'];
  lease?: ExtendedLease;
  emergency_contact: EmergencyContact;
  start_date: string;
  end_date: string;
  outstanding_balance: number;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  status_history?: {
    status: Database['public']['Enums']['tenant_status'];
    reason: string;
    changed_at: string;
    changed_by: string;
  }[];
};

export type Selected<T> = {
  value: T;
};
