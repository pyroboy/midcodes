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
	return { locals, user: locals.user, org_id: locals.user.orgId };
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
		seed,
		templateId
	}: {
		imageUrl: string;
		numLayers?: number;
		prompt?: string;
		seed?: number;
		templateId?: string | null;
	}): Promise<DecomposeResponse> => {
		console.log('[decompose.remote] decomposeImage called with:', { imageUrl, numLayers, templateId });
		const { user, org_id } = await requireAdmin();
		console.log('[decompose.remote] Admin check passed, calling decomposeWithFal...');

		try {
			// 1. Call AI Service
			const result = await decomposeWithFal({
				imageUrl,
				numLayers,
				prompt,
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

			// 3. Save to Database History
			if (org_id && user?.id) {
				try {
					const creditsUsed = 0; 
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
							template_id: templateId // Store in metadata at minimum
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
    
    if (!org_id) return [];

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
			history: history.map(h => ({
				id: h.id,
				createdAt: h.createdAt,
				inputImageUrl: (h.metadata as any)?.input_image || h.resultUrl,
				layers: (h.metadata as any)?.layers || [],
				creditsUsed: h.creditsUsed
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

		// Filter included layers and convert to template elements
		const includedLayers = layers.filter((l) => l.included);
		const newElements: TemplateElement[] = includedLayers.map((layer) => {
			const baseElement = {
				id: crypto.randomUUID(),
				variableName: layer.variableName,
				x: layer.bounds.x,
				y: layer.bounds.y,
				width: layer.bounds.width,
				height: layer.bounds.height,
				rotation: 0,
				side: 'front' as const,
				visible: true,
				opacity: 1
			};

			switch (layer.elementType) {
				case 'image':
					return {
						...baseElement,
						type: 'image' as const,
						src: layer.layerImageUrl || '',
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

		// Determine final elements based on mode
		const existingElements = (template.templateElements as TemplateElement[]) || [];
		const finalElements = mode === 'replace' ? newElements : [...existingElements, ...newElements];

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
			elementCount: newElements.length,
			message: `${newElements.length} elements ${mode === 'replace' ? 'replaced' : 'added'} successfully`
		};
	}
);
