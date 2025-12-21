import { command } from '$app/server';
import { decomposeWithFal, isFalConfigured, type DecomposeResponse } from '$lib/server/fal-layers';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
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
	if (
		!locals.user ||
		!['super_admin', 'org_admin', 'id_gen_admin'].includes(locals.user.role as string)
	) {
		console.error('[decompose.remote] Admin access denied for role:', locals.user?.role);
		throw error(403, 'Admin access required');
	}
	return locals;
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

/**
 * Decompose an image into layers using fal.ai Qwen-Image-Layered.
 */
export const decomposeImage = command(
	'unchecked',
	async ({
		imageUrl,
		numLayers = 4,
		prompt,
		seed
	}: {
		imageUrl: string;
		numLayers?: number;
		prompt?: string;
		seed?: number;
	}): Promise<DecomposeResponse> => {
		console.log('[decompose.remote] decomposeImage called with:', { imageUrl, numLayers });
		await requireAdmin();
		console.log('[decompose.remote] Admin check passed, calling decomposeWithFal...');

		try {
			const result = await decomposeWithFal({
				imageUrl,
				numLayers,
				prompt,
				seed
			});
			console.log(
				'[decompose.remote] decomposeWithFal result:',
				result.success,
				result.layers?.length ?? 0,
				'layers'
			);
			return result;
		} catch (err) {
			console.error('[decompose.remote] decomposeWithFal error:', err);
			throw err;
		}
	}
);

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
