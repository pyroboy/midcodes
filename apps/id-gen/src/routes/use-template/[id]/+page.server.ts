import { error, fail, redirect } from '@sveltejs/kit';
import { handleImageUploads, saveIdCardData, deleteFromStorage } from '$lib/utils/idCardHelpers';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	console.log('[Use Template Load] Starting with params:', params);

	const { supabase, safeGetSession, org_id } = locals;

	// const authResult = await checkAuth({ safeGetSession, action: 'Use Template Load' });
	// if (!authResult.success) {
	//     throw error(authResult.code, authResult.error);
	// }

	// const { session, profile, userRole } = authResult;

	const templateId = params.id;
	console.log(' [Use Template] Loading template:', { templateId });

	// Fetch the template with organization info
	const { data: templateData, error: templateError } = await supabase
		.from('templates')
		.select('*, organizations(*)')
		.eq('id', templateId)
		.single();

	const template = templateData as any;

	console.log(' [Use Template] Template query result:', {
		hasTemplate: !!template,
		error: templateError?.message,
		templateData: template
			? {
					id: template.id,
					name: template.name,
					org_id: template.org_id,
					elementsCount: template.template_elements?.length || 0
				}
			: null
	});

	if (templateError || !template) {
		console.error(' [Use Template] Failed to load template:', {
			error: templateError,
			templateId
		});
		throw error(404, 'Template not found');
	}

	// SECURITY: Defense-in-depth IDOR check
	// Ensure the template belongs to the user's organization
	if (org_id && template.org_id !== org_id) {
		console.error('[Use Template] Security violation: Cross-organization template access attempt', {
			userOrgId: org_id,
			templateOrgId: template.org_id
		});
		throw error(403, 'Unauthorized access to template');
	}

	return {
		template
	};
};

export const actions: Actions = {
	saveIdCard: async ({ request, locals }) => {
		const { supabase, org_id: userOrgId } = locals;
		console.log('[Save ID Card] Starting save process...');
		console.log('[Save ID Card] User org_id:', userOrgId);

		try {
			const formData = await request.formData();
			console.log('[Save ID Card] Form data received:', {
				fields: Array.from(formData.keys()),
				hasFiles: Array.from(formData.keys()).some((key) => formData.get(key) instanceof File),
				templateId: formData.get('templateId')?.toString()
			});

			const templateId = formData.get('templateId')?.toString();
			if (!templateId) {
				console.log('[Save ID Card] No template ID provided');
				return fail(400, { error: 'Template ID is required' });
			}

			// Verify template exists
			const { data: templateData, error: templateError } = await supabase
				.from('templates')
				.select('org_id, organizations(*), template_elements')
				.eq('id', templateId)
				.single();

			const template = templateData as any;

			console.log('[Save ID Card] Template lookup:', {
				found: !!template,
				error: templateError?.message,
				templateOrgId: template?.org_id,
				elementsCount: template?.template_elements?.length
			});

			if (templateError || !template) {
				console.log('[Save ID Card] Template not found:', {
					error: templateError,
					templateId
				});
				return fail(404, { error: 'Template not found' });
			}

			// SECURITY: Enforce organization isolation
			if (userOrgId && template.org_id !== userOrgId) {
				console.error('[Save ID Card] Security violation: Cross-organization template usage attempt', {
					userOrgId,
					templateOrgId: template.org_id
				});
				return fail(403, { error: 'Unauthorized: Template does not belong to your organization' });
			}

			// Use the USER's org_id (which we now know matches template.org_id or is the only context)
			const effectiveOrgId = userOrgId || template.org_id;
			
			console.log('[Save ID Card] Using org_id:', {
				userOrgId,
				templateOrgId: template.org_id,
				effectiveOrgId
			});

			if (!effectiveOrgId) {
				console.log('[Save ID Card] No organization ID found');
				return fail(400, { error: 'Organization ID is required' });
			}

			const uploadResult = await handleImageUploads(supabase, formData, effectiveOrgId, templateId);

			console.log('[Save ID Card] Upload result:', {
				success: !('error' in uploadResult),
				error: 'error' in uploadResult ? uploadResult.error : null,
				paths: !('error' in uploadResult)
					? {
							front: uploadResult.frontPath,
							back: uploadResult.backPath
						}
					: null
			});

			if ('error' in uploadResult) {
				console.error('[Save ID Card] Upload error:', uploadResult.error);
				return fail(500, { error: 'Failed to upload images' });
			}

			// Save ID card data
			console.log('[Save ID Card] Saving ID card data...');

			// Log all form data for debugging
			console.log('[Save ID Card] All form data:', Array.from(formData.entries()));

			// Collect form fields as simple key-value pairs
			const excludedKeys = ['templateId', 'frontImage', 'backImage'];
			const formFields: Record<string, string> = {};
			for (const [key, value] of formData.entries()) {
				if (!excludedKeys.includes(key)) {
					formFields[key] = value.toString();
				}
			}

			console.log('[Save ID Card] Form fields:', formFields);

			const createDigitalCard = formData.get('createDigitalCard') === 'true';

			const { data: idCard, digitalCard, claimCode, error: saveError } = await saveIdCardData(supabase, {
				templateId,
				orgId: effectiveOrgId,
				frontPath: uploadResult.frontPath,
				backPath: uploadResult.backPath,
				formFields,
				createDigitalCard,
				userId: locals.session?.user?.id
			});

			console.log('[Save ID Card] Save result:', {
				success: !!idCard,
				error: saveError,
				idCardId: idCard?.id,
				digitalCardSlug: digitalCard?.slug
			});

			if (saveError) {
				console.error('[Save ID Card] Save error:', saveError);
				return fail(500, { error: 'Failed to save ID card' });
			}

			console.log('[Save ID Card] Successfully saved ID card:', {
				idCardId: idCard?.id,
				frontPath: uploadResult.frontPath,
				backPath: uploadResult.backPath,
				hasDigitalCard: !!digitalCard
			});

			// Return success response
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
			if (err instanceof Error) {
				console.error('[Save ID Card] Error details:', {
					name: err.name,
					message: err.message,
					stack: err.stack
				});
			}
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
