import { command, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { decomposeWithFal, isFalConfigured } from '$lib/server/fal-layers';
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
 * Persists results to R2 and database.
 */
export const decomposeImage = command(
	'unchecked',
	async (input: z.input<typeof decomposeImageSchema>): Promise<DecomposeResponse> => {
		// Validate input
		const parseResult = decomposeImageSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`,
				layers: []
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

		console.log('[decompose.remote] decomposeImage called with:', {
			imageUrl,
			numLayers,
			templateId,
			side
		});
		const { user, org_id } = await requireAdmin();

		// Check credits first
		const decomposeCost = CREDIT_COSTS.AI_DECOMPOSE;
		/* BYPASS CREDIT CHECK
		// Refresh user data to get latest credits
		const userProfile = await db.query.profiles.findFirst({
			where: eq(schema.profiles.id, user.id),
			columns: { creditsBalance: true }
		});

		if (!userProfile || (userProfile.creditsBalance || 0) < decomposeCost) {
			return {
				success: false,
				error: `Insufficient credits. Required: ${decomposeCost}, Available: ${userProfile?.creditsBalance || 0}`,
				layers: []
			};
		}
		*/
		console.log('[decompose.remote] Credit check bypassed for Decompose');

		console.log('[decompose.remote] Admin check passed, calling decomposeWithFal...');

		let historyWarning: string | undefined;

		try {
			// Call AI Service with the provided imageUrl
			// (if upscaled, the upscaled URL should already be passed here)
			const result = await decomposeWithFal({
				imageUrl,
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

			// Apply credit deduction after successful AI generation
			/* BYPASS CREDIT DEDUCTION
			try {
				await adjustUserCredits({
					userId: user.id,
					delta: -decomposeCost,
					reason: `AI Decompose (${numLayers} layers)`
				});
				console.log('[decompose.remote] Credits deducted:', decomposeCost);
			} catch (creditErr) {
				console.error('[decompose.remote] Failed to deduct credits:', creditErr);
				// Continue, but log this critical failure
				historyWarning = (historyWarning || '') + ' Network issue updating credits. ';
			}
			*/
			console.log('[decompose.remote] Credit deduction bypassed for Decompose');

			// 2. Persist Layers to R2 with timeout for ephemeral URL downloads
			const timestamp = Date.now();
			const generationId = crypto.randomUUID();

			const persistedLayers = await Promise.all(
				result.layers.map(async (layer: any, index: number) => {
					let lastError: any;
					// Retry loop for R2 upload
					for (let attempt = 0; attempt < 3; attempt++) {
						try {
							// Download from ephemeral URL with timeout (30s)
							const response = await fetchWithTimeout(layer.url, 30000);
							if (!response.ok) {
								throw new Error(
									`Failed to download layer from AI provider: ${response.status} ${response.statusText}`
								);
							}
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
						} catch (uploadErr: any) {
							console.warn(
								`[decompose.remote] Attempt ${attempt + 1}/3 failed to persist layer ${index}:`,
								uploadErr
							);
							lastError = uploadErr;
							await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); // Backoff
						}
					}
					// If all retries fail, return the ephemeral URL but mark as partial failure
					console.error(
						`[decompose.remote] Failed to persist layer ${index} after retries. Returning ephemeral.`
					);
					historyWarning =
						(historyWarning || '') + `Failed to save layer ${index + 1} permanently. `;
					return layer; // Return original ephemeral layer
				})
			);

			// 3. Save to Database History with actual credit cost
			if (org_id && user?.id) {
				try {
					await db.insert(schema.aiGenerations).values({
						orgId: org_id,
						userId: user.id,
						provider: 'fal-ai-decompose',
						model: 'Qwen-Image-Layered',
						creditsUsed: decomposeCost,
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
					historyWarning = (historyWarning || '') + 'History could not be saved.';
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
				layers: persistedLayers,
				historyWarning
			};
		} catch (err) {
			console.error('[decompose.remote] decomposeWithFal error:', err);
			throw err;
		}
	}
);

/**
 * Upscale an image and return the upscaled URL for preview.
 * Persists to R2 and saves to history.
 */
export const upscaleImagePreview = command(
	'unchecked',
	async (
		input: z.input<typeof upscaleImageSchema>
	): Promise<{
		success: boolean;
		upscaledUrl?: string;
		originalUrl: string;
		error?: string;
		historyWarning?: string;
	}> => {
		// Validate input
		const parseResult = upscaleImageSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				originalUrl: input?.imageUrl || '',
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		const { imageUrl, model, side, templateId } = parseResult.data;

		console.log(
			'[decompose.remote] upscaleImagePreview called with:',
			imageUrl,
			'model:',
			model,
			'templateId:',
			templateId
		);
		const { user, org_id } = await requireAdmin();

		// Check credits first - Define upscale cost (e.g. 1 credit)
		const upscaleCost = 1; // Or define in CREDIT_COSTS.AI_UPSCALE

		/* BYPASS CREDIT CHECK
		// Refresh user data
		const userProfile = await db.query.profiles.findFirst({
			where: eq(schema.profiles.id, user.id),
			columns: { creditsBalance: true }
		});

		if (!userProfile || (userProfile.creditsBalance || 0) < upscaleCost) {
			return {
				success: false,
				originalUrl: imageUrl,
				error: `Insufficient credits. Required: ${upscaleCost}, Available: ${userProfile?.creditsBalance || 0}`
			};
		}
		*/
		console.log('[decompose.remote] Credit check bypassed for Upscale');

		let historyWarning: string | undefined;

		try {
			const { upscaleImage, isFalConfigured } = await import('$lib/server/fal-layers');

			if (!isFalConfigured()) {
				console.log('[decompose.remote] FAL_KEY not configured, returning mock upscale');
				return {
					success: true,
					upscaledUrl: imageUrl, // Mock: return original
					originalUrl: imageUrl
				};
			}

			console.log(`[decompose.remote] Calling upscaleImage with model ${model}...`);
			const tempUpscaledUrl = await upscaleImage(imageUrl, model);
			console.log('[decompose.remote] Upscale complete (temp):', tempUpscaledUrl);

			// Apply credit deduction after successful AI generation
			/* BYPASS CREDIT DEDUCTION
			try {
				await adjustUserCredits({
					userId: user.id,
					delta: -upscaleCost,
					reason: `AI Upscale (${model})`
				});
				console.log('[decompose.remote] Credits deducted:', upscaleCost);
			} catch (creditErr) {
				console.error('[decompose.remote] Failed to deduct credits:', creditErr);
				historyWarning = (historyWarning || '') + ' Network issue updating credits. ';
			}
			*/
			console.log('[decompose.remote] Credit deduction bypassed for Upscale');

			// 1. Persist to R2 with retries
			const timestamp = Date.now();
			const id = crypto.randomUUID();
			const key = `decompose/upscaled/${user?.id || 'anon'}/${timestamp}_${id}.png`;
			let r2Url = '';

			let persistenceSuccess = false;
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					const response = await fetchWithTimeout(tempUpscaledUrl, 30000);
					if (!response.ok) throw new Error('Failed to download upscaled image from Fal');
					const buffer = Buffer.from(await response.arrayBuffer());
					r2Url = await uploadToR2(key, buffer, 'image/png');
					console.log('[decompose.remote] Persisted to R2:', r2Url);
					persistenceSuccess = true;
					break;
				} catch (uploadErr: any) {
					console.warn(
						`[decompose.remote] Attempt ${attempt + 1}/3 failed to persist upscale:`,
						uploadErr
					);
					await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); // Backoff
				}
			}

			if (!persistenceSuccess) {
				// Critical failure: paid for upscale but failed to save.
				// fallback: try to return temp URL but warn heavily.
				historyWarning =
					(historyWarning || '') +
					' Failed to save upscaled image permanently (Link expires soon).';
				r2Url = tempUpscaledUrl; // Better than nothing? Or maybe fail?
			}

			// 3. Save to History (aiGenerations)
			console.log(
				'[decompose.remote] Saving to history. Org:',
				org_id,
				'User:',
				user?.id,
				'Side:',
				side,
				'TemplateId:',
				templateId
			);
			if (org_id && user?.id) {
				try {
					await db.insert(schema.aiGenerations).values({
						orgId: org_id,
						userId: user.id,
						provider: 'fal-ai-upscale',
						model: model,
						creditsUsed: upscaleCost,
						resultUrl: r2Url,
						metadata: {
							input_image: imageUrl,
							side: side || undefined,
							type: 'upscale',
							template_id: templateId || undefined
						}
					});
				} catch (dbErr) {
					console.error('[decompose.remote] Failed to save upscale history:', dbErr);
					historyWarning = 'Upscale succeeded but history could not be saved.';
				}
			}

			return {
				success: true,
				upscaledUrl: r2Url,
				originalUrl: imageUrl,
				historyWarning
			};
		} catch (err: unknown) {
			console.error('[decompose.remote] upscaleImagePreview error:', err);
			const errorMessage = err instanceof Error ? err.message : 'Upscale failed';
			return {
				success: false,
				originalUrl: imageUrl,
				error: errorMessage
			};
		}
	}
);

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
					eq(schema.aiGenerations.provider, 'fal-ai-decompose'),
					eq(schema.aiGenerations.provider, 'fal-ai-upscale'),
					eq(schema.aiGenerations.provider, 'runware-remove-element')
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
export const removeElementFromLayer = command(
	'unchecked',
	async (
		input: z.input<typeof removeElementSchema>
	): Promise<{
		success: boolean;
		resultUrl?: string;
		originalUrl: string;
		error?: string;
		historyWarning?: string;
	}> => {
		// Validate input
		const parseResult = removeElementSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				originalUrl: input?.imageUrl || '',
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		const { imageUrl, prompt, side, templateId } = parseResult.data;

		console.log('[decompose.remote] removeElementFromLayer called with:', {
			imageUrl,
			prompt,
			side,
			templateId
		});
		const { user, org_id } = await requireAdmin();

		// Define remove element cost (e.g. 1 credit)
		const removeElementCost = 1;
		console.log('[decompose.remote] Credit check bypassed for Remove Element');

		let historyWarning: string | undefined;

		try {
			console.log(
				`[decompose.remote] Calling Runware editImageWithRunware with prompt: "${prompt}"...`
			);

			// Use Runware with 'all' as the remove type, but pass the custom prompt
			const result = await editImageWithRunware(imageUrl, 'all', prompt);

			if (!result.success || !result.imageUrl) {
				return {
					success: false,
					originalUrl: imageUrl,
					error: result.error || 'Remove element failed'
				};
			}

			console.log('[decompose.remote] Remove element complete (Runware):', result.imageUrl);
			console.log('[decompose.remote] Credit deduction bypassed for Remove Element');

			// 1. Persist to R2 with retries
			const timestamp = Date.now();
			const id = crypto.randomUUID();
			const key = `decompose/removed/${user?.id || 'anon'}/${timestamp}_${id}.png`;
			let r2Url = '';

			let persistenceSuccess = false;
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					const response = await fetchWithTimeout(result.imageUrl, 30000);
					if (!response.ok) throw new Error('Failed to download image from Runware');
					const buffer = Buffer.from(await response.arrayBuffer());
					r2Url = await uploadToR2(key, buffer, 'image/png');
					console.log('[decompose.remote] Persisted to R2:', r2Url);
					persistenceSuccess = true;
					break;
				} catch (uploadErr: any) {
					console.warn(
						`[decompose.remote] Attempt ${attempt + 1}/3 failed to persist remove element:`,
						uploadErr
					);
					await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); // Backoff
				}
			}

			if (!persistenceSuccess) {
				historyWarning =
					(historyWarning || '') +
					' Failed to save processed image permanently (Link expires soon).';
				r2Url = result.imageUrl; // Fallback to ephemeral
			}

			// 2. Save to History (aiGenerations)
			console.log(
				'[decompose.remote] Saving to history. Org:',
				org_id,
				'User:',
				user?.id,
				'Side:',
				side
			);
			if (org_id && user?.id) {
				try {
					await db.insert(schema.aiGenerations).values({
						orgId: org_id,
						userId: user.id,
						provider: 'runware-remove-element',
						model: 'prunaai:2@1',
						creditsUsed: removeElementCost,
						prompt: prompt,
						resultUrl: r2Url,
						metadata: {
							input_image: imageUrl,
							side: side || undefined,
							type: 'remove-element',
							template_id: templateId || undefined,
							cost: result.cost
						}
					});
				} catch (dbErr) {
					console.error('[decompose.remote] Failed to save remove element history:', dbErr);
					historyWarning = 'Remove succeeded but history could not be saved.';
				}
			}

			return {
				success: true,
				resultUrl: r2Url,
				originalUrl: imageUrl,
				historyWarning
			};
		} catch (err: unknown) {
			console.error('[decompose.remote] removeElementFromLayer error:', err);
			const errorMessage = err instanceof Error ? err.message : 'Remove element failed';
			return {
				success: false,
				originalUrl: imageUrl,
				error: errorMessage
			};
		}
	}
);
