import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkRateLimit, RateLimitConfigs } from '$lib/utils/rate-limiter';
import { validateImageUploadServer, sanitizeFilename } from '$lib/utils/fileValidation';
import { db } from '$lib/server/db';
import { templates, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase';

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

			// Get supabaseAdmin for storage operations (hybrid approach)
			const supabaseAdmin = getSupabaseAdmin();

			// Upload front image with sanitized name
			const frontPath = `front_custom_${Date.now()}_${safeFrontName}`;
			const { error: frontUploadError } = await supabaseAdmin.storage
				.from('rendered-id-cards')
				.upload(frontPath, new Blob([frontBuffer], { type: frontValidation.detectedMime }), {
					contentType: frontValidation.detectedMime,
					upsert: false
				});

			if (frontUploadError) {
				console.error('Error uploading front image:', frontUploadError);
				return fail(500, { error: 'Failed to upload front image' });
			}

			// Upload back image with sanitized name
			const backPath = `back_custom_${Date.now()}_${safeBackName}`;
			const { error: backUploadError } = await supabaseAdmin.storage
				.from('rendered-id-cards')
				.upload(backPath, new Blob([backBuffer], { type: backValidation.detectedMime }), {
					contentType: backValidation.detectedMime,
					upsert: false
				});

			if (backUploadError) {
				console.error('Error uploading back image:', backUploadError);
				// Cleanup front image
				await supabaseAdmin.storage.from('rendered-id-cards').remove([frontPath]);
				return fail(500, { error: 'Failed to upload back image' });
			}

			// Insert ID card record with Drizzle
			try {
				await db.insert(idcards).values({
					templateId: templateId,
					orgId: org_id,
					frontImage: frontPath,
					backImage: backPath,
					data: {}
				});
			} catch (insertError: any) {
				console.error('Error inserting ID card:', insertError);
				// Cleanup uploaded images
				await supabaseAdmin.storage.from('rendered-id-cards').remove([frontPath, backPath]);
				return fail(500, { error: 'Failed to save ID card' });
			}

			return { success: true, message: 'ID card uploaded successfully' };
		} catch (err) {
			console.error('Error in upload action:', err);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
