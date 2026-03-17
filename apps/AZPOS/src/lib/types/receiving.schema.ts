import { z } from 'zod';

// Schema for receiving session
export const receivingSessionSchema = z.object({
	id: z.string(),
	purchase_order_id: z.string(),
	status: z.enum(['pending', 'in_progress', 'completed', 'discrepancy']).default('pending'),
	carrier: z.string().optional(),
	tracking_number: z.string().optional(),
	package_condition: z.string().optional(),
	photos: z.array(z.string()).optional(),
	received_by: z.string().optional(),
	received_at: z.string().datetime().optional(),
	notes: z.string().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime().optional()
});

// Schema for product relation in receiving items
export const receivingItemProductSchema = z.object({
	id: z.string(),
	name: z.string(),
	sku: z.string(),
	requires_batch_tracking: z.boolean().optional()
});

// Schema for receiving item
export const receivingItemSchema = z.object({
	id: z.string(),
	receiving_session_id: z.string(),
	product_id: z.string(),
	quantity_expected: z.number(),
	quantity_received: z.number(),
	variance: z.number().optional(),
	batch_number: z.string().optional(),
	expiration_date: z.string().datetime().optional(),
	condition: z.string().optional(),
	notes: z.string().optional(),
	created_at: z.string().datetime(),
	product: receivingItemProductSchema.optional()
});

// Schema for creating a receiving session
export const createReceivingSessionSchema = z.object({
	purchase_order_id: z.string(),
	carrier: z.string().optional(),
	tracking_number: z.string().optional(),
	package_condition: z.string().optional(),
	photos: z.array(z.string()).optional(),
	notes: z.string().optional()
});

// Schema for creating a receiving item
export const createReceivingItemSchema = z.object({
	receiving_session_id: z.string(),
	product_id: z.string(),
	quantity_expected: z.number(),
	quantity_received: z.number(),
	batch_number: z.string().optional(),
	expiration_date: z.string().datetime().optional(),
	condition: z.string().optional(),
	notes: z.string().optional()
});

// Schema for updating a receiving session
export const updateReceivingSessionSchema = z.object({
	status: z.enum(['pending', 'in_progress', 'completed', 'discrepancy']).optional(),
	carrier: z.string().optional(),
	tracking_number: z.string().optional(),
	package_condition: z.string().optional(),
	photos: z.array(z.string()).optional(),
	received_by: z.string().optional(),
	received_at: z.string().datetime().optional(),
	notes: z.string().optional()
});

// Schema for updating a receiving item
export const updateReceivingItemSchema = z.object({
	quantity_received: z.number().optional(),
	batch_number: z.string().optional(),
	expiration_date: z.string().datetime().optional(),
	condition: z.string().optional(),
	notes: z.string().optional()
});

// Schema for completing a receiving session
export const completeReceivingSessionSchema = z.object({
	receiving_session_id: z.string(),
	items: z.array(
		z.object({
			product_id: z.string(),
			quantity_received: z.number().min(0),
			unit_cost: z.number().min(0).optional(),
			batch_number: z.string().optional(),
			expiry_date: z.string().datetime().optional(),
			notes: z.string().optional()
		})
	),
	received_date: z.string().datetime().optional(),
	notes: z.string().optional()
});

// Export inferred types
export type ReceivingSession = z.infer<typeof receivingSessionSchema>;
export type ReceivingItem = z.infer<typeof receivingItemSchema>;
export type CreateReceivingSession = z.infer<typeof createReceivingSessionSchema>;
export type CreateReceivingItem = z.infer<typeof createReceivingItemSchema>;
export type UpdateReceivingSession = z.infer<typeof updateReceivingSessionSchema>;
export type UpdateReceivingItem = z.infer<typeof updateReceivingItemSchema>;
export type CompleteReceivingSession = z.infer<typeof completeReceivingSessionSchema>;
