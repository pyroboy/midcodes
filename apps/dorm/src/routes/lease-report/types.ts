// Types for database tables

export interface Floor {
	id: number;
	property_id: number;
	floor_number: number;
	wing?: string;
	status: 'ACTIVE' | 'INACTIVE';
}

export interface RentalUnit {
	id: number;
	name: string;
	capacity: number;
	rental_unit_status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
	base_rate: number;
	property_id: number;
	floor_id: number;
	type: string;
	number: number;
	property?: {
		id: number;
		name: string;
	};
}

export interface Lease {
	id: number;
	rental_unit_id: number;
	name: string;
	start_date: string;
	end_date: string;
	rent_amount: number;
	security_deposit: number;
	balance: number;
	notes?: string;
	status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'EXPIRED';
	unit_type?: 'BEDSPACER' | 'PRIVATE_ROOM';
	lease_tenants?: LeaseTenant[];
	rental_unit?: RentalUnit;
}

export interface LeaseTenant {
	id: number;
	lease_id: number;
	tenant_id: number;
	tenant?: Tenant;
}

export interface Tenant {
	id: number;
	name: string;
	contact_number?: string;
	email?: string;
}

export interface Billing {
	id: number;
	lease_id: number;
	type: 'RENT' | 'UTILITIES' | 'UTILITY' | 'PENALTY' | 'OTHER';
	utility_type?: 'ELECTRICITY' | 'WATER' | 'INTERNET' | 'GAS' | 'OTHER';
	amount: number;
	paid_amount: number;
	balance: number;
	status: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
	due_date: string;
	billing_date: string;
	notes?: string;
}

export interface Property {
	id: number;
	name: string;
	address: string;
	type: string;
	status: 'ACTIVE' | 'INACTIVE';
}
