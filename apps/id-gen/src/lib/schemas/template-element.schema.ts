import { z } from 'zod';

// Element type enumeration
export const elementTypeSchema = z.enum(['text', 'image', 'qr', 'photo', 'signature', 'selection']);

// Position and dimension schemas (always in pixels)
export const positionSchema = z.number().min(0, 'Position cannot be negative');

export const dimensionSchema = z.number().min(1, 'Dimension must be at least 1 pixel');

// Typography schemas
export const fontSizeSchema = z
	.number()
	.min(1, 'Font size must be at least 1')
	.max(200, 'Font size cannot exceed 200');

export const fontFamilySchema = z.string().min(1, 'Font family is required').default('Arial');

export const fontWeightSchema = z
	.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
	.default('normal');

export const fontStyleSchema = z.enum(['normal', 'italic', 'oblique']).default('normal');

export const textDecorationSchema = z.enum(['none', 'underline', 'line-through']).default('none');

export const textTransformSchema = z
	.enum(['none', 'uppercase', 'lowercase', 'capitalize'])
	.default('none');

export const textAlignmentSchema = z.enum(['left', 'center', 'right', 'justify']).default('left');

// Color schema (hex, rgb, rgba, named colors)
export const colorSchema = z
	.string()
	.regex(
		/^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\(.*\)|rgba\(.*\)|[a-zA-Z]+)$/,
		'Color must be a valid hex, rgb, rgba, or named color'
	)
	.default('#000000');

// Opacity schema
export const opacitySchema = z
	.number()
	.min(0, 'Opacity cannot be less than 0')
	.max(1, 'Opacity cannot be greater than 1')
	.default(1);

// Side schema
export const sideSchema = z.enum(['front', 'back']);

// Variable name schema
export const variableNameSchema = z
	.string()
	.min(1, 'Variable name is required')
	.max(50, 'Variable name cannot exceed 50 characters')
	.regex(
		/^[a-zA-Z][a-zA-Z0-9_]*$/,
		'Variable name must start with a letter and contain only letters, numbers, and underscores'
	);

// Base template element schema
export const baseTemplateElementSchema = z.object({
	id: z.string().uuid(),
	type: elementTypeSchema,
	x: positionSchema,
	y: positionSchema,
	width: dimensionSchema,
	height: dimensionSchema,
	side: sideSchema,
	variableName: variableNameSchema,
	visible: z.boolean().default(true),
	opacity: opacitySchema
});

// Text element specific schema
export const textElementSchema = baseTemplateElementSchema.extend({
	type: z.literal('text'),
	content: z.string().optional(),
	fontSize: fontSizeSchema.optional(),
	fontFamily: fontFamilySchema.optional(),
	fontWeight: fontWeightSchema.optional(),
	fontStyle: fontStyleSchema.optional(),
	color: colorSchema.optional(),
	textDecoration: textDecorationSchema.optional(),
	textTransform: textTransformSchema.optional(),
	textAlign: textAlignmentSchema.optional(),
	letterSpacing: z.number().optional(),
	lineHeight: z.union([z.number().positive(), z.string()]).optional()
});

// Image element specific schema
export const imageElementSchema = baseTemplateElementSchema.extend({
	type: z.literal('image'),
	src: z.string().url('Image source must be a valid URL').optional(),
	alt: z.string().max(200, 'Alt text cannot exceed 200 characters').optional(),
	fit: z.enum(['cover', 'contain', 'fill', 'scale-down', 'none']).default('cover'),
	borderRadius: z.number().min(0).optional()
});

// QR code element specific schema
export const qrElementSchema = baseTemplateElementSchema.extend({
	type: z.literal('qr'),
	content: z.string().optional(),
	errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
	backgroundColor: colorSchema.optional(),
	foregroundColor: colorSchema.optional()
});

// Photo element specific schema (user uploaded photo)
export const photoElementSchema = baseTemplateElementSchema.extend({
	type: z.literal('photo'),
	placeholder: z.string().max(100).default('Photo'),
	aspectRatio: z.enum(['square', 'portrait', 'landscape', 'free']).default('free'),
	borderRadius: z.number().min(0).optional()
});

// Signature element specific schema
export const signatureElementSchema = baseTemplateElementSchema.extend({
	type: z.literal('signature'),
	placeholder: z.string().max(100).default('Signature'),
	backgroundColor: colorSchema.optional(),
	borderColor: colorSchema.optional(),
	borderWidth: z.number().min(0).default(1)
});

// Selection element specific schema (dropdown/radio)
export const selectionElementSchema = baseTemplateElementSchema.extend({
	type: z.literal('selection'),
	options: z.array(z.string()).min(1, 'Selection must have at least one option'),
	defaultValue: z.string().optional(),
	multiple: z.boolean().default(false),
	fontSize: fontSizeSchema.optional(),
	fontFamily: fontFamilySchema.optional(),
	color: colorSchema.optional()
});

// Union schema for all element types
export const templateElementSchema = z.discriminatedUnion('type', [
	textElementSchema,
	imageElementSchema,
	qrElementSchema,
	photoElementSchema,
	signatureElementSchema,
	selectionElementSchema
]);

// Element creation input (before ID assignment)
// Base for input (omits id)
const baseInputElementSchema = baseTemplateElementSchema.omit({ id: true });

// Create input versions of each element schema
const textInputElementSchema = baseInputElementSchema.extend(textElementSchema.shape);
const imageInputElementSchema = baseInputElementSchema.extend(imageElementSchema.shape);
const qrInputElementSchema = baseInputElementSchema.extend(qrElementSchema.shape);
const photoInputElementSchema = baseInputElementSchema.extend(photoElementSchema.shape);
const signatureInputElementSchema = baseInputElementSchema.extend(signatureElementSchema.shape);
const selectionInputElementSchema = baseInputElementSchema.extend(selectionElementSchema.shape);

// Element creation input (before ID assignment)
export const templateElementInputSchema = z.discriminatedUnion('type', [
	textInputElementSchema,
	imageInputElementSchema,
	qrInputElementSchema,
	photoInputElementSchema,
	signatureInputElementSchema,
	selectionInputElementSchema
]);

// Element update schema (partial updates allowed)
// Create partial versions of each element schema for updates
const partialTextElementSchema = textElementSchema.partial();
const partialImageElementSchema = imageElementSchema.partial();
const partialQrElementSchema = qrElementSchema.partial();
const partialPhotoElementSchema = photoElementSchema.partial();
const partialSignatureElementSchema = signatureElementSchema.partial();
const partialSelectionElementSchema = selectionElementSchema.partial();

export const templateElementUpdateSchema = z
	.discriminatedUnion('type', [
		partialTextElementSchema,
		partialImageElementSchema,
		partialQrElementSchema,
		partialPhotoElementSchema,
		partialSignatureElementSchema,
		partialSelectionElementSchema
	])
	.and(z.object({ id: z.string().uuid() }));

// Inferred types for export
export type ElementType = z.infer<typeof elementTypeSchema>;
export type TemplateElement = z.infer<typeof templateElementSchema>;
export type TemplateElementInput = z.infer<typeof templateElementInputSchema>;
export type TemplateElementUpdate = z.infer<typeof templateElementUpdateSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type QrElement = z.infer<typeof qrElementSchema>;
export type PhotoElement = z.infer<typeof photoElementSchema>;
export type SignatureElement = z.infer<typeof signatureElementSchema>;
export type SelectionElement = z.infer<typeof selectionElementSchema>;
