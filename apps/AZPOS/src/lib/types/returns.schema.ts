import { z } from 'zod';

// Schema for return item (for input)
export const returnItemInputSchema = z.object({
	product_id: z.string().uuid(),
	quantity: z.number().min(1),
	unit_price: z.number().min(0),
	notes: z.string().optional()
});

// Schema for return item (from database)
export const returnItemSchema = z.object({
	id: z.string().uuid(),
	return_id: z.string().uuid(),
	product_id: z.string().uuid(),
	quantity: z.number().min(1),
	unit_price: z.number().min(0),
	refund_amount: z.number(),
	condition: z.string().optional(),
	notes: z.string().optional(),
	created_at: z.string().datetime()
});

// Schema for creating a new return (input)
export const newReturnSchema = z.object({
	return_number: z.string().min(1),
	customer_name: z.string().min(1),
	customer_email: z.string().email().optional(),
	customer_phone: z.string().optional(),
	items: z.array(returnItemInputSchema).min(1),
	reason: z.enum(['damaged', 'defective', 'wrong_item', 'expired', 'customer_request', 'other']),
	description: z.string().optional(),
	notes: z.string().optional()
});

// Schema for updating return status
export const updateReturnStatusSchema = z.object({
	return_id: z.string(),
	status: z.enum(['pending', 'approved', 'rejected', 'processed']),
	admin_notes: z.string().optional()
});

// Full return record schema (from database)
export const enhancedReturnSchema = z.object({
	id: z.string().uuid(),
	return_number: z.string(),
	customer_name: z.string(),
	customer_email: z.string().optional(),
	customer_phone: z.string().optional(),
	status: z.enum(['pending', 'approved', 'rejected', 'processed']),
	reason: z.enum(['damaged', 'defective', 'wrong_item', 'expired', 'customer_request', 'other']),
	description: z.string().optional(),
	total_refund_amount: z.number(),
	notes: z.string().optional(),
	admin_notes: z.string().optional(),
	processed_by: z.string().uuid().optional(), // Admin user ID who processed the return
	processed_at: z.string().datetime().optional(),
	user_id: z.string().uuid().optional(), // For RBAC
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
	items: z.array(returnItemSchema).optional() // Add items property
});

// Schema for return filters/queries
export const returnFiltersSchema = z.object({
	status: z.enum(['all', 'pending', 'approved', 'rejected', 'processed']).optional(),
	reason: z
		.enum(['all', 'damaged', 'defective', 'wrong_item', 'expired', 'customer_request', 'other'])
		.optional(),
	date_from: z.string().datetime().optional(),
	date_to: z.string().datetime().optional(),
	customer_name: z.string().optional(),
	return_number: z.string().optional()
});

// Schema for return statistics
export const returnStatsSchema = z.object({
	total_returns: z.number(),
	pending_count: z.number(),
	approved_count: z.number(),
	rejected_count: z.number(),
	completed_count: z.number(),
	processing_count: z.number(),
	total_value: z.number(),
	avg_processing_time: z.number().optional() // in hours
});

// Export inferred types
export type ReturnItem = z.infer<typeof returnItemSchema>;
export type NewReturnInput = z.infer<typeof newReturnSchema>;
export type UpdateReturnStatusInput = z.infer<typeof updateReturnStatusSchema>;
export type EnhancedReturnRecord = z.infer<typeof enhancedReturnSchema>;
export type ReturnFilters = z.infer<typeof returnFiltersSchema>;
export type ReturnStats = z.infer<typeof returnStatsSchema>;
