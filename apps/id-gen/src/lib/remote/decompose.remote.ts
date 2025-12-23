import { command, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import {
	decomposeWithFal,
	isFalConfigured,
	submitDecomposeWithFal,
	submitUpscaleWithFal,
	submitRemoveElement,
	checkFalStatus
} from '$lib/server/fal-layers';
import { editImageWithRunware } from '$lib/server/runware';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { uploadToR2 } from '$lib/server/s3';
import { getDecomposedLayerPath } from '$lib/utils/storagePath';
import { checkAdmin } from '$lib/utils/adminPermissions';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import type { LayerSelection } from '$lib/schemas/decompose.schema';
import type { TemplateElement } from '$lib/schemas/template-element.schema';
import { templateElementSchema } from '$lib/schemas/template-element.schema';
import { adjustUserCredits } from '$lib/remote/billing.remote';
import { CREDIT_COSTS } from '$lib/config/credits';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const decomposeImageSchema = z.object({
	imageUrl: z.string().url('Invalid image URL'),
	numLayers: z.number().int().min(2).max(10).optional().default(4),
	prompt: z.string().optional(),
	negative_prompt: z.string().optional(),
	num_inference_steps: z.number().int().min(1).max(100).optional(),
	guidance_scale: z.number().min(0).max(30).optional(),
	acceleration: z.string().optional(),
	seed: z.number().int().optional(),
	templateId: z.string().uuid().nullable().optional(),
	side: z.enum(['front', 'back']).optional()
});

const upscaleImageSchema = z.object({
	imageUrl: z.string().url('Invalid image URL'),
	model: z
		.enum(['ccsr', 'seedvr', 'aurasr', 'esrgan', 'recraft-creative'])
		.optional()
		.default('ccsr'),
	side: z.enum(['front', 'back']).optional(),
	templateId: z.string().uuid().nullable().optional()
});

const removeElementSchema = z.object({
	imageUrl: z.string().url('Invalid image URL'),
	prompt: z.string().min(1, 'Prompt is required to specify what to remove'),
	imageWidth: z.number().int().positive().optional(),
	imageHeight: z.number().int().positive().optional(),
	side: z.enum(['front', 'back']).optional(),
	templateId: z.string().uuid().nullable().optional()
});

const uploadProcessedImageSchema = z.object({
	imageBase64: z.string().min(1, 'Image data required'),
	mimeType: z.string().optional().default('image/png')
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetch with timeout wrapper for downloading ephemeral URLs
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, { signal: controller.signal });
		return response;
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') {
			throw new Error(`Fetch timed out after ${timeoutMs}ms: ${url}`);
		}
		throw err;
	} finally {
		clearTimeout(timeoutId);
	}
}

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
	historyWarning?: string; // Added: warn if history save failed
};

/**
 * Decompose an image into layers using fal.ai Qwen-Image-Layered.
 * Queues the task and returns a jobId for polling.
 */
export const decomposeImage = command(
	'unchecked',
	async (
		input: z.input<typeof decomposeImageSchema>
	): Promise<{ success: boolean; jobId?: string; error?: string }> => {
		// Validate input
		const parseResult = decomposeImageSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		const {
			imageUrl,
			numLayers,
			prompt,
			negative_prompt,
			num_inference_steps,
			guidance_scale,
			acceleration,
			seed,
			templateId,
			side
		} = parseResult.data;

		const { user, org_id } = await requireAdmin();

		if (!org_id) return { success: false, error: 'Organization context missing' };

		const decomposeCost = CREDIT_COSTS.AI_DECOMPOSE;
		console.log('[decompose.remote] decomposeImage (Async) called for:', {
			imageUrl,
			numLayers,
			templateId
		});

		try {
			// 1. Create a "pending" generation record
			const [generation] = await db
				.insert(schema.aiGenerations)
				.values({
					orgId: org_id,
					userId: user.id,
					provider: 'fal-ai-decompose',
					model: 'Qwen-Image-Layered',
					creditsUsed: decomposeCost,
					prompt: prompt || 'Decompose image',
					status: 'pending',
					metadata: {
						input_image: imageUrl,
						template_id: templateId,
						side: side,
						numLayers: numLayers,
						endpoint: 'fal-ai/qwen-image-layered' // Store endpoint for polling
					}
				})
				.returning();

			// 2. Submit to Fal queue
			const { requestId } = await submitDecomposeWithFal({
				imageUrl,
				numLayers,
				prompt,
				negative_prompt,
				num_inference_steps,
				guidance_scale,
				acceleration,
				seed
			});

			// 3. Update record with external request ID
			await db
				.update(schema.aiGenerations)
				.set({ externalRequestId: requestId })
				.where(eq(schema.aiGenerations.id, generation.id));

			return {
				success: true,
				jobId: generation.id
			};
		} catch (err) {
			console.error('[decompose.remote] decomposeImage error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to queue decomposition'
			};
		}
	}
);

/**
 * Upscale an image and return a jobId for polling.
 */
export const upscaleImagePreview = command(
	'unchecked',
	async (
		input: z.input<typeof upscaleImageSchema>
	): Promise<{ success: boolean; jobId?: string; error?: string }> => {
		const parseResult = upscaleImageSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		const { imageUrl, model, templateId, side } = parseResult.data;
		const { user, org_id } = await requireAdmin();

		if (!org_id) return { success: false, error: 'Organization context missing' };

		console.log('[decompose.remote] upscaleImagePreview (Async) called with:', { imageUrl, model });

		try {
			// 1. Create a "pending" generation record
			const [generation] = await db
				.insert(schema.aiGenerations)
				.values({
					orgId: org_id,
					userId: user.id,
					provider: `fal-ai-upscale-${model}`,
					model: model,
					creditsUsed: CREDIT_COSTS.AI_UPSCALE,
					prompt: `Upscale image (${model})`,
					status: 'pending',
					metadata: {
						input_image: imageUrl,
						template_id: templateId,
						side: side,
						type: 'upscale',
						model: model,
						endpoint: getEndpointForModel(model)
					}
				})
				.returning();

			// 2. Submit to Fal queue
			const { requestId } = await submitUpscaleWithFal(imageUrl, model as any);

			// 3. Update record with external request ID
			await db
				.update(schema.aiGenerations)
				.set({ externalRequestId: requestId })
				.where(eq(schema.aiGenerations.id, generation.id));

			return {
				success: true,
				jobId: generation.id
			};
		} catch (err) {
			console.error('[decompose.remote] upscaleImagePreview error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to queue upscale'
			};
		}
	}
);

function getEndpointForModel(model: string): string {
	switch (model) {
		case 'seedvr':
			return 'fal-ai/seedvr/upscale/image';
		case 'aurasr':
			return 'fal-ai/aura-sr';
		case 'esrgan':
			return 'fal-ai/esrgan';
		case 'recraft-creative':
			return 'fal-ai/recraft/upscale/creative';
		case 'ccsr':
			return 'fal-ai/ccsr';
		default:
			return 'fal-ai/ccsr';
	}
}

/**
 * Upload a processed image (e.g. after removing watermarks) to R2
 * Returns the public URL to be used for upscaling or other operations.
 */
export const uploadProcessedImage = command(
	'unchecked',
	async ({
		imageBase64,
		mimeType = 'image/png'
	}: {
		imageBase64: string;
		mimeType?: string;
	}): Promise<{ success: boolean; url?: string; error?: string }> => {
		const { user } = await requireAdmin();

		try {
			// Convert base64 to buffer
			const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
			const buffer = Buffer.from(base64Data, 'base64');

			const timestamp = Date.now();
			const id = crypto.randomUUID();
			const ext = mimeType.split('/')[1] || 'png';
			const key = `decompose/processed/${user?.id || 'anon'}/${timestamp}_${id}.${ext}`;

			console.log('[decompose.remote] Uploading processed image to:', key);
			const url = await uploadToR2(key, buffer, mimeType);
			console.log('[decompose.remote] Upload success:', url);

			return { success: true, url };
		} catch (err: unknown) {
			console.error('[decompose.remote] uploadProcessedImage error:', err);
			const errorMessage = err instanceof Error ? err.message : 'Upload failed';
			return { success: false, error: errorMessage };
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
				or(
					eq(schema.aiGenerations.provider, 'fal-ai-decompose'),
					eq(schema.aiGenerations.provider, 'fal-ai-upscale')
				)
			),
			orderBy: [desc(schema.aiGenerations.createdAt)],
			limit: 20
		});

		console.log(`[decompose.remote] Fetched ${history.length} history items`);

		return {
			success: true,
			history: history.map((h) => ({
				id: h.id,
				createdAt: h.createdAt,
				inputImageUrl: (h.metadata as any)?.input_image || h.resultUrl, // For upscale, input is in metadata
				layers: (h.metadata as any)?.layers || [],
				creditsUsed: h.creditsUsed,
				side: (h.metadata as any)?.side || 'unknown',
				provider: h.provider, // Add provider to distinguish
				resultUrl: h.resultUrl // Ensure resultUrl is available
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
		mode = 'replace',
		expectedUpdatedAt
	}: {
		templateId: string;
		layers: LayerSelection[];
		mode?: 'replace' | 'append';
		expectedUpdatedAt?: string | null;
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

		// Optimistic locking check
		if (expectedUpdatedAt && template.updatedAt) {
			const currentUpdateISO = template.updatedAt.toISOString();
			if (currentUpdateISO !== expectedUpdatedAt) {
				console.error('[decompose.remote] Optimistic locking failure:', {
					expected: expectedUpdatedAt,
					actual: currentUpdateISO
				});
				throw error(409, 'Template was modified by another user. Please refresh and try again.');
			}
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
						contentMode: 'custom' as const,
						errorCorrectionLevel: 'M' as const
					};
				case 'signature':
					return {
						...baseElement,
						type: 'signature' as const,
						placeholder: 'Signature',
						borderWidth: 1
					};
				case 'graphic':
					return {
						...baseElement,
						type: 'graphic' as const,
						src: layer.layerImageUrl!, // URL of the static graphic
						fit: 'contain' as const,
						maintainAspectRatio: true
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
	'unchecked',
	async (input?: {
		templateId?: string | null;
	}): Promise<{
		success: boolean;
		history: Array<{
			id: string;
			createdAt: Date | null;
			inputImageUrl: string;
			layers: unknown[];
			creditsUsed: number | null;
			side: 'front' | 'back' | 'unknown';
			templateId?: string;
			provider?: string;
			resultUrl?: string;
			status?: string;
			model?: string;
			metadata?: unknown;
		}>;
		stats: HistoryStats;
		error?: string;
	}> => {
		const { org_id } = await requireAdmin();
		const templateId = input?.templateId;

		if (!org_id) {
			return {
				success: false,
				history: [],
				stats: { front: { count: 0, totalLayers: 0 }, back: { count: 0, totalLayers: 0 } },
				error: 'Organization context missing'
			};
		}

		try {
			// Fetch all decompose, upscale, and remove generations for the org
			// Filter by templateId if provided
			const filters = [
				eq(schema.aiGenerations.orgId, org_id),
				or(
					sql`${schema.aiGenerations.provider} LIKE 'fal-ai-%'`,
					eq(schema.aiGenerations.provider, 'runware-remove-element'),
					eq(schema.aiGenerations.provider, 'manual-edit')
				)
			];

			if (templateId) {
				// Strict scoping: Only show generations for this template
				filters.push(sql`${schema.aiGenerations.metadata}->>'template_id' = ${templateId}`);
			} else {
				// Loose assets: Only show generations WITHOUT a template_id
				filters.push(sql`${schema.aiGenerations.metadata}->>'template_id' IS NULL`);
			}

			const history = await db.query.aiGenerations.findMany({
				where: and(...filters),
				orderBy: [desc(schema.aiGenerations.createdAt)],
				limit: 100
			});

			// No need to filter in memory anymore since we filtered in DB
			const filteredHistory = history;

			// Calculate stats per side
			const stats: HistoryStats = {
				front: { count: 0, totalLayers: 0 },
				back: { count: 0, totalLayers: 0 }
			};

			const formattedHistory = filteredHistory.map((h) => {
				const metadata = h.metadata as {
					side?: string;
					layers?: unknown[];
					input_image?: string;
					template_id?: string;
					type?: string;
				} | null;
				const side =
					metadata?.side === 'front' || metadata?.side === 'back' ? metadata.side : 'unknown';
				const layers = metadata?.layers || [];

				// Only count decompose for layer stats (upscales don't have layers)
				if (h.provider === 'fal-ai-decompose') {
					if (side === 'front') {
						stats.front.count++;
						stats.front.totalLayers += Array.isArray(layers) ? layers.length : 0;
					} else if (side === 'back') {
						stats.back.count++;
						stats.back.totalLayers += Array.isArray(layers) ? layers.length : 0;
					}
				}

				return {
					id: h.id,
					createdAt: h.createdAt,
					inputImageUrl: metadata?.input_image || h.resultUrl || '',
					layers: Array.isArray(layers) ? layers : [],
					creditsUsed: h.creditsUsed,
					side: side as 'front' | 'back' | 'unknown',
					templateId: metadata?.template_id,
					provider: h.provider,
					status: h.status,
					model: h.model || undefined,
					metadata: h.metadata || undefined,
					resultUrl: h.resultUrl || undefined
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

/**
 * Remove unwanted elements from an image using Runware AI (prunaai model).
 * Persists to R2 and saves to history.
 */
/**
 * Remove an element from an image and return a jobId for polling.
 */
export const removeElementFromLayer = command(
	'unchecked',
	async (
		input: z.input<typeof removeElementSchema>
	): Promise<{ success: boolean; jobId?: string; error?: string }> => {
		const parseResult = removeElementSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		const { imageUrl, prompt, imageWidth, imageHeight, side, templateId } = parseResult.data;
		const { user, org_id } = await requireAdmin();

		if (!org_id) return { success: false, error: 'Organization context missing' };

		console.log('[decompose.remote] removeElementFromLayer (Async) called with:', {
			imageUrl,
			prompt
		});

		try {
			// 1. Create a "pending" generation record
			const [generation] = await db
				.insert(schema.aiGenerations)
				.values({
					orgId: org_id,
					userId: user.id,
					provider: 'fal-ai-remove',
					model: 'qwen-image-edit',
					creditsUsed: CREDIT_COSTS.AI_REMOVE,
					prompt: prompt,
					status: 'pending',
					metadata: {
						input_image: imageUrl,
						template_id: templateId,
						side: side,
						type: 'remove-element',
						endpoint: 'fal-ai/qwen-image-edit-2509-lora-gallery/remove-element'
					}
				})
				.returning();

			// 2. Submit to Fal queue
			const { requestId } = await submitRemoveElement({
				imageUrl,
				prompt,
				imageWidth,
				imageHeight
			});

			// 3. Update record with external request ID
			await db
				.update(schema.aiGenerations)
				.set({ externalRequestId: requestId })
				.where(eq(schema.aiGenerations.id, generation.id));

			return {
				success: true,
				jobId: generation.id
			};
		} catch (err) {
			console.error('[decompose.remote] removeElementFromLayer error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to queue element removal'
			};
		}
	}
);
/**
 * Check the status of a scheduled AI job.
 */
export const checkJobStatus = query(z.object({ jobId: z.string() }), async ({ jobId }) => {
	const { user, org_id } = await requireAdmin();
	if (!org_id) throw error(500, 'Org context missing');

	try {
		const generation = await db.query.aiGenerations.findFirst({
			where: and(eq(schema.aiGenerations.id, jobId), eq(schema.aiGenerations.orgId, org_id))
		});

		if (!generation) throw error(404, 'Job not found');

		if (generation.status === 'completed') {
			return { status: 'completed', result: generation.metadata };
		}

		if (generation.status === 'failed') {
			return { status: 'failed', error: 'AI generation failed' };
		}

		// If pending, check with Fal
		if (generation.status === 'pending' && generation.externalRequestId) {
			const endpoint = (generation.metadata as any)?.endpoint;
			if (!endpoint) return { status: 'pending' };

			const falStatus = await checkFalStatus(endpoint, generation.externalRequestId);

			if (falStatus.status === 'COMPLETED') {
				// 1. Process and Persist result
				const result = falStatus.result;
				let finalResult: any = {};

				if (generation.provider === 'fal-ai-decompose') {
					// Persist layers
					const images = result.images || result.layers;
					if (!images || !Array.isArray(images)) {
						throw new Error('Decomposition result missing images/layers array');
					}
					const timestamp = Date.now();
					const genId = crypto.randomUUID();
					const templateId = (generation.metadata as any)?.template_id;

					const persistedLayers = await Promise.all(
						images.map(async (layer: any, index: number) => {
							const url = layer.url || layer.imageUrl;
							if (!url) throw new Error(`Layer ${index} missing URL`);

							const response = await fetchWithTimeout(url, 30000);
							const buffer = Buffer.from(await response.arrayBuffer());
							let key = templateId
								? getDecomposedLayerPath(templateId, `${timestamp}_${genId}`, index)
								: `decompose/${user?.id}/${timestamp}_${genId}/layer_${index}.png`;

							const r2Url = await uploadToR2(key, buffer, 'image/png');
							return { ...layer, url: r2Url, imageUrl: r2Url };
						})
					);
					finalResult = { layers: persistedLayers };
				} else if (
					generation.provider.includes('upscale') ||
					generation.provider.includes('remove')
				) {
					// Persist single image
					let tempUrl = '';
					if (result.image && result.image.url) tempUrl = result.image.url;
					else if (result.images && result.images.length > 0) tempUrl = result.images[0].url;

					if (tempUrl) {
						const response = await fetchWithTimeout(tempUrl, 30000);
						const buffer = Buffer.from(await response.arrayBuffer());
						const timestamp = Date.now();
						const type = generation.provider.includes('upscale') ? 'upscaled' : 'removed';
						const key = `decompose/${type}/${user?.id}/${timestamp}_${crypto.randomUUID()}.png`;
						const r2Url = await uploadToR2(key, buffer, 'image/png');
						finalResult = {
							resultUrl: r2Url,
							originalUrl: (generation.metadata as any)?.input_image
						};
					}
				}

				// 2. Update DB
				await db
					.update(schema.aiGenerations)
					.set({
						status: 'completed',
						resultUrl: finalResult.resultUrl || (generation.metadata as any)?.input_image,
						metadata: { ...(generation.metadata as any), ...finalResult }
					})
					.where(eq(schema.aiGenerations.id, jobId));

				return { status: 'completed', result: finalResult };
			}

			if (falStatus.status === 'FAILED') {
				await db
					.update(schema.aiGenerations)
					.set({ status: 'failed' })
					.where(eq(schema.aiGenerations.id, jobId));
				return { status: 'failed', error: falStatus.error || 'AI provider failed' };
			}

			return { status: 'processing' };
		}

		return { status: 'pending' };
	} catch (err) {
		console.error('[decompose.remote] checkJobStatus error:', err);
		return { status: 'failed', error: err instanceof Error ? err.message : 'Status check failed' };
	}
});

/**
 * Save a manually processed item (e.g. crop) to history
 */
export const saveHistoryItem = command(
	'unchecked',
	async (input: {
		originalUrl: string;
		resultUrl: string;
		action: string;
		side?: 'front' | 'back';
		templateId?: string;
	}): Promise<{ success: boolean; error?: string }> => {
		const { user, org_id } = await requireAdmin();

		if (!org_id || !user?.id) {
			return { success: false, error: 'Context missing' };
		}

		try {
			await db.insert(schema.aiGenerations).values({
				orgId: org_id,
				userId: user.id,
				provider: 'manual-edit',
				model: input.action, // e.g., 'crop'
				creditsUsed: 0,
				status: 'completed',
				resultUrl: input.resultUrl,
				metadata: {
					input_image: input.originalUrl,
					side: input.side,
					template_id: input.templateId,
					type: 'manual'
				}
			});

			return { success: true };
		} catch (err: unknown) {
			console.error('[decompose.remote] Failed to save history item:', err);
			const errorMessage = err instanceof Error ? err.message : 'Save failed';
			return { success: false, error: errorMessage };
		}
	}
);
