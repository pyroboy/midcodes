import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '$lib/server/db';
import { idcards, digitalCards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

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

export async function handleImageUploads(
	supabase: SupabaseClient,
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

		const frontUpload = await uploadToStorage(supabase, {
			bucket: 'rendered-id-cards',
			file: frontImage,
			path: frontPath
		});

		if (frontUpload.error) {
			return { error: 'Front image upload failed' };
		}

		const backUpload = await uploadToStorage(supabase, {
			bucket: 'rendered-id-cards',
			file: backImage,
			path: backPath
		});

		if (backUpload.error) {
			await deleteFromStorage(supabase, 'rendered-id-cards', frontPath);
			return { error: 'Back image upload failed' };
		}

		return { frontPath, backPath };
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : 'Failed to handle image uploads'
		};
	}
}

export async function saveIdCardData(
	supabase: SupabaseClient,
	{
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
	}
) {
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
			await Promise.all([
				deleteFromStorage(supabase, 'rendered-id-cards', frontPath),
				deleteFromStorage(supabase, 'rendered-id-cards', backPath)
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
		await Promise.all([
			deleteFromStorage(supabase, 'rendered-id-cards', frontPath),
			deleteFromStorage(supabase, 'rendered-id-cards', backPath)
		]);
		return { error: err instanceof Error ? err.message : 'Failed to save ID card data' };
	}
}

export async function deleteFromStorage(
	supabase: SupabaseClient,
	bucket: string,
	path: string
): Promise<{ error?: string }> {
	try {
		const { error } = await supabase.storage.from(bucket).remove([path]);
		if (error) {
			return { error: error.message };
		}
		return {};
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'Failed to delete from storage' };
	}
}

async function uploadToStorage(
	supabase: SupabaseClient,
	{
		bucket,
		file,
		path,
		options = {}
	}: {
		bucket: string;
		file: Blob;
		path: string;
		options?: {
			cacheControl?: string;
			contentType?: string;
			upsert?: boolean;
		};
	}
) {
	return await supabase.storage.from(bucket).upload(path, file, {
		cacheControl: '3600',
		contentType: 'image/png',
		upsert: true,
		...options
	});
}
