import { error, fail, redirect } from '@sveltejs/kit';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile } from '$lib/types/roleEmulation';
import type { Session } from '../../../../app';
import { handleImageUploads, saveIdCardData, deleteFromStorage } from '$lib/utils/idCardHelpers';

interface ParentData {
    session: any;
    user: any;
    profile: any;
    organizations: any[];
    currentOrg: any | null;
}

interface Template {
    id: string;
    user_id: string;
    org_id: string | null;
    name: string;
    front_background: string;
    back_background: string;
    orientation: 'landscape' | 'portrait';
    created_at: string;
    updated_at: string;
    template_elements: {
        id: string;
        type: 'text' | 'photo' | 'signature' | 'selection';
        side: 'front' | 'back';
        variableName: string;
        content?: string;
        width?: number;
        height?: number;
    }[];
    organizations?: {
        id: string;
        name: string;
    };
}

type UserRole = 'super_admin' | 'org_admin' | 'id_gen_admin' | 'id_gen_user';

interface PageServerLoad {
    ({ locals, params }: {
        locals: {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{
                session: Session | null;
                user: User | null;
                profile: ProfileData | EmulatedProfile | null;
            }>;
            user: User | null;
            profile: ProfileData | EmulatedProfile | null;
        };
        params: { id: string };
    }): Promise<{ template: any }>;
}

interface Actions {
    saveIdCard: (event: {
        request: Request;
        locals: {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{
                session: Session | null;
                user: User | null;
                profile: ProfileData | EmulatedProfile | null;
            }>;
            user: User | null;
            profile: ProfileData | EmulatedProfile | null;
        };
    }) => Promise<any>;
}

export const load = (async ({ params, locals: { supabase, safeGetSession, user, profile } }) => {
    const { session } = await safeGetSession();
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    if (!profile) {
        throw error(400, 'Profile not found');
    }

    // Get organization ID from emulated profile or regular profile
    const orgId = (profile as EmulatedProfile).isEmulated 
        ? session.roleEmulation?.emulated_org_id || profile.org_id
        : profile.org_id;

    if (!orgId) {
        console.log(' [Use Template] No organization ID found:', {
            isEmulated: (profile as EmulatedProfile).isEmulated,
            profileOrgId: profile.org_id,
            emulatedOrgId: session.roleEmulation?.emulated_org_id
        });
        throw error(400, 'Organization ID is required');
    }

    const userRole = profile.role;
    
    // Check if user has appropriate role (super_admin or id_gen_*)
    if (userRole !== 'super_admin' && !userRole.startsWith('id_gen')) {
        throw error(403, 'Insufficient permissions');
    }

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

    // Check organization access for non-super-admin roles
    if (userRole !== 'super_admin') {
        console.log(' [Use Template] Checking organization access:', {
            userRole,
            templateOrgId: template.org_id,
            userOrgId: orgId
        });

        if (template.org_id !== orgId) {
            throw error(403, 'You do not have access to this template');
        }
    } else {
        console.log(' [Use Template] Skipping organization check for super_admin');
    }

    return {
        template
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    saveIdCard: async ({ request, locals: { supabase, safeGetSession, user, profile } }) => {
        console.log(' [Save ID Card] Starting save process...');
        
        try {
            const { session } = await safeGetSession();
            if (!session) {
                console.log(' [Save ID Card] No session found');
                return fail(401, { error: 'Unauthorized' });
            }

            if (!profile) {
                console.log(' [Save ID Card] No profile found');
                return fail(400, { error: 'Profile not found' });
            }

            // Get organization ID from emulated profile or regular profile
            const orgId = (profile as EmulatedProfile).isEmulated 
                ? session.roleEmulation?.emulated_org_id || profile.org_id
                : profile.org_id;

            if (!orgId) {
                console.log(' [Save ID Card] No organization ID found:', {
                    isEmulated: (profile as EmulatedProfile).isEmulated,
                    profileOrgId: profile.org_id,
                    emulatedOrgId: session.roleEmulation?.emulated_org_id
                });
                return fail(400, { error: 'Organization ID is required' });
            }

            const formData = await request.formData();
            console.log(' [Save ID Card] Form data received:', {
                fields: Array.from(formData.keys()),
                hasFiles: Array.from(formData.keys()).some(key => formData.get(key) instanceof File)
            });

            // Extract form fields
            const formFields: Record<string, string> = {};
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('form_') && typeof value === 'string') {
                    formFields[key.replace('form_', '')] = value;
                }
            }

            console.log(' [Save ID Card] Extracted form fields:', {
                count: Object.keys(formFields).length,
                fields: Object.keys(formFields)
            });

            const templateId = formData.get('templateId')?.toString();
            if (!templateId) {
                console.log(' [Save ID Card] No template ID provided');
                return fail(400, { error: 'Template ID is required' });
            }

            const userRole = profile.role;
            
            // Check if user has appropriate role (super_admin or id_gen_*)
            if (userRole !== 'super_admin' && !userRole.startsWith('id_gen')) {
                console.log(' [Save ID Card] Insufficient permissions:', { userRole });
                return fail(403, { error: 'Insufficient permissions' });
            }

            // Verify template access
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('org_id, organizations(*)')
                .eq('id', templateId)
                .single();

            if (templateError || !template) {
                console.log(' [Save ID Card] Template not found:', {
                    error: templateError,
                    templateId
                });
                return fail(404, { error: 'Template not found' });
            }

            // Check organization access for non-super-admin roles
            if (userRole !== 'super_admin') {
                console.log(' [Save ID Card] Checking organization access:', {
                    userRole,
                    templateOrgId: template.org_id,
                    userOrgId: orgId
                });

                if (template.org_id !== orgId) {
                    return fail(403, { error: 'You do not have access to this template' });
                }
            }

            // Handle image uploads
            console.log(' [Save ID Card] Processing image uploads...');
            const uploadResult = await handleImageUploads(
                supabase,
                formData,
                orgId,
                templateId
            );

            if (uploadResult.error) {
                console.error(' [Save ID Card] Upload error:', uploadResult.error);
                return fail(500, { error: uploadResult.error });
            }

            // Save ID card data
            console.log(' [Save ID Card] Saving ID card data:', {
                templateId,
                orgId,
                formFields
            });

            const { data: idCard, error: saveError } = await saveIdCardData(supabase, {
                templateId,
                orgId,
                frontPath: uploadResult.frontPath,
                backPath: uploadResult.backPath,
                formFields
            });

            if (saveError) {
                console.error(' [Save ID Card] Save error:', saveError);
                // Clean up uploaded images if data save fails
                await Promise.all([
                    deleteFromStorage(supabase, 'rendered-id-cards', uploadResult.frontPath),
                    deleteFromStorage(supabase, 'rendered-id-cards', uploadResult.backPath)
                ]);
                return fail(500, { error: 'Failed to save ID card' });
            }

            console.log(' [Save ID Card] Successfully saved ID card:', {
                idCardId: idCard?.id,
                frontPath: uploadResult.frontPath,
                backPath: uploadResult.backPath
            });

            return { success: true };
            
        } catch (error) {
            console.error(' [Save ID Card] Unexpected error:', error);
            return fail(500, { error: 'An unexpected error occurred' });
        }
    }
};