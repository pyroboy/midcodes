import { error, fail } from '@sveltejs/kit';
import { handleImageUploads, saveIdCardData } from '$lib/utils/idCardHelpers';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { org_id, session } = locals;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const templateId = params.id;
	console.log(' [Use Template] Loading template:', { templateId });

	// Fetch the template
	const [templateData] = await db
		.select()
		.from(templates)
		.where(eq(templates.id, templateId))
		.limit(1);

	if (!templateData) {
		console.error(' [Use Template] Template not found:', { templateId });
		throw error(404, 'Template not found');
	}

	// SECURITY: Defense-in-depth IDOR check
	if (org_id && templateData.orgId !== org_id) {
		console.error('[Use Template] Security violation: Cross-organization template access attempt', {
			userOrgId: org_id,
			templateOrgId: templateData.orgId
		});
		throw error(403, 'Unauthorized access to template');
	}

	const template = {
		...templateData,
		user_id: templateData.userId,
		org_id: templateData.orgId,
		width_pixels: templateData.widthPixels,
		height_pixels: templateData.heightPixels,
		front_background: templateData.frontBackground,
		back_background: templateData.backBackground,
		template_elements: templateData.templateElements
	};

	return {
		template
	};
};

export const actions: Actions = {
	saveIdCard: async ({ request, locals }) => {
		const { org_id: userOrgId, session, user } = locals;
		
		if (!session || !user) {
			return fail(401, { error: 'Unauthorized' });
		}

		console.log('[Save ID Card] Starting save process...');

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId')?.toString();
			
			if (!templateId) {
				return fail(400, { error: 'Template ID is required' });
			}

			// Verify template exists and check permissions
			const [template] = await db
				.select({ orgId: templates.orgId })
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!template) {
				return fail(404, { error: 'Template not found' });
			}

			// SECURITY: Enforce organization isolation
			if (userOrgId && template.orgId !== userOrgId) {
				return fail(403, { error: 'Unauthorized: Template does not belong to your organization' });
			}

			const effectiveOrgId = userOrgId || template.orgId;
			
			if (!effectiveOrgId) {
				return fail(400, { error: 'Organization ID is required' });
			}

			// Handle uploads via R2
			const uploadResult = await handleImageUploads(formData, effectiveOrgId, templateId);

			if ('error' in uploadResult) {
				console.error('[Save ID Card] Upload error:', uploadResult.error);
				return fail(500, { error: 'Failed to upload images' });
			}

			// Collect form fields as simple key-value pairs
			const excludedKeys = ['templateId', 'frontImage', 'backImage', 'createDigitalCard'];
			const formFields: Record<string, string> = {};
			for (const [key, value] of formData.entries()) {
				if (!excludedKeys.includes(key) && typeof value === 'string') {
					formFields[key] = value;
				}
			}

			const createDigitalCard = formData.get('createDigitalCard') === 'true';

			// Save data via Drizzle
			const saveResult = await saveIdCardData({
				templateId,
				orgId: effectiveOrgId,
				frontPath: uploadResult.frontPath,
				backPath: uploadResult.backPath,
				formFields,
				createDigitalCard,
				userId: user.id
			});

			if ('error' in saveResult) {
				console.error('[Save ID Card] Save error:', saveResult.error);
				return fail(500, { error: 'Failed to save ID card' });
			}

			const { data: idCard, digitalCard, claimCode } = saveResult;

			return {
				type: 'success',
				data: [
					{
						success: true,
						idCardId: idCard?.id,
						digitalCard: digitalCard ? {
							slug: digitalCard.slug,
							claimCode: claimCode,
							status: digitalCard.status
						} : null
					}
				]
			};
		} catch (err) {
			console.error('[Save ID Card] Unexpected error:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
