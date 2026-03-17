// types.ts

export type ServerProfile = {
	id: string;
	email: string | null;
	role: string;
	created_at: string;
	updated_at: string;
	org_id: string | null;
	context: Record<string, any> | null;
};

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
	start_date: string;
	end_date: string;
	outstanding_balance: number;
}

export interface Rental_unit {
	id: number;
	name: string;
	number: number;
	capacity: number;
	rental_unit_status: string;
	base_rate: number;
	created_at: string;
	updated_at: string | null;
	property_id: number;
	floor_id: number;
	type: string;
	amenities: Record<string, any> | null;
}
