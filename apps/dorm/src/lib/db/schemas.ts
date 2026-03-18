import type { RxJsonSchema } from 'rxdb';

/**
 * RxDB collection schemas for the dorm app.
 * All field names use snake_case to match existing client types (zero UI migration).
 * Drizzle serial IDs are coerced to strings since RxDB requires string primary keys.
 * Decimal fields use type 'string' to preserve precision.
 *
 * v1: added indexes for commonly queried fields (deleted_at + relation keys).
 *     Migration v0→v1 is identity (index-only change, no data transformation needed).
 */

// ─── Tenants ────────────────────────────────────────────────────────────────

export const tenantSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string' },
		contact_number: { type: ['string', 'null'] },
		email: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		auth_id: { type: ['string', 'null'] },
		emergency_contact: { type: ['object', 'null'] },
		tenant_status: { type: 'string' },
		created_by: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
		profile_picture_url: { type: ['string', 'null'] },
		address: { type: ['string', 'null'] },
		school_or_workplace: { type: ['string', 'null'] },
		facebook_name: { type: ['string', 'null'] },
		birthday: { type: ['string', 'null'] }
	},
	required: ['id', 'name', 'tenant_status'],
	indexes: ['deleted_at']
};

// ─── Leases ─────────────────────────────────────────────────────────────────

export const leaseSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		rental_unit_id: { type: 'string' },
		name: { type: 'string' },
		start_date: { type: 'string' },
		end_date: { type: 'string' },
		rent_amount: { type: 'string' },
		security_deposit: { type: 'string' },
		notes: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		created_by: { type: ['string', 'null'] },
		terms_month: { type: ['number', 'null'] },
		status: { type: 'string' },
		deleted_at: { type: ['string', 'null'] },
		deleted_by: { type: ['string', 'null'] },
		deletion_reason: { type: ['string', 'null'] }
	},
	required: ['id', 'name', 'rental_unit_id', 'start_date', 'end_date', 'rent_amount', 'security_deposit', 'status'],
	indexes: ['deleted_at', 'status', 'rental_unit_id']
};

// ─── Lease Tenants (junction table) ─────────────────────────────────────────

export const leaseTenantSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		lease_id: { type: 'string' },
		tenant_id: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'lease_id', 'tenant_id'],
	indexes: ['deleted_at', 'lease_id', 'tenant_id']
};

// ─── Rental Units ───────────────────────────────────────────────────────────

export const rentalUnitSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string' },
		capacity: { type: 'number' },
		rental_unit_status: { type: 'string' },
		base_rate: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		property_id: { type: 'string' },
		floor_id: { type: 'string' },
		type: { type: 'string' },
		amenities: { type: ['object', 'null'] },
		number: { type: 'number' },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'name', 'capacity', 'rental_unit_status', 'base_rate', 'property_id', 'floor_id', 'type', 'number'],
	indexes: ['deleted_at', 'floor_id', 'property_id']
};

// ─── Properties ─────────────────────────────────────────────────────────────

export const propertySchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string' },
		address: { type: 'string' },
		type: { type: 'string' },
		status: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'name', 'address', 'type', 'status'],
	indexes: ['deleted_at']
};

// ─── Floors ─────────────────────────────────────────────────────────────────

export const floorSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		property_id: { type: 'string' },
		floor_number: { type: 'number' },
		wing: { type: ['string', 'null'] },
		status: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'property_id', 'floor_number', 'status'],
	indexes: ['deleted_at', 'property_id']
};

// ─── Meters ─────────────────────────────────────────────────────────────────

export const meterSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string' },
		location_type: { type: 'string' },
		property_id: { type: ['string', 'null'] },
		floor_id: { type: ['string', 'null'] },
		rental_unit_id: { type: ['string', 'null'] },
		type: { type: 'string' },
		is_active: { type: ['boolean', 'null'] },
		status: { type: 'string' },
		notes: { type: ['string', 'null'] },
		initial_reading: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'name', 'location_type', 'type', 'status'],
	indexes: ['deleted_at', 'rental_unit_id']
};

// ─── Readings ───────────────────────────────────────────────────────────────

export const readingSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		meter_id: { type: 'string' },
		reading: { type: 'string' },
		reading_date: { type: 'string' },
		meter_name: { type: ['string', 'null'] },
		rate_at_reading: { type: ['string', 'null'] },
		previous_reading: { type: ['string', 'null'] },
		backdating_enabled: { type: ['boolean', 'null'] },
		review_status: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'meter_id', 'reading', 'reading_date', 'review_status'],
	indexes: ['deleted_at', 'meter_id', 'reading_date']
};

// ─── Billings ───────────────────────────────────────────────────────────────

export const billingSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		lease_id: { type: 'string' },
		type: { type: 'string' },
		utility_type: { type: ['string', 'null'] },
		amount: { type: 'string' },
		paid_amount: { type: ['string', 'null'] },
		balance: { type: 'string' },
		status: { type: 'string' },
		due_date: { type: 'string' },
		billing_date: { type: 'string' },
		penalty_amount: { type: ['string', 'null'] },
		notes: { type: ['string', 'null'] },
		meter_id: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'lease_id', 'type', 'amount', 'balance', 'status', 'due_date', 'billing_date'],
	indexes: ['deleted_at', 'lease_id', 'due_date']
};

// ─── Payments ───────────────────────────────────────────────────────────────

export const paymentSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		amount: { type: 'string' },
		method: { type: 'string' },
		reference_number: { type: ['string', 'null'] },
		paid_by: { type: 'string' },
		paid_at: { type: 'string' },
		notes: { type: ['string', 'null'] },
		receipt_url: { type: ['string', 'null'] },
		created_by: { type: ['string', 'null'] },
		updated_by: { type: ['string', 'null'] },
		billing_ids: { type: ['array', 'null'], items: { type: 'string' } },
		billing_id: { type: ['string', 'null'] },
		reverted_at: { type: ['string', 'null'] },
		reverted_by: { type: ['string', 'null'] },
		revert_reason: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'amount', 'method', 'paid_by', 'paid_at'],
	indexes: ['deleted_at', 'paid_at']
};

// ─── Payment Allocations ────────────────────────────────────────────────────

export const paymentAllocationSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		payment_id: { type: ['string', 'null'] },
		billing_id: { type: ['string', 'null'] },
		amount: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'amount'],
	indexes: ['deleted_at', 'payment_id', 'billing_id']
};

// ─── Expenses ───────────────────────────────────────────────────────────────

export const expenseSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		property_id: { type: ['string', 'null'] },
		amount: { type: 'string' },
		description: { type: 'string' },
		type: { type: 'string' },
		status: { type: 'string' },
		created_by: { type: ['string', 'null'] },
		expense_date: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'amount', 'description', 'type', 'status'],
	indexes: ['deleted_at', 'property_id', 'expense_date']
};

// ─── Budgets ────────────────────────────────────────────────────────────────

export const budgetSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		project_name: { type: 'string' },
		project_description: { type: ['string', 'null'] },
		project_category: { type: ['string', 'null'] },
		planned_amount: { type: 'string' },
		pending_amount: { type: ['string', 'null'] },
		actual_amount: { type: ['string', 'null'] },
		budget_items: { type: ['array', 'null'], items: { type: 'object' } },
		status: { type: ['string', 'null'] },
		start_date: { type: ['string', 'null'] },
		end_date: { type: ['string', 'null'] },
		property_id: { type: 'string' },
		created_by: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'project_name', 'planned_amount', 'property_id'],
	indexes: ['deleted_at', 'property_id']
};

// ─── Penalty Configs ────────────────────────────────────────────────────────

export const penaltyConfigSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		type: { type: 'string' },
		grace_period: { type: 'number' },
		penalty_percentage: { type: 'string' },
		compound_period: { type: ['number', 'null'] },
		max_penalty_percentage: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'type', 'grace_period', 'penalty_percentage'],
	indexes: ['deleted_at']
};
