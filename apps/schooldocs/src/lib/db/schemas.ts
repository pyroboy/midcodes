/**
 * RxDB JSON schemas for the two client-cached collections:
 *   - orders        (admin work queue — frequently re-read, benefits from local cache)
 *   - document_types (config data — nearly static, no point hitting Neon on every page)
 *
 * Note: These schemas mirror the Drizzle schema but simplified for RxDB's JSON format.
 * RxDB version bumps trigger migrations — increment when adding/removing fields.
 */

export const ordersSchema = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 36 },
		org_id: { type: 'string' },
		student_id: { type: ['string', 'null'] },
		requester_name: { type: 'string' },
		requester_email: { type: ['string', 'null'] },
		requester_student_number: { type: ['string', 'null'] },
		requester_program: { type: ['string', 'null'] },
		requester_year_level: { type: ['number', 'null'] },
		purpose: { type: ['string', 'null'] },
		delivery_method: {
			type: 'string',
			enum: ['pickup', 'courier', 'email']
		},
		delivery_address: { type: ['string', 'null'] },
		status: {
			type: 'string',
			enum: ['pending', 'processing', 'ready', 'completed', 'cancelled', 'flagged']
		},
		total_amount: { type: ['string', 'null'] },
		notes: { type: ['string', 'null'] },
		flags: { type: 'object' },
		processing_steps: { type: 'array' },
		assigned_to: { type: ['string', 'null'] },
		completed_at: { type: ['string', 'null'] },
		created_at: { type: 'string' },
		updated_at: { type: 'string' }
	},
	required: ['id', 'org_id', 'requester_name', 'status', 'delivery_method', 'created_at', 'updated_at'],
	indexes: ['status', 'created_at', 'assigned_to', 'org_id']
} as const;

export const documentTypesSchema = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 36 },
		org_id: { type: 'string' },
		name: { type: 'string' },
		description: { type: ['string', 'null'] },
		price: { type: 'string' }, // numeric stored as string
		processing_time_hours: { type: ['number', 'null'] },
		requirements: { type: 'array' },
		max_copies: { type: ['number', 'null'] },
		purpose_required: { type: 'boolean' },
		status: {
			type: 'string',
			enum: ['active', 'inactive', 'archived']
		},
		metadata: { type: 'object' },
		created_at: { type: 'string' },
		updated_at: { type: 'string' }
	},
	required: ['id', 'org_id', 'name', 'status', 'created_at', 'updated_at'],
	indexes: ['status', 'org_id']
} as const;
