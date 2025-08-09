import type { z } from 'zod';
import type {
	transactionSchema,
	paymentMethodEnum,
	transactionStatusEnum,
	dateRangeSchema,
	transactionFilterSchema
} from './schema';
import type { SuperValidated, SuperForm } from 'sveltekit-superforms';

// Primary Payment types aligned with database schema
export type Payment = z.infer<typeof transactionSchema> & {
    lease_name?: string | null;
    allocations?: PaymentAllocation[];
};

// Alias for backward compatibility (since component still uses "Transaction")
export type Transaction = Payment;

export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type TransactionStatus = z.infer<typeof transactionStatusEnum>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// Payment allocation structure matching payment_allocations table
export interface PaymentAllocation {
	id?: number;
	payment_id?: number;
	billing_id: number;
	amount: number;
	created_at?: string;
}

// Simplified billing interface for selection in payment form
export interface BillingForPayment {
	id: number;
	lease_id: number;
	type: 'RENT' | 'UTILITY' | 'SECURITY_DEPOST' | 'OTHER';
	utility_type: 'WATER' | 'ELECTRICITY' | 'INTERNET' | null;
	amount: number;
	balance: number;
	due_date: string;
	lease?: {
		name: string;
		rental_unit?: {
			rental_unit_number: string;
		};
	};
}

// Additional types for the UI
export interface TransactionTableRow {
	id?: number;
	method: PaymentMethod;
	amount: number;
	paid_by: string;
	paid_at: string | null;
	receipt_url: string | null;
	reference_number: string | null;
	lease_name?: string | null;
	tenant_name?: string;
	unit_name?: string;
	created_by_name?: string;
	updated_by_name?: string;
}

// Interfaces for comprehensive lease information
export interface LeaseDetails {
	id: number;
	name: string;
	start_date: string;
	end_date: string;
	rent_amount: number;
	security_deposit: number;
	status: string;
	rental_unit?: {
		id: number;
		rental_unit_number: string;
		floor?: {
			floor_number: number;
			wing?: string;
		};
	};
	tenants?: TenantInfo[];
}

export interface TenantInfo {
	id: number;
	name: string;
	email?: string;
	phone?: string;
}

export interface BillingLeaseInfo {
	billing_id: number;
	billing_type: string;
	utility_type?: string;
	billing_amount: number;
	allocated_amount: number;
	due_date: string;
	lease: LeaseDetails;
}

// Extended Payment interface with profile data and comprehensive lease information
export interface PaymentWithProfiles extends Payment {
	created_by_profile?: {
		id: string;
		full_name: string;
		[key: string]: any;
	};
	updated_by_profile?: {
		id: string;
		full_name: string;
		[key: string]: any;
	};
	billing_lease?: any;
	lease_name?: string | null;
	// New comprehensive lease information
	lease_details?: BillingLeaseInfo[];
	unique_leases?: LeaseDetails[];
	// Timestamp fields for audit information
	created_at?: string;
	updated_at?: string | null;
}

// Alias for backward compatibility
export interface TransactionWithProfiles extends PaymentWithProfiles {}

export interface TransactionFilterOptions {
	method?: PaymentMethod;
	date_from?: string;
	date_to?: string;
	search_term?: string;
}

// Profile interface for creators/updaters
export interface Profile {
	id: string;
	full_name: string;
	[key: string]: any;
}

// User interface
export interface User {
	id: string;
	full_name: string;
	[key: string]: any;
}

// Database table structure exactly matching the payments table from DORMSCHEMA.md
export interface PaymentDB {
	id: number;
	amount: number; // numeric(10,2)
	method: PaymentMethod;
	reference_number: string | null;
	paid_by: string;
	paid_at: string; // timestamp with time zone
	notes: string | null;
	created_at: string; // timestamp with time zone
	receipt_url: string | null;
	created_by: string | null; // UUID
	updated_by: string | null; // UUID
	updated_at: string | null; // timestamp with time zone
	billing_ids: number[]; // integer array
	billing_id: number | null; // legacy field, nullable
}

// Simplified form state interface for the component
export interface PaymentFormState {
	form: any;
	errors: any;
	enhance: any;
	submitting: boolean;
}
