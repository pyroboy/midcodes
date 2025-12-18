import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkRateLimit, RateLimitConfigs } from '$lib/utils/rate-limiter';
import { validateImageUploadServer, sanitizeFilename } from '$lib/utils/fileValidation';
import { db } from '$lib/server/db';
import { templates, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';

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
	const templatesData = await db.select({
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

			// SECURITY: Sanitize filenames to prevent path traversal
			const safeFrontName = sanitizeFilename(frontImage.name);
			const safeBackName = sanitizeFilename(backImage.name);

			// Upload front image to R2
			const frontPath = `front_custom_${Date.now()}_${safeFrontName}`;
            // uploadToR2 returns the public URL, but the logic below might expect just the path
            // The original code stored 'frontPath' in DB.
            // If we switch to R2, we should probably store the public URL or continue storing the path 
            // BUT the getSupabaseStorageUrl util now expects a path and prepends the domain.
            // So storing the path (key) is still consistent with the updated utility.
            // Wait, uploadToR2 returns the FULL public URL. 
            // If the DB stores the PATH, we should just use the path.
            // But wait, the previous code stored `frontPath` (filename).
            // Let's rely on standardizing to storing the key or URL.
            // Drizzle schema for idcards has `frontImage: text`.
            // If I store the full URL, validation/display might break if it expects a relative path.
            // However, `uploadToR2` returns the full URL.
            // The `getSupabaseStorageUrl` (now R2 util) handles full URLs correctly (returns them as is).
            // So storing the FULL URL is safer for R2 to allow external domains.
            // OR I can just ignore the return value and store the KEY, and let the util rebuild it.
            // Storing the KEY is more flexible (allows domain changes).
            // Let's store the KEY for now to match previous behavior of storing `frontPath`.
            
			await uploadToR2(frontPath, Buffer.from(frontBuffer), frontValidation.detectedMime || 'application/octet-stream');

			// Upload back image to R2
			const backPath = `back_custom_${Date.now()}_${safeBackName}`;
            try {
			    await uploadToR2(backPath, Buffer.from(backBuffer), backValidation.detectedMime || 'application/octet-stream');
            } catch (backError) {
                await deleteFromR2(frontPath);
                throw backError;
            }

			// Insert ID card record with Drizzle
			try {
				await db.insert(idcards).values({
					templateId: templateId,
					orgId: org_id,
					frontImage: frontPath, // Storing key, compatible with updated util
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
