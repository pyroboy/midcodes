import { z } from 'zod';

/**
 * Custom Design Request Schema
 * Defines validation for custom design order requests
 */

// Status enum for custom design requests
export const customDesignStatusSchema = z.enum([
	'pending',
	'in_progress',
	'approved',
	'rejected',
	'completed'
]);

export type CustomDesignStatus = z.infer<typeof customDesignStatusSchema>;

// Input schema for creating a custom design request
export const customDesignRequestInputSchema = z.object({
	size_preset_id: z.string().uuid().nullable(),
	width_pixels: z.number().int().positive(),
	height_pixels: z.number().int().positive(),
	size_name: z.string().min(1).max(100),
	design_instructions: z
		.string()
		.min(10, 'Please provide at least 10 characters of instructions')
		.max(2000, 'Instructions must be less than 2000 characters'),
	reference_assets: z.array(z.string()).max(5, 'Maximum 5 reference images allowed').default([])
});

export type CustomDesignRequestInput = z.infer<typeof customDesignRequestInputSchema>;

// Full custom design request schema (matches database table)
export const customDesignRequestSchema = z.object({
	id: z.string().uuid(),
	created_at: z.string(),
	updated_at: z.string(),
	user_id: z.string().uuid(),
	org_id: z.string().uuid().nullable(),
	size_preset_id: z.string().uuid().nullable(),
	width_pixels: z.number().int().positive(),
	height_pixels: z.number().int().positive(),
	size_name: z.string(),
	design_instructions: z.string(),
	reference_assets: z.array(z.string()),
	status: customDesignStatusSchema,
	admin_notes: z.string().nullable(),
	approved_by: z.string().uuid().nullable(),
	approved_at: z.string().nullable(),
	rejected_reason: z.string().nullable(),
	resulting_template_id: z.string().uuid().nullable()
});

export type CustomDesignRequest = z.infer<typeof customDesignRequestSchema>;

// Admin update schema for approving/rejecting requests
export const customDesignUpdateSchema = z.object({
	id: z.string().uuid(),
	status: customDesignStatusSchema.optional(),
	admin_notes: z.string().max(500).optional(),
	rejected_reason: z.string().max(500).optional(),
	resulting_template_id: z.string().uuid().optional()
});

export type CustomDesignUpdate = z.infer<typeof customDesignUpdateSchema>;

// List query parameters
export const customDesignListParamsSchema = z.object({
	status: customDesignStatusSchema.optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0)
});

export type CustomDesignListParams = z.infer<typeof customDesignListParamsSchema>;
