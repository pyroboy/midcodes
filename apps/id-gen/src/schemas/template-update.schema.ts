import { z } from 'zod';
import { templateElementSchema } from './template-element.schema.js';
import { dpiSchema, pixelDimensionSchema } from './template-creation.schema.js';

// Template update input schema (what user can modify - matches database)
export const templateUpdateInputSchema = z.object({
	name: z
		.string()
		.min(1, 'Template name is required')
		.max(100, 'Template name must be less than 100 characters')
		.trim()
		.optional(),
	width_pixels: pixelDimensionSchema.optional(),
	height_pixels: pixelDimensionSchema.optional(),
	dpi: dpiSchema.optional(),
	orientation: z.enum(['landscape', 'portrait']).optional(),
	template_elements: z.array(templateElementSchema).optional(),
	front_background: z.string().optional(), // Can be URL or path
	back_background: z.string().optional(), // Can be URL or path
	// Legacy fields (existing in database)
	unit_type: z.string().optional(),
	unit_width: z.number().optional(),
	unit_height: z.number().optional()
});

// Complete template update schema (includes system fields)
export const templateUpdateDataSchema = templateUpdateInputSchema.extend({
	id: z.string().uuid(),
	user_id: z.string().uuid(),
	org_id: z.string().uuid(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime().optional()
});

// Template patch schema (partial updates with ID required)
export const templatePatchSchema = z.object({
	id: z.string().uuid(),
	updates: templateUpdateInputSchema.partial()
});

// Template duplication schema
export const templateDuplicateSchema = z.object({
	sourceId: z.string().uuid(),
	name: z
		.string()
		.min(1, 'Template name is required')
		.max(100, 'Template name must be less than 100 characters')
		.trim(),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	user_id: z.string().uuid(),
	org_id: z.string().uuid()
});

// Template publish schema (for sharing templates)
export const templatePublishSchema = z.object({
	id: z.string().uuid(),
	isPublic: z.boolean(),
	publishSettings: z.object({
		allowDuplication: z.boolean().default(true),
		allowModification: z.boolean().default(false),
		category: z.enum(['business', 'education', 'healthcare', 'government', 'other']).optional(),
		tags: z.array(z.string().max(20)).max(10).optional()
	}).optional()
});

// Template archive schema
export const templateArchiveSchema = z.object({
	id: z.string().uuid(),
	archived: z.boolean(),
	archiveReason: z.string().max(200).optional()
});

// Bulk template operations schema
export const templateBulkOperationSchema = z.object({
	templateIds: z.array(z.string().uuid()).min(1, 'At least one template ID is required'),
	operation: z.enum(['archive', 'unarchive', 'delete', 'duplicate']),
	parameters: z.object({
		namePrefix: z.string().max(20).optional(), // For bulk duplicate
		archiveReason: z.string().max(200).optional() // For bulk archive
	}).optional()
});

// Template validation result schema
export const templateValidationSchema = z.object({
	isValid: z.boolean(),
	errors: z.array(z.object({
		field: z.string(),
		message: z.string(),
		code: z.string().optional()
	})),
	warnings: z.array(z.object({
		field: z.string(),
		message: z.string(),
		suggestion: z.string().optional()
	})).optional()
});

// Template import/export schemas
export const templateExportSchema = z.object({
	templateIds: z.array(z.string().uuid()),
	includeAssets: z.boolean().default(false),
	format: z.enum(['json', 'zip']).default('json')
});

export const templateImportSchema = z.object({
	data: z.any(), // JSON data or file reference
	options: z.object({
		overwriteExisting: z.boolean().default(false),
		preserveIds: z.boolean().default(false),
		targetOrgId: z.string().uuid()
	})
});

// Inferred types for export
export type TemplateUpdateInput = z.infer<typeof templateUpdateInputSchema>;
export type TemplateUpdateData = z.infer<typeof templateUpdateDataSchema>;
export type TemplatePatch = z.infer<typeof templatePatchSchema>;
export type TemplateDuplicate = z.infer<typeof templateDuplicateSchema>;
export type TemplatePublish = z.infer<typeof templatePublishSchema>;
export type TemplateArchive = z.infer<typeof templateArchiveSchema>;
export type TemplateBulkOperation = z.infer<typeof templateBulkOperationSchema>;
export type TemplateValidation = z.infer<typeof templateValidationSchema>;
export type TemplateExport = z.infer<typeof templateExportSchema>;
export type TemplateImport = z.infer<typeof templateImportSchema>;