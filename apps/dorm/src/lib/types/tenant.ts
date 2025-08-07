import type { Database } from '$lib/database.types';

type DBTenant = Database['public']['Tables']['tenants']['Row'];
type DBLease = Database['public']['Tables']['leases']['Row'];

import type { EmergencyContact } from '../../routes/tenants/formSchema';

// Response type with relationships
export type TenantResponse = Omit<DBTenant, 'emergency_contact'> & {
	tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
	emergency_contact: EmergencyContact | null;
	profile_picture_url?: string | null;
	lease:
		| (DBLease & {
				location: {
					id: string;
					name: string;
					number: string;
					base_rate?: number;
					property: {
						id: string;
						name: string;
					} | null;
				} | null;
		  })
		| null;
};
