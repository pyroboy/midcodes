import { z } from 'zod';
import { dpiSchema } from './template-creation.schema.js';

// Display unit types
export const displayUnitSchema = z.enum(['inches', 'mm', 'cm', 'pixels']);

// Pixel dimensions schema (for internal use)
export const pixelDimensionsSchema = z.object({
	width: z.number().int().min(1),
	height: z.number().int().min(1)
});

// Physical dimensions schema (for display)
export const physicalDimensionsSchema = z.object({
	width: z.number().min(0.01),
	height: z.number().min(0.01),
	unit: displayUnitSchema
});

// Dimension conversion request schema
export const dimensionConversionSchema = z.object({
	pixels: pixelDimensionsSchema,
	dpi: dpiSchema,
	targetUnit: displayUnitSchema
});

// Dimension input schema (user can input in any unit)
export const dimensionInputSchema = z.object({
	width: z.number().min(0.01, 'Width must be positive'),
	height: z.number().min(0.01, 'Height must be positive'),
	unit: displayUnitSchema,
	dpi: dpiSchema
});

// Display format options schema
export const displayFormatSchema = z.object({
	showPixels: z.boolean().default(true),
	showPhysical: z.boolean().default(true),
	showDpi: z.boolean().default(true),
	physicalUnit: displayUnitSchema.default('inches'),
	precision: z.number().min(0).max(6).default(2)
});

// Formatted dimension display schema
export const formattedDimensionSchema = z.object({
	pixels: z.string(), // "1013×638px"
	physical: z.string(), // "3.375×2.125\""
	combined: z.string(), // "1013×638px (3.375×2.125\" @ 300 DPI)"
	dpi: z.number()
});

// Size preset schema (with pixel + physical info)
export const sizePresetSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	pixels: pixelDimensionsSchema,
	physical: physicalDimensionsSchema,
	dpi: dpiSchema,
	category: z.enum(['standard', 'business', 'id', 'photo', 'document', 'custom']),
	popular: z.boolean().default(false)
});

// DPI quality level schema
export const dpiQualitySchema = z.object({
	value: dpiSchema,
	label: z.string(),
	description: z.string(),
	category: z.enum(['draft', 'standard', 'high', 'premium']),
	recommended: z.boolean().default(false),
	fileSize: z.enum(['small', 'medium', 'large', 'very-large']),
	useCase: z.array(z.string())
});

// Unit conversion helper schema
export const unitConversionSchema = z.object({
	fromValue: z.number(),
	fromUnit: displayUnitSchema,
	toUnit: displayUnitSchema,
	precision: z.number().min(0).max(6).default(3)
});

// Template dimension summary schema
export const templateDimensionSummarySchema = z.object({
	pixels: pixelDimensionsSchema,
	dpi: dpiSchema,
	physical: z.object({
		inches: physicalDimensionsSchema,
		mm: physicalDimensionsSchema,
		cm: physicalDimensionsSchema
	}),
	aspectRatio: z.string(), // "16:10", "4:3", etc.
	orientation: z.enum(['portrait', 'landscape', 'square']),
	printSize: z.string(), // "Letter", "A4", "Custom", etc.
	approximateFileSize: z.string() // "Small (~1MB)", "Large (~5MB)", etc.
});

// Image upload validation schema
export const imageUploadValidationSchema = z.object({
	file: z.any(), // File object
	expectedDimensions: pixelDimensionsSchema,
	maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB default
	allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
	dpi: dpiSchema.optional()
});

// Dimension validation result schema
export const dimensionValidationSchema = z.object({
	isValid: z.boolean(),
	pixels: pixelDimensionsSchema,
	dpi: dpiSchema,
	warnings: z.array(z.object({
		type: z.enum(['size', 'aspect', 'dpi', 'performance']),
		message: z.string(),
		severity: z.enum(['info', 'warning', 'error'])
	})),
	suggestions: z.array(z.object({
		type: z.enum(['resize', 'dpi', 'format']),
		message: z.string(),
		newDimensions: pixelDimensionsSchema.optional(),
		newDpi: dpiSchema.optional()
	}))
});

// Print specification schema
export const printSpecificationSchema = z.object({
	pixels: pixelDimensionsSchema,
	dpi: dpiSchema,
	physicalSize: physicalDimensionsSchema,
	bleedArea: z.object({
		top: z.number().min(0).default(0),
		right: z.number().min(0).default(0),
		bottom: z.number().min(0).default(0),
		left: z.number().min(0).default(0),
		unit: displayUnitSchema.default('mm')
	}).optional(),
	colorProfile: z.enum(['sRGB', 'CMYK', 'Adobe RGB']).default('sRGB'),
	paperType: z.string().optional(),
	finish: z.enum(['matte', 'glossy', 'satin']).optional()
});

// Inferred types for export
export type DisplayUnit = z.infer<typeof displayUnitSchema>;
export type PixelDimensions = z.infer<typeof pixelDimensionsSchema>;
export type PhysicalDimensions = z.infer<typeof physicalDimensionsSchema>;
export type DimensionConversion = z.infer<typeof dimensionConversionSchema>;
export type DimensionInput = z.infer<typeof dimensionInputSchema>;
export type DisplayFormat = z.infer<typeof displayFormatSchema>;
export type FormattedDimension = z.infer<typeof formattedDimensionSchema>;
export type SizePreset = z.infer<typeof sizePresetSchema>;
export type DpiQuality = z.infer<typeof dpiQualitySchema>;
export type UnitConversion = z.infer<typeof unitConversionSchema>;
export type TemplateDimensionSummary = z.infer<typeof templateDimensionSummarySchema>;
export type ImageUploadValidation = z.infer<typeof imageUploadValidationSchema>;
export type DimensionValidation = z.infer<typeof dimensionValidationSchema>;
export type PrintSpecification = z.infer<typeof printSpecificationSchema>;