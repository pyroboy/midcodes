import { error, fail, redirect } from '@sveltejs/kit';
import { handleImageUploads, saveIdCardData, deleteFromStorage } from '$lib/utils/idCardHelpers';
import type { PageServerLoad, Actions } from './$types';



export const load: PageServerLoad = async ({ params,locals }) => {
    console.log('[Use Template Load] Starting with params:', params);
    
    const { supabase, safeGetSession } = locals;

    // const authResult = await checkAuth({ safeGetSession, action: 'Use Template Load' });
    // if (!authResult.success) {
    //     throw error(authResult.code, authResult.error);
    // }

    // const { session, profile, userRole } = authResult;

    const templateId = params.id;
    console.log(' [Use Template] Loading template:', { templateId });
    
    // Fetch the template with organization info
    const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*, organizations(*)')
        .eq('id', templateId)
        .single();

    console.log(' [Use Template] Template query result:', {
        hasTemplate: !!template,
        error: templateError?.message,
        templateData: template ? {
            id: template.id,
            name: template.name,
            org_id: template.org_id,
            elementsCount: template.template_elements?.length || 0
        } : null
    });

    if (templateError || !template) {
        console.error(' [Use Template] Failed to load template:', {
            error: templateError,
            templateId
        });
        throw error(404, 'Template not found');
    }

   

    return {
        template
    };
};

export const actions: Actions = {
    saveIdCard: async ({ request, locals: { supabase } }) => {
        console.log('[Save ID Card] Starting save process...');
        
        try {
  

            const formData = await request.formData();
            console.log('[Save ID Card] Form data received:', {
                fields: Array.from(formData.keys()),
                hasFiles: Array.from(formData.keys()).some(key => formData.get(key) instanceof File),
                templateId: formData.get('templateId')?.toString()
            });

            const templateId = formData.get('templateId')?.toString();
            if (!templateId) {
                console.log('[Save ID Card] No template ID provided');
                return fail(400, { error: 'Template ID is required' });
            }

            // Verify template access
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('org_id, organizations(*), template_elements')
                .eq('id', templateId)
                .single();

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

       

            // Handle image uploads
            console.log('[Save ID Card] Processing image uploads...');
            const effectiveOrgId = {} as string;



            if (!effectiveOrgId) {
                console.log('[Save ID Card] No organization ID found');
                return fail(400, { error: 'Organization ID is required' });
            }

            const uploadResult = await handleImageUploads(
                supabase,
                formData,
                effectiveOrgId,
                templateId
            );

            console.log('[Save ID Card] Upload result:', {
                success: !('error' in uploadResult),
                error: 'error' in uploadResult ? uploadResult.error : null,
                paths: !('error' in uploadResult) ? {
                    front: uploadResult.frontPath,
                    back: uploadResult.backPath
                } : null
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

            const { data: idCard, error: saveError } = await saveIdCardData(supabase, {
                templateId,
                orgId: effectiveOrgId,
                frontPath: uploadResult.frontPath,
                backPath: uploadResult.backPath,
                formFields
            });

            console.log('[Save ID Card] Save result:', {
                success: !!idCard,
                error: saveError,
                idCardId: idCard?.id
            });

            if (saveError) {
                console.error('[Save ID Card] Save error:', saveError);
                return fail(500, { error: 'Failed to save ID card' });
            }

            console.log('[Save ID Card] Successfully saved ID card:', {
                idCardId: idCard?.id,
                frontPath: uploadResult.frontPath,
                backPath: uploadResult.backPath
            });

            // Return success response
            return {
                type: 'success',
                data: [{
                    success: true,
                    idCardId: idCard?.id
                }]
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