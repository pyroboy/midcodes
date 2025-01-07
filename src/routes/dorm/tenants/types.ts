// types.ts
import type { Database } from '$lib/database.types';
import type { SuperValidated } from 'sveltekit-superforms';
import { z } from 'zod';
import { tenantFormSchema } from './formSchema';

export type ServerProfile = Database['public']['Tables']['profiles']['Row'];
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
export type LeaseStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED';
export type LeaseType = 'BEDSPACER' | 'PRIVATEROOM';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string;
}

export interface ExtendedLease {
  id: string;
  type: LeaseType;
  status: LeaseStatus;
  location: {
    id: string;
    number: string;
    property: {
      id: string;
      name: string;
    } | null;
  } | null;
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  balance: number;
  notes: string | null;
}

export interface ExtendedTenant {
  id: number;
  name: string;
  contact_number: string | null;
  email: string | null;
  tenant_status: TenantStatus;
  auth_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  emergency_contact: EmergencyContact | null;
  lease: ExtendedLease | null;
  lease_type: LeaseType;
  lease_status: LeaseStatus;
  start_date: string;
  end_date: string;
  outstanding_balance: number;
}

export type Rental_unit = Database['public']['Tables']['rental_unit']['Row'];

export interface PageState {
  form: SuperValidated<z.infer<typeof tenantFormSchema>>;
  tenants: ExtendedTenant[];
  rental_unit: Rental_unit[];
  properties: Database['public']['Tables']['properties']['Row'][];
  profile: ServerProfile | null;
  isAdminLevel: boolean;
  isStaffLevel: boolean;
}