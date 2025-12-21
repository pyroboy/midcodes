/**
 * Remote functions for image enhancement (upscale, remove elements)
 */
import { command } from '$app/server';
import { getRequestEvent } from '$app/server';
import {
	upscaleImageWithRunware,
	editImageWithRunware,
	type RemoveType,
	type UpscaleResult,
	type EditResult
} from '$lib/server/runware';
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

/**
 * Upscale an image using Runware API
 */
export const upscaleImage = command(
	'unchecked',
	async ({ imageUrl, upscaleFactor = 2 }: { imageUrl: string; upscaleFactor?: 2 | 4 }): Promise<UpscaleResult> => {
		await requireAdmin();
		const result = await upscaleImageWithRunware(imageUrl, upscaleFactor);
		return result;
	}
);

/**
 * Remove elements from an image using Runware API
 */
export const removeFromImage = command(
	'unchecked',
	async ({
		imageUrl,
		removeType,
		customPrompt
	}: {
		imageUrl: string;
		removeType: RemoveType;
		customPrompt?: string;
	}): Promise<EditResult> => {
		await requireAdmin();
		const result = await editImageWithRunware(imageUrl, removeType, customPrompt);
		return result;
	}
);

/**
 * Save enhanced image to R2 and update Template + Asset
 */
export const saveEnhancedImage = command(
	'unchecked',
	async ({
		assetId,
		imageUrl,
		side
	}: {
		assetId: string;
		imageUrl: string;
		side: 'front' | 'back';
	}) => {
		await requireAdmin();

		try {
			// 1. Download image from Runware
			console.log(`[saveEnhancedImage] Downloading from ${imageUrl}`);
			const response = await fetch(imageUrl);
			if (!response.ok) throw new Error('Failed to download image from Runware');
			
			const buffer = await response.arrayBuffer();
			const contentType = response.headers.get('content-type') || 'image/png';
			let ext = 'png';
			if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
			else if (contentType.includes('webp')) ext = 'webp';

			// 2. Upload to R2
			// Use a clean path: assets/enhanced/{assetId}_{side}_{timestamp}.{ext}
			const timestamp = Date.now();
			const filename = `assets/enhanced/${assetId}_${side}_${timestamp}.${ext}`;
			
			console.log(`[saveEnhancedImage] Uploading to R2: ${filename}`);
			const publicUrl = await uploadToR2(filename, Buffer.from(buffer), contentType);

			// 3. Update Database
			// Get current asset to confirm template link
			const [asset] = await db
				.select()
				.from(templateAssets)
				.where(eq(templateAssets.id, assetId))
				.limit(1);

			if (!asset || !asset.templateId) {
				throw new Error('Asset not found or not linked to a template');
			}

			// Update Template (both working background and blank url)
			const templateUpdate: any = { updatedAt: new Date() };
			if (side === 'front') {
				templateUpdate.frontBackground = publicUrl;
				templateUpdate.blankFrontUrl = publicUrl;
			} else {
				templateUpdate.backBackground = publicUrl;
				templateUpdate.blankBackUrl = publicUrl;
			}
			
			await db
				.update(templates)
				.set(templateUpdate)
				.where(eq(templates.id, asset.templateId));

			// Update Asset
			const assetUpdate: any = { updatedAt: new Date() };
			if (side === 'front') {
				assetUpdate.imageUrl = publicUrl;
			} else {
				assetUpdate.backImageUrl = publicUrl;
			}

			await db
				.update(templateAssets)
				.set(assetUpdate)
				.where(eq(templateAssets.id, assetId));

			console.log(`[saveEnhancedImage] Success! Updated template ${asset.templateId} and asset ${assetId}`);
			return { success: true, url: publicUrl };

		} catch (err) {
			console.error('[saveEnhancedImage] Error:', err);
			throw error(500, err instanceof Error ? err.message : 'Failed to save enhanced image');
		}
	}
);
