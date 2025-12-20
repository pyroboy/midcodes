import { db } from '$lib/server/db';
import { idcards, digitalCards } from '$lib/server/schema';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';
import { getCardAssetPath, getCardRawAssetPath } from './storagePath';
import { v4 as uuidv4 } from 'uuid';

function generateSlug(length = 10) {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateClaimCode(length = 6) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface ImageUploadResult {
	cardId: string;
	frontPath: string;
	backPath: string;
	frontPreviewPath: string;
	backPreviewPath: string;
	rawAssets: Record<string, { path: string; type: string }>;
	error?: string;
}

export interface ImageUploadError {
	error: string;
	frontPath?: never;
	backPath?: never;
	frontPreviewPath?: never;
	backPreviewPath?: never;
}

/**
 * Handle image uploads using R2 storage
 */
export async function handleImageUploads(
	formData: FormData,
	orgId: string,
	templateId: string
): Promise<ImageUploadResult | ImageUploadError> {
	try {
		const frontImage = formData.get('frontImage') as Blob;
		const backImage = formData.get('backImage') as Blob;
		const frontImagePreview = formData.get('frontImagePreview') as Blob;
		const backImagePreview = formData.get('backImagePreview') as Blob;

		if (!frontImage || !backImage) {
			return { error: 'Missing image files' };
		}

		const cardId = uuidv4();

		const variants = [
			{ variant: 'full' as const, side: 'front' as const, blob: frontImage, ext: 'png' },
			{ variant: 'full' as const, side: 'back' as const, blob: backImage, ext: 'png' },
			{ variant: 'preview' as const, side: 'front' as const, blob: frontImagePreview, ext: 'jpg' },
			{ variant: 'preview' as const, side: 'back' as const, blob: backImagePreview, ext: 'jpg' }
		];

		const uploads = await Promise.allSettled(
			variants.map(async (v) => {
				if (!v.blob) return null;
				const path = getCardAssetPath(orgId, templateId, cardId, v.variant, v.side, v.ext);
				await uploadToR2(
					path,
					v.blob,
					v.blob.type || (v.ext === 'png' ? 'image/png' : 'image/jpeg')
				);
				return { variant: v.variant, side: v.side, path };
			})
		);

		const results: Record<string, string> = {};
		const errors: any[] = [];

		uploads.forEach((res) => {
			if (res.status === 'fulfilled' && res.value) {
				const key = `${res.value.variant}${res.value.side.charAt(0).toUpperCase() + res.value.side.slice(1)}Path`;
				results[key] = res.value.path;
			} else if (res.status === 'rejected') {
				errors.push(res.reason);
			}
		});

		if (errors.length > 0) {
			// Cleanup any successful uploads
			await Promise.allSettled(
				uploads.map((res) =>
					res.status === 'fulfilled' && res.value ? deleteFromR2(res.value.path) : null
				)
			);
			return { error: `Image upload failed: ${errors[0]?.message || 'Unknown error'}` };
		}

		// Handle Raw Assets (Photos, Signatures)
		const rawAssets: Record<string, { path: string; type: string }> = {};
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('raw_asset_') && value instanceof Blob) {
				const variableName = key.replace('raw_asset_', '');
				const ext = value.type === 'image/png' ? 'png' : 'jpg';
				const path = getCardRawAssetPath(orgId, templateId, cardId, variableName, ext);
				await uploadToR2(path, value, value.type);
				rawAssets[variableName] = { path, type: value.type };
			}
		}

		return {
			cardId,
			frontPath: results.fullFrontPath,
			backPath: results.fullBackPath,
			frontPreviewPath: results.previewFrontPath,
			backPreviewPath: results.previewBackPath,
			rawAssets
		} as ImageUploadResult;
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : 'Failed to handle image uploads'
		};
	}
}

/**
 * Save ID card data to database using Drizzle
 */
export async function saveIdCardData({
	cardId,
	templateId,
	orgId,
	frontPath,
	backPath,
	frontPreviewPath,
	backPreviewPath,
	rawAssets = {},
	formFields,
	createDigitalCard,
	userId
}: {
	cardId?: string;
	templateId: string;
	orgId: string;
	frontPath: string;
	backPath: string;
	frontPreviewPath?: string;
	backPreviewPath?: string;
	rawAssets?: Record<string, { path: string; type: string }>;
	formFields: Record<string, string>;
	createDigitalCard?: boolean;
	userId?: string;
}) {
	try {
		// Use Drizzle for database operations
		const [idCard] = await db
			.insert(idcards)
			.values({
				id: cardId as any,
				templateId: templateId,
				orgId: orgId,
				frontImage: frontPath,
				backImage: backPath,
				frontImageLowRes: frontPreviewPath,
				backImageLowRes: backPreviewPath,
				originalAssets: rawAssets,
				data: formFields,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		if (!idCard) {
			// Clean up uploaded images on failure
			await Promise.allSettled([
				deleteFromR2(frontPath),
				deleteFromR2(backPath),
				frontPreviewPath ? deleteFromR2(frontPreviewPath) : null,
				backPreviewPath ? deleteFromR2(backPreviewPath) : null
			]);
			return { error: 'Failed to create ID card' };
		}

		let digitalCard = null;
		let claimCode = null;

		if (createDigitalCard && idCard.id) {
			const slug = generateSlug();
			const code = generateClaimCode();

			const [dcData] = await db
				.insert(digitalCards)
				.values({
					slug,
					linkedIdCardId: idCard.id,
					orgId,
					status: userId ? 'active' : 'unclaimed',
					claimCodeHash: code, // TODO: Real hashing
					ownerId: userId || null,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			if (dcData) {
				digitalCard = {
					...dcData,
					linked_id_card_id: dcData.linkedIdCardId,
					org_id: dcData.orgId,
					claim_code_hash: dcData.claimCodeHash,
					owner_id: dcData.ownerId
				};
				claimCode = code;
			}
		}

		return {
			data: {
				...idCard,
				template_id: idCard.templateId,
				org_id: idCard.orgId,
				front_image: idCard.frontImage,
				back_image: idCard.backImage,
				front_image_low_res: idCard.frontImageLowRes,
				back_image_low_res: idCard.backImageLowRes
			},
			digitalCard,
			claimCode
		};
	} catch (err) {
		console.error('Error in saveIdCardData:', err);
		// Clean up on error
		await Promise.allSettled([
			deleteFromR2(frontPath),
			deleteFromR2(backPath),
			frontPreviewPath ? deleteFromR2(frontPreviewPath) : null,
			backPreviewPath ? deleteFromR2(backPreviewPath) : null
		]);
		return { error: err instanceof Error ? err.message : 'Failed to save ID card data' };
	}
}
