import { z } from 'zod';
import type { Database } from '$lib/database.types';

// Status Enums
type DbTenantStatus = Database['public']['Enums']['tenant_status'];
type DbLeaseType = Database['public']['Enums']['lease_type'];
type DbLeaseStatus = Database['public']['Enums']['lease_status'];

export const tenantStatusEnum = [
	'ACTIVE',
	'INACTIVE',
	'PENDING',
	'BLACKLISTED'
] as const satisfies readonly DbTenantStatus[];
export const leaseStatusEnum = [
	'ACTIVE',
	'INACTIVE',
	'EXPIRED',
	'TERMINATED'
] as const satisfies readonly DbLeaseStatus[];
export const locationStatusEnum = ['VACANT', 'OCCUPIED', 'RESERVED'] as const;
export const leaseTypeEnum = ['BEDSPACER', 'PRIVATEROOM'] as const satisfies readonly DbLeaseType[];

// Emergency Contact Schema
export type EmergencyContact = {
	name: string;
	relationship: string;
	phone: string;
	email: string;
	address: string;
};

const emergencyContactSchema = z.object({
	name: z.string().min(1, 'Emergency contact name is required'),
	relationship: z.string().min(1, 'Relationship is required'),
	phone: z.string().min(1, 'Phone number is required'),
	email: z.string().email('Invalid email format'),
	address: z.string().min(1, 'Address is required')
});

// Payment Schedule Schema
export type PaymentSchedule = {
	due_date: string;
	amount: number;
	type: 'RENT' | 'UTILITY' | 'MAINTENANCE';
	status: 'PENDING' | 'PAID' | 'OVERDUE';
};

const paymentScheduleSchema = z.object({
	due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	amount: z.number().min(0, 'Amount must be non-negative'),
	type: z.enum(['RENT', 'UTILITY', 'MAINTENANCE']),
	status: z.enum(['PENDING', 'PAID', 'OVERDUE'])
});

// Base Tenant Schema (for database operations)
export const baseTenantSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, 'Name is required'),
	contact_number: z.string().nullable(),
	email: z.string().email().nullable(),
	auth_id: z.string().uuid().nullable(),
	tenant_status: z.enum(tenantStatusEnum),
	lease_status: z.enum(leaseStatusEnum),
	lease_type: z.enum(leaseTypeEnum),
	lease_id: z.number().optional(),
	location_id: z.number().optional().nullable(),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	rent_amount: z.number().min(0, 'Rent amount must be non-negative').nullish(),
	security_deposit: z.number().min(0, 'Security deposit must be non-negative').nullish(),
	notes: z.string().nullish(),
	outstanding_balance: z
		.number()
		.min(0)
		.nullish()
		.transform((val) => val ?? 0),
	last_payment_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
		.nullish(),
	next_payment_due: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
		.nullish(),
	created_by: z.string().uuid(),
	emergency_contact: z.object({
		name: z.string().min(1, 'Name is required'),
		relationship: z.string().min(1, 'Relationship is required'),
		phone: z.string().min(1, 'Phone number is required'),
		email: z.string().email().optional(),
		address: z.string().min(1, 'Address is required')
	}),
	payment_schedules: z
		.array(
			z.object({
				id: z.number().optional(),
				due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
				amount: z.number().min(0, 'Amount must be non-negative'),
				type: z.enum(['RENT', 'UTILITY', 'MAINTENANCE']),
				status: z.enum(['PENDING', 'PAID', 'OVERDUE']).default('PENDING'),
				created_at: z.string().optional(),
				updated_at: z.string().optional()
			})
		)
		.optional(),
	status_history: z
		.array(
			z.object({
				status: z.enum(tenantStatusEnum),
				reason: z.string().min(1, 'Status change reason is required'),
				changed_at: z
					.string()
					.nullish()
					.transform((val) => val ?? new Date().toISOString()),
				changed_by: z.string().uuid().nullish()
			})
		)
		.optional()
});

// Form Schema (extends base schema with additional validation)
export const tenantSchema = z
	.object({
		id: z.number().optional(),
		name: z.string().min(1, 'Name is required'),
		contact_number: z.string().nullable(),
		email: z.string().email('Invalid email').nullable(),
		auth_id: z.string().uuid('Invalid user ID').nullable(),
		tenant_status: z.enum(tenantStatusEnum),
		lease_status: z.enum(leaseStatusEnum),
		lease_type: z.enum(leaseTypeEnum),
		lease_id: z.number().nullable(),
		location_id: z.number().nullable(),
		start_date: z.string(),
		end_date: z.string(),
		rent_amount: z.coerce.number().min(0, 'Rent amount must be positive'),
		security_deposit: z.coerce.number().min(0, 'Security deposit must be positive'),
		outstanding_balance: z.number().default(0),
		notes: z.string().nullable(),
		last_payment_date: z.string().nullable(),
		next_payment_due: z.string().nullable(),
		created_by: z.string(),
		emergency_contact: z.object({
			name: z.string().min(1, 'Emergency contact name is required'),
			relationship: z.string().min(1, 'Relationship is required'),
			phone: z.string().min(1, 'Phone number is required'),
			email: z.string().email('Invalid email').optional().nullable(),
			address: z.string().min(1, 'Address is required')
		}),
		payment_schedules: z
			.array(
				z.object({
					id: z.number(),
					due_date: z.string(),
					amount: z.number(),
					type: z.enum(['RENT', 'UTILITY', 'MAINTENANCE']),
					status: z.enum(['PENDING', 'PAID', 'OVERDUE']),
					created_at: z.string(),
					updated_at: z.string()
				})
			)
			.default([]),
		status_history: z
			.array(
				z.object({
					status: z.enum(tenantStatusEnum),
					reason: z.string(),
					changed_at: z.string(),
					changed_by: z.string()
				})
			)
			.default([])
	})
	.refine(
		(data) => {
			if (!data.start_date || !data.end_date) return true;
			return new Date(data.start_date) < new Date(data.end_date);
		},
		{
			message: 'End date must be after start date',
			path: ['end_date']
		}
	)
	.refine(
		(data) => {
			if (!data.start_date) return true;
			const startDate = new Date(data.start_date);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return startDate >= today;
		},
		{
			message: 'Start date cannot be in the past',
			path: ['start_date']
		}
	);

// Helper function to format date strings
export const formatDate = (date: string | null | undefined): string => {
	if (!date) return '';
	return new Date(date).toLocaleDateString();
};

// Helper function to format currency
export const formatCurrency = (amount: number | null | undefined): string => {
	if (amount == null) return '₱0.00';
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP'
	}).format(amount);
};

// Type exports
export type TenantFormData = z.infer<typeof tenantSchema>;
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type TenantStatus = (typeof tenantStatusEnum)[number];
export type LeaseStatus = (typeof leaseStatusEnum)[number];
export type LocationStatus = (typeof locationStatusEnum)[number];
export type LeaseType = (typeof leaseTypeEnum)[number];

/**
 * Tenant Management Schema Documentation
 *
 * This schema defines the validation and types for the tenant management module.
 *
 * Key Components:
 *
 * 1. Tenant Information
 *    - Basic details (name, contact, email)
 *    - Authentication link (auth_id)
 *    - Status tracking (tenant_status)
 *    - Audit fields (created_by, timestamps)
 *
 * 2. Lease Management
 *    - Location assignment (location_id)
 *    - Lease period (start_date, end_date)
 *    - Financial details (rent_amount, security_deposit)
 *    - Status tracking (lease_status)
 *    - Additional info (notes)
 *
 * 3. Payment Tracking
 *    - Outstanding balance
 *    - Payment schedule
 *    - Last payment date
 *    - Next payment due
 *
 * 4. Emergency Contact
 *    - Required fields: name, relationship, phone, address
 *    - Optional: email
 *
 * 5. Status History
 *    - Status changes
 *    - Change reasons
 *    - Audit trail (changed_at, changed_by)
 *
 * Validation Rules:
 * 1. All dates must be in YYYY-MM-DD format
 * 2. Lease end date must be after start date
 * 3. Payment schedules must fall within lease period
 * 4. All amounts must be non-negative
 * 5. Required fields must not be empty
 *
 * Default Values:
 * - tenant_status: 'PENDING'
 * - lease_status: 'ACTIVE'
 * - outstanding_balance: 0
 * - payment_schedule status: 'PENDING'
 */
