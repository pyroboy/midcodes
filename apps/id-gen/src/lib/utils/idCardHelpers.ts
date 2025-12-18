import { db } from '$lib/server/db';
import { idcards, digitalCards } from '$lib/server/schema';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';

function generateSlug(length = 10) {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateClaimCode(length = 6) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface ImageUploadResult {
	frontPath: string;
	backPath: string;
	error?: string;
}

export interface ImageUploadError {
	error: string;
	frontPath?: never;
	backPath?: never;
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

		if (!frontImage || !backImage) {
			return { error: 'Missing image files' };
		}

		const timestamp = Date.now();
		const frontPath = `${orgId}/${templateId}/${timestamp}_front.png`;
		const backPath = `${orgId}/${templateId}/${timestamp}_back.png`;

		try {
			await uploadToR2(frontPath, frontImage, 'image/png');
		} catch (err) {
			console.error('Front image upload failed:', err);
			return { error: 'Front image upload failed' };
		}

		try {
			await uploadToR2(backPath, backImage, 'image/png');
		} catch (err) {
			// Clean up front image on back image failure
			await deleteFromR2(frontPath).catch(() => {});
			console.error('Back image upload failed:', err);
			return { error: 'Back image upload failed' };
		}

		return { frontPath, backPath };
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
	templateId,
	orgId,
	frontPath,
	backPath,
	formFields,
	createDigitalCard,
	userId
}: {
	templateId: string;
	orgId: string;
	frontPath: string;
	backPath: string;
	formFields: Record<string, string>;
	createDigitalCard?: boolean;
	userId?: string;
}) {
	try {
		// Use Drizzle for database operations
		const [idCard] = await db
			.insert(idcards)
			.values({
				templateId: templateId,
				orgId: orgId,
				frontImage: frontPath,
				backImage: backPath,
				data: formFields,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		if (!idCard) {
			// Clean up uploaded images on failure
			await Promise.allSettled([
				deleteFromR2(frontPath),
				deleteFromR2(backPath)
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
				back_image: idCard.backImage
			}, 
			digitalCard, 
			claimCode 
		};
	} catch (err) {
		console.error('Error in saveIdCardData:', err);
		// Clean up on error
		await Promise.allSettled([
			deleteFromR2(frontPath),
			deleteFromR2(backPath)
		]);
		return { error: err instanceof Error ? err.message : 'Failed to save ID card data' };
	}
}
