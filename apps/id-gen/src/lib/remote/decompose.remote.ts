import { command, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { decomposeWithFal, isFalConfigured } from '$lib/server/fal-layers';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { uploadToR2 } from '$lib/server/s3';
import { getDecomposedLayerPath } from '$lib/utils/storagePath';
import { checkAdmin } from '$lib/utils/adminPermissions';
import { eq, desc, and } from 'drizzle-orm';
import type { LayerSelection } from '$lib/schemas/decompose.schema';
import type { TemplateElement } from '$lib/schemas/template-element.schema';
import { templateElementSchema } from '$lib/schemas/template-element.schema';
import { CREDIT_COSTS } from '$lib/config/credits';

// Helper to check for admin access
async function requireAdmin() {
	const event = getRequestEvent();
	console.log('[decompose.remote] requireAdmin - event:', !!event);
	console.log('[decompose.remote] requireAdmin - locals:', !!event?.locals);
	console.log('[decompose.remote] requireAdmin - user:', event?.locals?.user?.email);
	console.log('[decompose.remote] requireAdmin - role:', event?.locals?.user?.role);

	const { locals } = event;
	const hasAdminAccess = checkAdmin(locals);

	console.log('[decompose.remote] requireAdmin - hasAdminAccess:', hasAdminAccess);

	if (!locals.user || !hasAdminAccess) {
		console.error('[decompose.remote] Admin access denied for role:', locals.user?.role);
		throw error(403, 'Admin access required');
	}
	return { locals, user: locals.user, org_id: locals.org_id };
}

/**
 * Check if fal.ai decomposition is available.
 */
export const checkDecomposeAvailable = command(
	'unchecked',
	async (): Promise<{ available: boolean; mock: boolean }> => {
		await requireAdmin();
		const configured = isFalConfigured();
		return {
			available: true, // Always available (mock mode if not configured)
			mock: !configured
		};
	}
);

export interface DecomposedLayer {
	url: string;
	width: number;
	height: number;
	zIndex: number;
	imageUrl: string; // Helper for R2 url or fal url
}

export type DecomposeResponse = {
	success: boolean;
	layers?: DecomposedLayer[];
	error?: string;
	timings?: any;
	seed?: number;
};

/**
 * Decompose an image into layers using fal.ai Qwen-Image-Layered.
 * Persists results to R2 and database.
 */
export const decomposeImage = command(
	'unchecked',
	async ({
		imageUrl,
		numLayers = 4,
		prompt,
		negative_prompt,
		num_inference_steps,
		guidance_scale,
		acceleration,
		seed,
		templateId,
		side,
		upscale
	}: {
		imageUrl: string;
		numLayers?: number;
		prompt?: string;
		negative_prompt?: string;
		num_inference_steps?: number;
		guidance_scale?: number;
		acceleration?: string;
		seed?: number;
		templateId?: string | null;
		side?: 'front' | 'back';
		upscale?: boolean;
	}): Promise<DecomposeResponse> => {
		console.log('[decompose.remote] decomposeImage called with:', {
			imageUrl,
			numLayers,
			templateId,
			side,
			upscale
		});
		const { user, org_id } = await requireAdmin();
		console.log('[decompose.remote] Admin check passed, calling decomposeWithFal...');

		try {
			let inputUrl = imageUrl;

			// 1. Optional Upscale
			if (upscale) {
				const { upscaleImage } = await import('$lib/server/fal-layers');
				try {
					console.log('[decompose.remote] Upscaling image before decomposition...');
					inputUrl = await upscaleImage(imageUrl);
					console.log('[decompose.remote] Image upscaled to:', inputUrl);
				} catch (upscaleErr) {
					console.error('[decompose.remote] Upscale failed, falling back to original image:', upscaleErr);
					// Fallback to original image or throw? 
					// Let's fallback to original for robustness, but maybe logging is enough.
				}
			}

			// 2. Call AI Service
			const result = await decomposeWithFal({
				imageUrl: inputUrl,
				numLayers,
				prompt,
				negative_prompt,
				num_inference_steps,
				guidance_scale,
				acceleration,
				seed
			});

			if (!result.success || !result.layers) {
				return {
					success: result.success,
					error: result.error,
					layers: [],
					seed: result.seed
				};
			}

			// 2. Persist Layers to R2
			const timestamp = Date.now();
			const generationId = crypto.randomUUID();

			const persistedLayers = await Promise.all(
				result.layers.map(async (layer: any, index: number) => {
					try {
						// Download from ephemeral URL
						const response = await fetch(layer.url);
						const arrayBuffer = await response.arrayBuffer();
						const buffer = Buffer.from(arrayBuffer);

						// Upload to R2
						let key: string;
						if (templateId) {
							key = getDecomposedLayerPath(templateId, `${timestamp}_${generationId}`, index);
						} else {
							// Fallback if no templateId provided (e.g. standalone tool)
							key = `decompose/${user?.id}/${timestamp}_${generationId}/layer_${index}.png`;
						}

						const r2Url = await uploadToR2(key, buffer, 'image/png');

						return {
							...layer,
							imageUrl: r2Url, // Normalize to imageUrl for frontend consistency
							url: r2Url
						};
					} catch (uploadErr) {
						console.error(`[decompose.remote] Failed to persist layer ${index}:`, uploadErr);
						return layer;
					}
				})
			);

			// 3. Save to Database History with actual credit cost
			const creditsUsed = CREDIT_COSTS.AI_DECOMPOSE;
			if (org_id && user?.id) {
				try {
					await db.insert(schema.aiGenerations).values({
						orgId: org_id,
						userId: user.id,
						provider: 'fal-ai-decompose',
						model: 'Qwen-Image-Layered',
						creditsUsed: creditsUsed,
						prompt: prompt || 'Decompose image',
						resultUrl: imageUrl,
						metadata: {
							layers: persistedLayers,
							seed: result.seed,
							input_image: imageUrl,
							template_id: templateId,
							side: side // Store side information
						}
					});
				} catch (dbErr) {
					console.error('[decompose.remote] Failed to save generation history:', dbErr);
				}
			}

			console.log(
				'[decompose.remote] decomposeWithFal result persisted:',
				true,
				persistedLayers.length,
				'layers'
			);

			return {
				...result,
				layers: persistedLayers
			};
		} catch (err) {
			console.error('[decompose.remote] decomposeWithFal error:', err);
			throw err;
		}
	}
);

/**
 * Get decomposition history for the current user/org
 */
export const getDecomposeHistory = query(async () => {
	const { user, org_id } = await requireAdmin();

	if (!org_id) return { success: false, history: [], error: 'Organization context missing' };

	try {
		const history = await db.query.aiGenerations.findMany({
			where: and(
				eq(schema.aiGenerations.orgId, org_id),
				eq(schema.aiGenerations.provider, 'fal-ai-decompose')
			),
			orderBy: [desc(schema.aiGenerations.createdAt)],
			limit: 20
		});

		return {
			success: true,
			history: history.map((h) => ({
				id: h.id,
				createdAt: h.createdAt,
				inputImageUrl: (h.metadata as any)?.input_image || h.resultUrl,
				layers: (h.metadata as any)?.layers || [],
				creditsUsed: h.creditsUsed,
				side: (h.metadata as any)?.side || 'unknown'
			}))
		};
	} catch (err) {
		console.error('[decompose.remote] Failed to fetch history:', err);
		return { success: false, history: [], error: 'Failed to fetch history' };
	}
});

/**
 * Save decomposed layers as template elements.
 */
export const saveLayers = command(
	'unchecked',
	async ({
		templateId,
		layers,
		mode = 'replace'
	}: {
		templateId: string;
		layers: LayerSelection[];
		mode?: 'replace' | 'append';
	}): Promise<{ success: boolean; elementCount: number; message: string }> => {
		const { user, org_id } = await requireAdmin();

		if (!org_id) throw error(500, 'Organization context missing');

		// Fetch the template
		const template = await db.query.templates.findFirst({
			where: eq(schema.templates.id, templateId)
		});

		if (!template) {
			throw error(404, 'Template not found');
		}

		// Verify org access
		if (template.orgId !== org_id) {
			throw error(403, 'Access denied to this template');
		}

		// Filter included layers and validate before converting
		const includedLayers = layers.filter((l) => l.included);
		const validationErrors: string[] = [];

		// Validate image elements have valid URLs before processing
		for (const layer of includedLayers) {
			if (
				layer.elementType === 'image' &&
				(!layer.layerImageUrl || layer.layerImageUrl.trim() === '')
			) {
				validationErrors.push(`Image element "${layer.variableName}" requires a valid image URL`);
			}
		}

		if (validationErrors.length > 0) {
			throw error(400, `Validation failed:\n${validationErrors.join('\n')}`);
		}

		// Convert to template elements with correct side
		const newElements: TemplateElement[] = includedLayers.map((layer) => {
			const baseElement = {
				id: crypto.randomUUID(),
				variableName: layer.variableName,
				x: layer.bounds.x,
				y: layer.bounds.y,
				width: layer.bounds.width,
				height: layer.bounds.height,
				rotation: 0,
				side: layer.side || 'front', // Use layer's side instead of hardcoded 'front'
				visible: true,
				opacity: 1
			};

			switch (layer.elementType) {
				case 'image':
					return {
						...baseElement,
						type: 'image' as const,
						src: layer.layerImageUrl!, // Already validated above
						fit: 'contain' as const
					};
				case 'text':
					return {
						...baseElement,
						type: 'text' as const,
						content: '',
						fontSize: 14,
						fontFamily: 'Roboto',
						fontWeight: 'normal' as const,
						fontStyle: 'normal' as const,
						color: '#000000',
						textAlign: 'left' as const
					};
				case 'photo':
					return {
						...baseElement,
						type: 'photo' as const,
						placeholder: 'Photo',
						aspectRatio: 'free' as const
					};
				case 'qr':
					return {
						...baseElement,
						type: 'qr' as const,
						content: '',
						errorCorrectionLevel: 'M' as const
					};
				case 'signature':
					return {
						...baseElement,
						type: 'signature' as const,
						placeholder: 'Signature',
						borderWidth: 1
					};
				default:
					return {
						...baseElement,
						type: 'image' as const,
						src: layer.layerImageUrl || '',
						fit: 'contain' as const
					};
			}
		});

		// Validate each element against schema before saving
		const validatedElements: TemplateElement[] = [];
		for (const element of newElements) {
			const result = templateElementSchema.safeParse(element);
			if (result.success) {
				validatedElements.push(result.data as TemplateElement);
			} else {
				validationErrors.push(
					`Element "${element.variableName}": ${result.error.issues.map((e) => e.message).join(', ')}`
				);
			}
		}

		if (validationErrors.length > 0) {
			throw error(400, `Element validation failed:\n${validationErrors.join('\n')}`);
		}

		// Determine final elements based on mode
		const existingElements = (template.templateElements as TemplateElement[]) || [];
		const finalElements =
			mode === 'replace' ? validatedElements : [...existingElements, ...validatedElements];

		// Update the template
		await db
			.update(schema.templates)
			.set({
				templateElements: finalElements,
				updatedAt: new Date()
			})
			.where(eq(schema.templates.id, templateId));

		return {
			success: true,
			elementCount: validatedElements.length,
			message: `${validatedElements.length} elements ${mode === 'replace' ? 'replaced' : 'added'} successfully`
		};
	}
);

/**
 * History stats per side for UI display
 */
export interface HistoryStats {
	front: { count: number; totalLayers: number };
	back: { count: number; totalLayers: number };
}

/**
 * Get decomposition history with stats per side.
 */
export const getDecomposeHistoryWithStats = query(
	async (): Promise<{
		success: boolean;
		history: Array<{
			id: string;
			createdAt: Date | null;
			inputImageUrl: string;
			layers: unknown[];
			creditsUsed: number | null;
			side: 'front' | 'back' | 'unknown';
			templateId?: string;
		}>;
		stats: HistoryStats;
		error?: string;
	}> => {
		const { org_id } = await requireAdmin();

		if (!org_id) {
			return {
				success: false,
				history: [],
				stats: { front: { count: 0, totalLayers: 0 }, back: { count: 0, totalLayers: 0 } },
				error: 'Organization context missing'
			};
		}

		try {
			const history = await db.query.aiGenerations.findMany({
				where: and(
					eq(schema.aiGenerations.orgId, org_id),
					eq(schema.aiGenerations.provider, 'fal-ai-decompose')
				),
				orderBy: [desc(schema.aiGenerations.createdAt)],
				limit: 50
			});

			// Calculate stats per side
			const stats: HistoryStats = {
				front: { count: 0, totalLayers: 0 },
				back: { count: 0, totalLayers: 0 }
			};

			const formattedHistory = history.map((h) => {
				const metadata = h.metadata as {
					side?: string;
					layers?: unknown[];
					input_image?: string;
					template_id?: string;
				} | null;
				const side =
					metadata?.side === 'front' || metadata?.side === 'back' ? metadata.side : 'unknown';
				const layers = metadata?.layers || [];

				if (side === 'front') {
					stats.front.count++;
					stats.front.totalLayers += Array.isArray(layers) ? layers.length : 0;
				} else if (side === 'back') {
					stats.back.count++;
					stats.back.totalLayers += Array.isArray(layers) ? layers.length : 0;
				}

				return {
					id: h.id,
					createdAt: h.createdAt,
					inputImageUrl: metadata?.input_image || h.resultUrl || '',
					layers: Array.isArray(layers) ? layers : [],
					creditsUsed: h.creditsUsed,
					side: side as 'front' | 'back' | 'unknown',
					templateId: metadata?.template_id
				};
			});

			return {
				success: true,
				history: formattedHistory,
				stats
			};
		} catch (err) {
			console.error('[decompose.remote] Failed to fetch history with stats:', err);
			return {
				success: false,
				history: [],
				stats: { front: { count: 0, totalLayers: 0 }, back: { count: 0, totalLayers: 0 } },
				error: 'Failed to fetch history'
			};
		}
	}
);
