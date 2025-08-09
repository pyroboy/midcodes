import type { Database } from '$lib/database.types';

type DBTenant = Database['public']['Tables']['tenants']['Row'];
type DBLease = Database['public']['Tables']['leases']['Row'];

import type { EmergencyContact } from '../../routes/tenants/formSchema';

// Simplified lease type for tenant relationships (basic info only)
export type TenantLease = {
	id: number;
	name: string;
	start_date: string;
	end_date: string;
	status: string;
	rental_unit: {
		id: string;
		name: string;
		number: string;
		property: {
			id: string;
			name: string;
		} | null;
	} | null;
};

// Response type with relationships - supports multiple leases (simplified)
export type TenantResponse = Omit<DBTenant, 'emergency_contact'> & {
	tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
	emergency_contact: EmergencyContact | null;
	profile_picture_url?: string | null;
  address?: string | null;
  school_or_workplace?: string | null;
  facebook_name?: string | null;
  birthday?: string | null;
	leases: TenantLease[];
	// Backward compatibility - primary lease (first active lease)
	lease?: TenantLease | null;
};
