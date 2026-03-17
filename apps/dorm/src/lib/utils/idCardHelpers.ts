import { uploadToR2, deleteFromR2 } from '$lib/server/s3';

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
		const frontKey = `rendered-id-cards/${orgId}/${templateId}/${timestamp}_front.png`;
		const backKey = `rendered-id-cards/${orgId}/${templateId}/${timestamp}_back.png`;

		let frontUrl: string;
		try {
			frontUrl = await uploadToR2(frontKey, frontImage, 'image/png');
		} catch {
			return { error: 'Front image upload failed' };
		}

		try {
			await uploadToR2(backKey, backImage, 'image/png');
		} catch {
			// Clean up front image if back upload fails
			try {
				await deleteFromR2(frontKey);
			} catch (cleanupErr) {
				console.error('Failed to clean up front image after back upload failure:', cleanupErr);
			}
			return { error: 'Back image upload failed' };
		}

		return { frontPath: frontKey, backPath: backKey };
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : 'Failed to handle image uploads'
		};
	}
}

export async function saveIdCardData({
	templateId,
	orgId,
	frontPath,
	backPath,
	formFields
}: {
	templateId: string;
	orgId: string;
	frontPath: string;
	backPath: string;
	formFields: Record<string, string>;
}) {
	try {
		// Import db and schema dynamically to avoid circular dependency issues
		const { db } = await import('$lib/server/db');
		const { idcards } = await import('$lib/server/schema');

		const [data] = await db
			.insert(idcards)
			.values({
				templateId,
				orgId,
				frontImage: frontPath,
				backImage: backPath,
				data: formFields
			})
			.returning();

		if (!data) {
			// Clean up uploaded images on DB failure
			await Promise.all([
				deleteFromR2(frontPath).catch((e) =>
					console.error('Cleanup failed for front image:', e)
				),
				deleteFromR2(backPath).catch((e) =>
					console.error('Cleanup failed for back image:', e)
				)
			]);
			return { error: 'No data returned after insert' };
		}

		return { data };
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'Failed to save ID card data' };
	}
}

export async function deleteFromStorage(key: string): Promise<{ error?: string }> {
	try {
		await deleteFromR2(key);
		return {};
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'Failed to delete from storage' };
	}
}
