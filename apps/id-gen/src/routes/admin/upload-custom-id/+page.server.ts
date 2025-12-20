import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkRateLimit, RateLimitConfigs } from '$lib/utils/rate-limiter';
import { validateImageUploadServer, sanitizeFilename } from '$lib/utils/fileValidation';
import { db } from '$lib/server/db';
import { templates, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';
import { getCardAssetPath } from '$lib/utils/storagePath';
import { v4 as uuidv4 } from 'uuid';

// SECURITY: Maximum file size for uploads (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const load: PageServerLoad = async ({ locals }) => {
	const { org_id } = locals;

	if (!org_id) {
		return {
			templates: []
		};
	}

	// Fetch templates for the dropdown with Drizzle
	const templatesData = await db
		.select({
			id: templates.id,
			name: templates.name
		})
		.from(templates)
		.where(eq(templates.orgId, org_id))
		.orderBy(templates.name);

	return {
		templates: templatesData || []
	};
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const { org_id, user } = locals;

		// SECURITY: Rate limiting for file uploads
		const rateLimitResult = checkRateLimit(
			request,
			RateLimitConfigs.UPLOAD,
			'admin:upload-custom-id',
			user?.id
		);

		if (rateLimitResult.limited) {
			return fail(429, { error: 'Too many uploads. Please try again later.' });
		}

		if (!org_id) {
			return fail(403, { error: 'No organization context found' });
		}

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId') as string;
			const frontImage = formData.get('frontImage') as File;
			const backImage = formData.get('backImage') as File;

			if (!templateId || !frontImage || !backImage) {
				return fail(400, { error: 'Template and both images are required' });
			}

			// SECURITY: Server-side file size validation
			if (frontImage.size > MAX_FILE_SIZE) {
				return fail(400, { error: 'Front image too large (max 10MB)' });
			}
			if (backImage.size > MAX_FILE_SIZE) {
				return fail(400, { error: 'Back image too large (max 10MB)' });
			}

			// SECURITY: Server-side file type validation with magic bytes
			const frontBuffer = await frontImage.arrayBuffer();
			const frontValidation = await validateImageUploadServer(frontBuffer, frontImage.name);
			if (!frontValidation.valid) {
				return fail(400, { error: `Front image: ${frontValidation.error}` });
			}

			const backBuffer = await backImage.arrayBuffer();
			const backValidation = await validateImageUploadServer(backBuffer, backImage.name);
			if (!backValidation.valid) {
				return fail(400, { error: `Back image: ${backValidation.error}` });
			}

			// Generate ID early for path verification
			const cardId = uuidv4();

			// Determine extension from MIME or filename (default png)
			const frontExt = frontImage.type === 'image/jpeg' ? 'jpg' : 'png';
			const backExt = backImage.type === 'image/jpeg' ? 'jpg' : 'png';

			// Upload front image to R2 using standardized path
			// variant 'master' or 'full'? storagePath says 'master' | 'full'. Let's use 'full' to match other parts.
			const frontPath = getCardAssetPath(org_id, templateId, cardId, 'full', 'front', frontExt);
			
			// We store the KEY (path) in DB, consistent with other uploaders
			await uploadToR2(
				frontPath,
				Buffer.from(frontBuffer),
				frontValidation.detectedMime || frontImage.type
			);

			// Upload back image to R2
			const backPath = getCardAssetPath(org_id, templateId, cardId, 'full', 'back', backExt);
			try {
				await uploadToR2(
					backPath,
					Buffer.from(backBuffer),
					backValidation.detectedMime || backImage.type
				);
			} catch (backError) {
				await deleteFromR2(frontPath);
				throw backError;
			}

			// Insert ID card record with Drizzle
			try {
				await db.insert(idcards).values({
					id: cardId, // Use pre-generated ID
					templateId: templateId,
					orgId: org_id,
					frontImage: frontPath, // Storing standard path
					backImage: backPath,
					data: {}
				});
			} catch (insertError: any) {
				console.error('Error inserting ID card:', insertError);
				// Cleanup uploaded images
				await deleteFromR2(frontPath);
				await deleteFromR2(backPath);
				return fail(500, { error: 'Failed to save ID card' });
			}

			return { success: true, message: 'ID card uploaded successfully' };
		} catch (err) {
			console.error('Error in upload action:', err);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
