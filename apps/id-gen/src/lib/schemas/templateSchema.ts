import { z } from 'zod';

export const templateCreationSchema = z.object({
	name: z
		.string()
		.min(1, 'Template name is required')
		.max(100, 'Template name must be less than 100 characters')
		.trim(),
	description: z.string().max(500, 'Description must be less than 500 characters').optional(),
	cardSize: z.object({
		name: z.string().min(1, 'Card size name is required'),
		widthInches: z
			.number()
			.min(1, 'Width must be at least 1 inch')
			.max(12, 'Width cannot exceed 12 inches'),
		heightInches: z
			.number()
			.min(1, 'Height must be at least 1 inch')
			.max(12, 'Height cannot exceed 12 inches'),
		description: z.string().optional()
	}),
	dpi: z.number().min(72, 'DPI must be at least 72').max(600, 'DPI cannot exceed 600').default(300)
});

export const templateElementSchema = z.object({
	id: z.string(),
	type: z.enum(['text', 'image', 'qr', 'photo', 'signature', 'selection']),
	x: z.number().min(0),
	y: z.number().min(0),
	width: z.number().min(1),
	height: z.number().min(1),
	content: z.string().optional(),
	variableName: z.string().min(1, 'Variable name is required'),
	fontSize: z.number().positive().optional(),
	fontFamily: z.string().optional(),
	fontWeight: z.string().optional(),
	fontStyle: z.enum(['normal', 'italic', 'oblique']).optional(),
	color: z.string().optional(),
	textDecoration: z.enum(['none', 'underline']).optional(),
	textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
	opacity: z.number().min(0).max(1).optional(),
	visible: z.boolean().optional(),
	font: z.string().optional(),
	size: z.number().positive().optional(),
	alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
	options: z.array(z.string()).optional(),
	side: z.enum(['front', 'back']),
	letterSpacing: z.number().optional(),
	lineHeight: z.union([z.number(), z.string()]).optional()
});

export const templateUpdateSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string(),
	name: z
		.string()
		.min(1, 'Template name is required')
		.max(100, 'Template name must be less than 100 characters')
		.trim(),
	description: z.string().optional(),
	org_id: z.string(),
	front_background: z.string().url('Front background must be a valid URL'),
	back_background: z.string().url('Back background must be a valid URL'),
	front_background_url: z.string().url().optional(),
	back_background_url: z.string().url().optional(),
	orientation: z.enum(['landscape', 'portrait']),
	template_elements: z.array(templateElementSchema),
	created_at: z.string(),
	updated_at: z.string().optional(),
	// New fields for flexible sizing
	width_inches: z
		.number()
		.min(1, 'Width must be at least 1 inch')
		.max(12, 'Width cannot exceed 12 inches'),
	height_inches: z
		.number()
		.min(1, 'Height must be at least 1 inch')
		.max(12, 'Height cannot exceed 12 inches'),
	dpi: z.number().min(72, 'DPI must be at least 72').max(600, 'DPI cannot exceed 600').default(300)
});

export const imageUploadSchema = z.object({
	file: z.instanceof(File, { message: 'Must be a valid file' }),
	side: z.enum(['front', 'back']),
	expectedWidth: z.number().positive(),
	expectedHeight: z.number().positive()
});

export type TemplateCreationData = z.infer<typeof templateCreationSchema>;
export type TemplateElementData = z.infer<typeof templateElementSchema>;
export type TemplateUpdateData = z.infer<typeof templateUpdateSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>;
