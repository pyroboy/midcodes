import type { PaymentStatus, BillingType, UtilityType } from './formSchema';

export interface PenaltyBilling {
	id: number;
	lease_id: number;
	type: BillingType;
	utility_type: UtilityType;
	amount: number;
	paid_amount: number;
	balance: number;
	status: PaymentStatus;
	due_date: string;
	billing_date: string;
	penalty_amount: number;
	notes: string | null;
	created_at: string;
	updated_at: string | null;
	lease?: {
		id: number;
		name: string;
		rental_unit?: {
			name: string;
			number: string;
			floors?: {
				floor_number: string;
				wing?: string;
			};
			properties?: {
				name: string;
			};
		};
		lease_tenants?: Array<{
			tenants?: {
				id: number;
				name: string;
				email?: string;
				contact_number?: string;
			};
		}>;
	};
}

export interface PenaltyFilter {
	dateRange?: {
		start: string;
		end: string;
	};
	status?: PaymentStatus | null;
	searchTerm?: string;
}

export interface PenaltyUpdatePayload {
	id: number;
	penalty_amount: number;
	notes?: string | null;
}
