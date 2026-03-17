/**
 * Remote functions for updating template background with variant regeneration
 * This centralizes the template background update to ensure thumbnails are regenerated
 */
import { command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { checkAdmin } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { templates, templateAssets } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { uploadToR2 } from '$lib/server/s3';

// Helper to check for admin access
async function requireAdmin() {
	const { locals } = getRequestEvent();
	if (!checkAdmin(locals)) {
		throw error(403, 'Admin access required');
	}
}

export interface BackgroundVariantUrls {
	fullUrl: string;
	thumbUrl: string;
	previewUrl: string;
}

/**
 * Update template background with all variants (full, thumb, preview)
 * This ensures thumbnails are regenerated when background is updated
 */
export const updateTemplateBackgroundWithVariants = command(
	'unchecked',
	async ({
		assetId,
		side,
		fullBase64,
		thumbBase64,
		previewBase64,
		contentType = 'image/png'
	}: {
		assetId: string;
		side: 'front' | 'back';
		fullBase64: string;
		thumbBase64: string;
		previewBase64: string;
		contentType?: string;
	}): Promise<{ success: boolean; urls?: BackgroundVariantUrls; error?: string }> => {
		await requireAdmin();

		try {
			// Get asset to find template
			const [asset] = await db
				.select()
				.from(templateAssets)
				.where(eq(templateAssets.id, assetId))
				.limit(1);

			if (!asset || !asset.templateId) {
				throw new Error('Asset not found or not linked to a template');
			}

			const timestamp = Date.now();
			const templateId = asset.templateId;

			// Determine file extensions
			const fullExt = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
			const variantExt = 'jpg'; // Variants are always JPEG for size

			// Upload all three variants in parallel
			const [fullUrl, thumbUrl, previewUrl] = await Promise.all([
				uploadToR2(
					`templates/${templateId}/${side}_full_${timestamp}.${fullExt}`,
					Buffer.from(fullBase64, 'base64'),
					contentType
				),
				uploadToR2(
					`templates/${templateId}/${side}_thumb_${timestamp}.${variantExt}`,
					Buffer.from(thumbBase64, 'base64'),
					'image/jpeg'
				),
				uploadToR2(
					`templates/${templateId}/${side}_preview_${timestamp}.${variantExt}`,
					Buffer.from(previewBase64, 'base64'),
					'image/jpeg'
				)
			]);

			// Update Template with all URLs
			const templateUpdate: Record<string, unknown> = { updatedAt: new Date() };
			if (side === 'front') {
				templateUpdate.frontBackground = fullUrl;
				templateUpdate.blankFrontUrl = fullUrl;
				templateUpdate.thumbFrontUrl = thumbUrl;
				templateUpdate.previewFrontUrl = previewUrl;
			} else {
				templateUpdate.backBackground = fullUrl;
				templateUpdate.blankBackUrl = fullUrl;
				templateUpdate.thumbBackUrl = thumbUrl;
				templateUpdate.previewBackUrl = previewUrl;
			}

			await db.update(templates).set(templateUpdate).where(eq(templates.id, templateId));

			// Update Asset
			const assetUpdate: Record<string, unknown> = { updatedAt: new Date() };
			if (side === 'front') {
				assetUpdate.imageUrl = fullUrl;
			} else {
				assetUpdate.backImageUrl = fullUrl;
			}

			await db.update(templateAssets).set(assetUpdate).where(eq(templateAssets.id, assetId));

			console.log(
				`[updateTemplateBackgroundWithVariants] Success! Updated template ${templateId} with all variants`
			);

			return {
				success: true,
				urls: { fullUrl, thumbUrl, previewUrl }
			};
		} catch (err) {
			console.error('[updateTemplateBackgroundWithVariants] Error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to update background'
			};
		}
	}
);
