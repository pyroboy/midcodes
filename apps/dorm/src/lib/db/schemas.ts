import type { RxJsonSchema } from 'rxdb';

/**
 * RxDB collection schemas for the dorm app.
 * All field names use snake_case to match existing client types (zero UI migration).
 * Drizzle serial IDs are coerced to strings since RxDB requires string primary keys.
 * Decimal fields use type 'string' to preserve precision.
 *
 * v1: added indexes for commonly queried non-nullable fields.
 *     Migration v0→v1 is identity (index-only change, no data transformation needed).
 *
 * RxDB 16 + Dexie indexing constraints:
 *   - Indexed fields must be scalar type (not union like ['string', 'null'])
 *   - Indexed fields must be in the `required` array
 *   - String indexed fields must have `maxLength`
 *   - Number indexed fields must have `minimum`, `maximum`, `multipleOf`
 *   - Therefore: nullable fields like `deleted_at` CANNOT be indexed (SC36/DXE1)
 *   - The `deleted_at: { $eq: null }` filter still works — just not index-accelerated
 */

// ─── Tenants ────────────────────────────────────────────────────────────────

export const tenantSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string', maxLength: 200 },
		contact_number: { type: ['string', 'null'] },
		email: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		auth_id: { type: ['string', 'null'] },
		emergency_contact: { type: ['object', 'null'] },
		tenant_status: { type: 'string', maxLength: 20 },
		created_by: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
		profile_picture_url: { type: ['string', 'null'] },
		address: { type: ['string', 'null'] },
		school_or_workplace: { type: ['string', 'null'] },
		facebook_name: { type: ['string', 'null'] },
		birthday: { type: ['string', 'null'] }
	},
	required: ['id', 'name', 'tenant_status'],
	indexes: ['name', 'tenant_status']
};

// ─── Leases ─────────────────────────────────────────────────────────────────

export const leaseSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		rental_unit_id: { type: 'string', maxLength: 20 },
		name: { type: 'string', maxLength: 200 },
		start_date: { type: 'string', maxLength: 30 },
		end_date: { type: 'string', maxLength: 30 },
		rent_amount: { type: 'string' },
		security_deposit: { type: 'string' },
		notes: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		created_by: { type: ['string', 'null'] },
		terms_month: { type: ['number', 'null'] },
		status: { type: 'string', maxLength: 20 },
		deleted_at: { type: ['string', 'null'] },
		deleted_by: { type: ['string', 'null'] },
		deletion_reason: { type: ['string', 'null'] }
	},
	required: ['id', 'name', 'rental_unit_id', 'start_date', 'end_date', 'rent_amount', 'security_deposit', 'status'],
	indexes: ['status', 'rental_unit_id']
};

// ─── Lease Tenants (junction table) ─────────────────────────────────────────

export const leaseTenantSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		lease_id: { type: 'string', maxLength: 20 },
		tenant_id: { type: 'string', maxLength: 20 },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'lease_id', 'tenant_id'],
	indexes: ['lease_id', 'tenant_id']
};

// ─── Rental Units ───────────────────────────────────────────────────────────

export const rentalUnitSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string', maxLength: 200 },
		capacity: { type: 'number', minimum: 0, maximum: 9999, multipleOf: 1 },
		rental_unit_status: { type: 'string', maxLength: 20 },
		base_rate: { type: 'string' },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		property_id: { type: 'string', maxLength: 20 },
		floor_id: { type: 'string', maxLength: 20 },
		type: { type: 'string', maxLength: 30 },
		amenities: { type: ['object', 'null'] },
		number: { type: 'number', minimum: 0, maximum: 999999, multipleOf: 1 },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'name', 'capacity', 'rental_unit_status', 'base_rate', 'property_id', 'floor_id', 'type', 'number'],
	indexes: ['floor_id', 'property_id']
};

// ─── Properties ─────────────────────────────────────────────────────────────

export const propertySchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string', maxLength: 200 },
		address: { type: 'string', maxLength: 500 },
		type: { type: 'string', maxLength: 30 },
		status: { type: 'string', maxLength: 20 },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'name', 'address', 'type', 'status'],
	indexes: ['name', 'status']
};

// ─── Floors ─────────────────────────────────────────────────────────────────

export const floorSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		property_id: { type: 'string', maxLength: 20 },
		floor_number: { type: 'number', minimum: -99, maximum: 999, multipleOf: 1 },
		wing: { type: ['string', 'null'] },
		status: { type: 'string', maxLength: 20 },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'property_id', 'floor_number', 'status'],
	indexes: ['property_id', 'floor_number']
};

// ─── Meters ─────────────────────────────────────────────────────────────────

export const meterSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		name: { type: 'string', maxLength: 200 },
		location_type: { type: 'string', maxLength: 30 },
		property_id: { type: ['string', 'null'] },
		floor_id: { type: ['string', 'null'] },
		rental_unit_id: { type: ['string', 'null'] },
		type: { type: 'string', maxLength: 30 },
		is_active: { type: ['boolean', 'null'] },
		status: { type: 'string', maxLength: 20 },
		notes: { type: ['string', 'null'] },
		initial_reading: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'name', 'location_type', 'type', 'status'],
	indexes: ['name', 'status']
};

// ─── Readings ───────────────────────────────────────────────────────────────

export const readingSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		meter_id: { type: 'string', maxLength: 20 },
		reading: { type: 'string' },
		reading_date: { type: 'string', maxLength: 30 },
		meter_name: { type: ['string', 'null'] },
		rate_at_reading: { type: ['string', 'null'] },
		previous_reading: { type: ['string', 'null'] },
		backdating_enabled: { type: ['boolean', 'null'] },
		review_status: { type: 'string', maxLength: 20 },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'meter_id', 'reading', 'reading_date', 'review_status'],
	indexes: ['meter_id', 'reading_date']
};

// ─── Billings ───────────────────────────────────────────────────────────────

export const billingSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		lease_id: { type: 'string', maxLength: 20 },
		type: { type: 'string', maxLength: 30 },
		utility_type: { type: ['string', 'null'] },
		amount: { type: 'string' },
		paid_amount: { type: ['string', 'null'] },
		balance: { type: 'string' },
		status: { type: 'string', maxLength: 20 },
		due_date: { type: 'string', maxLength: 30 },
		billing_date: { type: 'string', maxLength: 30 },
		penalty_amount: { type: ['string', 'null'] },
		notes: { type: ['string', 'null'] },
		meter_id: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'lease_id', 'type', 'amount', 'balance', 'status', 'due_date', 'billing_date'],
	indexes: ['lease_id', 'due_date', 'status']
};

// ─── Payments ───────────────────────────────────────────────────────────────

export const paymentSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		amount: { type: 'string' },
		method: { type: 'string', maxLength: 30 },
		reference_number: { type: ['string', 'null'] },
		paid_by: { type: 'string', maxLength: 200 },
		paid_at: { type: 'string', maxLength: 30 },
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
	indexes: ['paid_at', 'method']
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
	indexes: []
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
		description: { type: 'string', maxLength: 500 },
		type: { type: 'string', maxLength: 30 },
		status: { type: 'string', maxLength: 20 },
		created_by: { type: ['string', 'null'] },
		expense_date: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'amount', 'description', 'type', 'status'],
	indexes: ['type', 'status']
};

// ─── Budgets ────────────────────────────────────────────────────────────────

export const budgetSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		project_name: { type: 'string', maxLength: 200 },
		project_description: { type: ['string', 'null'] },
		project_category: { type: ['string', 'null'] },
		planned_amount: { type: 'string' },
		pending_amount: { type: ['string', 'null'] },
		actual_amount: { type: ['string', 'null'] },
		budget_items: { type: ['array', 'null'], items: { type: 'object' } },
		status: { type: ['string', 'null'] },
		start_date: { type: ['string', 'null'] },
		end_date: { type: ['string', 'null'] },
		property_id: { type: 'string', maxLength: 20 },
		created_by: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'project_name', 'planned_amount', 'property_id'],
	indexes: ['property_id', 'project_name']
};

// ─── Penalty Configs ────────────────────────────────────────────────────────

export const penaltyConfigSchema: RxJsonSchema<any> = {
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		type: { type: 'string', maxLength: 30 },
		grace_period: { type: 'number', minimum: 0, maximum: 365, multipleOf: 1 },
		penalty_percentage: { type: 'string' },
		compound_period: { type: ['number', 'null'] },
		max_penalty_percentage: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] },
	},
	required: ['id', 'type', 'grace_period', 'penalty_percentage'],
	indexes: ['type']
};

// ─── Floor Layout Items ────────────────────────────────────────────────────

export const floorLayoutItemSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 20 },
		floor_id: { type: 'string', maxLength: 20 },
		rental_unit_id: { type: ['string', 'null'] },
		item_type: { type: 'string', maxLength: 30 },
		grid_x: { type: 'number', minimum: -9999, maximum: 9999, multipleOf: 1 },
		grid_y: { type: 'number', minimum: -9999, maximum: 9999, multipleOf: 1 },
		grid_w: { type: 'number', minimum: 0, maximum: 999, multipleOf: 1 },
		grid_h: { type: 'number', minimum: 0, maximum: 999, multipleOf: 1 },
		label: { type: ['string', 'null'] },
		color: { type: ['string', 'null'] },
		created_at: { type: ['string', 'null'] },
		updated_at: { type: ['string', 'null'] },
		deleted_at: { type: ['string', 'null'] }
	},
	required: ['id', 'floor_id', 'item_type', 'grid_x', 'grid_y', 'grid_w', 'grid_h'],
	indexes: ['floor_id', 'item_type']
};
