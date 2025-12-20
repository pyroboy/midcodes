import { z } from 'zod';

/**
 * Template Assets Schema
 * Defines validation for size presets and detected card regions
 */

// Size preset schema (matches database table)
export const sizePresetSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(50),
	slug: z.string().min(1).max(50),
	width_inches: z.number().positive(),
	height_inches: z.number().positive(),
	width_mm: z.number().positive(),
	height_mm: z.number().positive(),
	width_pixels: z.number().int().positive(),
	height_pixels: z.number().int().positive(),
	dpi: z.number().int().min(72).max(600).default(300),
	aspect_ratio: z.number().positive().optional(),
	description: z.string().nullable().optional(),
	sort_order: z.number().int().default(0),
	is_active: z.boolean().default(true),
	created_at: z.string().optional(),
	updated_at: z.string().optional()
});

export type SizePreset = z.infer<typeof sizePresetSchema>;

// Sample type enum
export const sampleTypeSchema = z.enum(['data_filled', 'blank_template']);
export type SampleType = z.infer<typeof sampleTypeSchema>;

// Orientation enum
export const orientationSchema = z.enum(['landscape', 'portrait']);
export type Orientation = z.infer<typeof orientationSchema>;

// Detected card region from shape detection
export const detectedRegionSchema = z.object({
	id: z.string(),
	x: z.number().int().min(0),
	y: z.number().int().min(0),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	rotation: z.number().min(-15).max(15).default(0),
	confidence: z.number().min(0).max(1),
	orientation: orientationSchema.default('landscape'),
	isManuallyAdjusted: z.boolean().default(false),
	isSelected: z.boolean().default(true)
});

export type DetectedRegion = z.infer<typeof detectedRegionSchema>;

// Detection configuration
export const detectionConfigSchema = z.object({
	targetAspectRatio: z.number().positive(),
	aspectRatioTolerance: z.number().min(0).max(1).default(0.15),
	minCardArea: z.number().int().positive(),
	maxCardArea: z.number().int().positive(),
	edgeThreshold: z.number().int().min(0).max(255).default(50),
	rotationTolerance: z.number().min(0).max(45).default(10)
});

export type DetectionConfig = z.infer<typeof detectionConfigSchema>;

// A4 dimensions at 300 DPI
export const A4_DIMENSIONS = {
	width: 2480, // 8.27" * 300 DPI
	height: 3508, // 11.69" * 300 DPI
	dpi: 300
} as const;

// Wizard step type (now includes 'save' step)
export const wizardStepSchema = z.enum(['size', 'upload', 'detection', 'save']);
export type WizardStep = z.infer<typeof wizardStepSchema>;

// Asset metadata for each detected region
export const assetMetadataSchema = z.object({
	regionId: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	category: z.string().optional(),
	tags: z.array(z.string()).default([])
});

export type AssetMetadata = z.infer<typeof assetMetadataSchema>;

// Template asset (matches database table)
export const templateAssetSchema = z.object({
	id: z.string().uuid(),
	created_at: z.string(),
	updated_at: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	category: z.string().nullable(),
	tags: z.array(z.string()),
	size_preset_id: z.string().uuid().nullable(),
	sample_type: sampleTypeSchema,
	orientation: orientationSchema,
	image_path: z.string(),
	image_url: z.string(),
	width_pixels: z.number().int().positive(),
	height_pixels: z.number().int().positive(),
	is_published: z.boolean(),
	published_at: z.string().nullable(),
	uploaded_by: z.string().uuid().nullable()
});

export type TemplateAsset = z.infer<typeof templateAssetSchema>;

// Wizard state schema
export const wizardStateSchema = z.object({
	currentStep: wizardStepSchema,
	selectedSizePreset: sizePresetSchema.nullable(),
	uploadedImage: z.instanceof(File).nullable(),
	uploadedImageUrl: z.string().nullable(),
	sampleType: sampleTypeSchema.nullable(),
	detectedRegions: z.array(detectedRegionSchema),
	assetMetadata: z.map(z.string(), assetMetadataSchema).default(new Map()),
	isProcessing: z.boolean(),
	error: z.string().nullable()
});

export type WizardState = z.infer<typeof wizardStateSchema>;

/**
 * Generate detection config from a size preset
 */
export function getDetectionConfigForSize(sizePreset: SizePreset): DetectionConfig {
	const aspectRatio = sizePreset.width_pixels / sizePreset.height_pixels;
	const expectedCardArea = sizePreset.width_pixels * sizePreset.height_pixels;

	return {
		targetAspectRatio: aspectRatio,
		aspectRatioTolerance: 0.15,
		minCardArea: Math.floor(expectedCardArea * 0.5),
		maxCardArea: Math.floor(expectedCardArea * 2),
		edgeThreshold: 50,
		rotationTolerance: 10
	};
}

/**
 * Estimate how many cards fit on an A4 page
 */
export function estimateCardsPerA4(sizePreset: SizePreset): {
	columns: number;
	rows: number;
	total: number;
} {
	const marginPx = 50; // ~0.17" margin at 300 DPI
	const gapPx = 30; // ~0.1" gap between cards

	const usableWidth = A4_DIMENSIONS.width - 2 * marginPx;
	const usableHeight = A4_DIMENSIONS.height - 2 * marginPx;

	const cardWidth = sizePreset.width_pixels;
	const cardHeight = sizePreset.height_pixels;

	const columns = Math.floor((usableWidth + gapPx) / (cardWidth + gapPx));
	const rows = Math.floor((usableHeight + gapPx) / (cardHeight + gapPx));

	return { columns, rows, total: columns * rows };
}

/**
 * Asset categories for organization
 */
export const ASSET_CATEGORIES = [
	'Government',
	'Company',
	'School',
	'Medical',
	'Event',
	'Membership',
	'Other'
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
