import type { Database } from '$lib/database.types';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
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
  email: string;
  address: string;
};

export type ExtendedLease = Omit<Lease, 'location_id' | 'user_id'> & {
  location: Room;
  user: Profile;
  payment_schedules: PaymentSchedule[];
};

export type ExtendedTenant = Tenant & {
  lease?: ExtendedLease;
  emergency_contact: EmergencyContact;
  status_history?: {
    status: Database['public']['Enums']['tenant_status'];
    reason: string;
    changed_at: string;
    changed_by: string;
  }[];
};
