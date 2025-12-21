import { z } from 'zod';

/**
 * Schemas for the Decompose feature.
 * Used for layer decomposition via fal.ai Qwen-Image-Layered model.
 */

// Element types that a layer can be tagged as
export const layerElementTypeSchema = z.enum([
	'graphic', // Static image/logo/pattern
	'text', // Text field placeholder
	'photo', // Photo placeholder (user-uploaded)
	'qr', // QR code area
	'signature', // Signature field
	'unknown' // Not yet classified
]);
export type LayerElementType = z.infer<typeof layerElementTypeSchema>;

// Raw layer from fal.ai API
export const falLayerSchema = z.object({
	url: z.string().url(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	zIndex: z.number().int().min(0)
});
export type FalLayer = z.infer<typeof falLayerSchema>;

// Decomposed layer with client-side enrichment
export const decomposedLayerSchema = z.object({
	id: z.string().uuid(),
	name: z.string(), // Auto-generated: "Layer 1", "Layer 2", etc.
	imageUrl: z.string().url(),
	thumbnailUrl: z.string().optional(), // Local blob URL for preview
	bounds: z
		.object({
			x: z.number().int().min(0),
			y: z.number().int().min(0),
			width: z.number().int().positive(),
			height: z.number().int().positive()
		})
		.optional(), // Computed from non-transparent pixels
	zIndex: z.number().int().min(0),
	suggestedType: layerElementTypeSchema.default('unknown'),
	side: z.enum(['front', 'back']).default('front'),
	parentId: z.string().optional()
});
export type DecomposedLayer = z.infer<typeof decomposedLayerSchema>;

// User selection for converting layer to element
export const layerSelectionSchema = z.object({
	layerId: z.string().uuid(),
	included: z.boolean().default(true),
	elementType: z.enum(['image', 'text', 'photo', 'qr', 'signature']),
	variableName: z
		.string()
		.regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Must start with letter, alphanumeric + underscore only'),
	bounds: z.object({
		x: z.number().int().min(0),
		y: z.number().int().min(0),
		width: z.number().int().positive(),
		height: z.number().int().positive()
	}),
	layerImageUrl: z.string().optional(), // For 'image' type: store layer PNG URL
	side: z.enum(['front', 'back']).default('front') // Which side this layer belongs to
});
export type LayerSelection = z.infer<typeof layerSelectionSchema>;

// Request to decompose an image
export const decomposeRequestSchema = z.object({
	imageUrl: z.string().url(),
	numLayers: z.number().int().min(2).max(10).default(4),
	prompt: z.string().optional(),
	seed: z.number().int().optional()
});
export type DecomposeRequest = z.infer<typeof decomposeRequestSchema>;

// Response from decompose operation
export const decomposeResponseSchema = z.object({
	success: z.boolean(),
	layers: z.array(falLayerSchema),
	seed: z.number().int(),
	prompt: z.string().optional(),
	error: z.string().optional()
});
export type DecomposeResponse = z.infer<typeof decomposeResponseSchema>;

// Save layers request (convert to template elements)
export const saveLayersRequestSchema = z.object({
	templateId: z.string().uuid(),
	layers: z.array(layerSelectionSchema),
	mode: z.enum(['replace', 'append']).default('replace')
});
export type SaveLayersRequest = z.infer<typeof saveLayersRequestSchema>;

// Map layer element type to template element type
export function mapLayerTypeToElementType(
	layerType: LayerElementType
): 'image' | 'text' | 'photo' | 'qr' | 'signature' {
	switch (layerType) {
		case 'graphic':
			return 'image';
		case 'text':
			return 'text';
		case 'photo':
			return 'photo';
		case 'qr':
			return 'qr';
		case 'signature':
			return 'signature';
		case 'unknown':
		default:
			return 'image'; // Default to image for unclassified layers
	}
}
