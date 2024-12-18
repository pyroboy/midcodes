import { error, fail, redirect } from '@sveltejs/kit';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile } from '$lib/types/roleEmulation';
import type { Session } from '../../../../app';
import { handleImageUploads, saveIdCardData, deleteFromStorage } from '$lib/utils/idCardHelpers';
import type { PageServerLoad, Actions } from './$types';

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

interface SuccessAuthResult {
    success: true;
    session: Session;
    profile: ProfileData | EmulatedProfile;
    userRole: UserRole;
}

interface FailAuthResult {
    success: false;
    code: number;
    error: string;
}

type AuthResult = SuccessAuthResult | FailAuthResult;

async function checkAuth({ 
    safeGetSession, 
    action = 'access',
    returnFail = false
}: { 
    safeGetSession: () => Promise<{
        session: Session | null;
        user: User | null;
        profile: ProfileData | EmulatedProfile | null;
    }>;
    action?: string;
    returnFail?: boolean;
}): Promise<AuthResult> {
    console.log(`[${action}] Starting auth check`);
    const { session, profile } = await safeGetSession();
    
    console.log(`[${action}] Session:`, {
        hasSession: !!session,
        userId: session?.user?.id,
        hasRoleEmulation: !!session?.roleEmulation
    });

    if (!session) {
        console.log(`[${action}] No session found`);
        const result: FailAuthResult = { 
            success: false, 
            code: 401, 
            error: 'Unauthorized' 
        };
        if (returnFail) {
            return result;
        }
        throw error(result.code, result.error);
    }

    if (!profile) {
        console.log(`[${action}] No profile found`);
        const result: FailAuthResult = { 
            success: false, 
            code: 400, 
            error: 'Profile not found' 
        };
        if (returnFail) {
            return result;
        }
        throw error(result.code, result.error);
    }

    const userRole = profile.role as UserRole;
    console.log(`[${action}] User profile:`, {
        role: userRole,
        orgId: profile.org_id,
        emulation: session.roleEmulation
    });
    
    // Check if user has appropriate role (super_admin or id_gen_*)
    if (userRole !== 'super_admin' && !userRole.startsWith('id_gen')) {
        console.log(`[${action}] Insufficient permissions:`, { userRole });
        const result: FailAuthResult = { 
            success: false, 
            code: 403, 
            error: 'Insufficient permissions' 
        };
        if (returnFail) {
            return result;
        }
        throw error(result.code, result.error);
    }

    const result: SuccessAuthResult = { 
        success: true, 
        session, 
        profile, 
        userRole 
    };
    return result;
}

export const load = (async ({ 
    params,
    locals: { supabase, safeGetSession }
}: {
    params: { id: string };
    locals: {
        supabase: SupabaseClient;
        safeGetSession: () => Promise<{
            session: Session | null;
            user: User | null;
            profile: ProfileData | EmulatedProfile | null;
        }>;
    };
}) => {
    console.log('[Use Template Load] Starting with params:', params);
    
    const authResult = await checkAuth({ safeGetSession, action: 'Use Template Load' });
    if (!authResult.success) {
        throw error(authResult.code, authResult.error);
    }

    const { session, profile, userRole } = authResult;

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
        // Get the effective organization ID (either emulated or actual)
        const effectiveOrgId = session?.roleEmulation?.active ? 
            session.roleEmulation.emulated_org_id : 
            profile.org_id;

        // id_gen_admin must have an org_id
        if (userRole === 'id_gen_admin' && !effectiveOrgId) {
            console.log('[Use Template] Organization check:', {
                userRole,
                hasOrgId: false,
                emulated: !!session?.roleEmulation?.active,
                reason: 'id_gen_admin requires organization'
            });
            throw error(403, 'Access denied - Organization required for id_gen_admin role');
        }

        console.log('[Use Template] Checking organization access:', {
            userRole,
            templateOrgId: template.org_id,
            userOrgId: effectiveOrgId,
            emulated: !!session?.roleEmulation?.active
        });

        if (template.org_id !== effectiveOrgId) {
            throw error(403, '1 You do not have access to this template');
        }
    } else {
        console.log('[Use Template] Skipping organization check:', {
            userRole,
            hasOrgId: !!profile.org_id,
            emulated: !!session?.roleEmulation?.active,
            reason: 'super_admin'
        });
    }

    return {
        template
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    saveIdCard: async ({ request, locals: { supabase, safeGetSession } }: {
        request: Request;
        locals: {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{
                session: Session | null;
                user: User | null;
                profile: ProfileData | EmulatedProfile | null;
            }>;
        };
    }) => {
        console.log('[Save ID Card] Starting save process...');
        
        try {
            const authResult = await checkAuth({ 
                safeGetSession, 
                action: 'Save ID Card',
                returnFail: true 
            });
            
            if (!authResult.success) {
                return fail(authResult.code, { error: authResult.error });
            }

            const { session, profile, userRole } = authResult;
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

            // Check organization access for non-super-admin roles
            if (userRole !== 'super_admin') {
                // Get the effective organization ID (either emulated or actual)
                const effectiveOrgId = session?.roleEmulation?.active ? 
                    session.roleEmulation.emulated_org_id : 
                    profile.org_id || '';

                // id_gen_admin must have an org_id
                if (userRole === 'id_gen_admin' && !effectiveOrgId) {
                    console.log('[Save ID Card] Organization check:', {
                        userRole,
                        hasOrgId: false,
                        emulated: !!session?.roleEmulation?.active,
                        reason: 'id_gen_admin requires organization'
                    });
                    return fail(403, { error: 'Access denied - Organization required for id_gen_admin role' });
                }

                const templateOrgId = template.org_id || '';
                
                console.log('[Save ID Card] Checking organization access:', {
                    userRole,
                    templateOrgId,
                    effectiveOrgId,
                    emulated: !!session?.roleEmulation?.active
                });

                // Allow access if either both are empty or they match
                const hasAccess = 
                    (templateOrgId === '' && effectiveOrgId === '') || 
                    (templateOrgId === effectiveOrgId);
                    
                if (!hasAccess) {
                    return fail(403, { error: '2 You do not have access to this template' });
                }
            } else {
                console.log('[Save ID Card] Skipping organization check:', {
                    userRole,
                    hasOrgId: !!profile.org_id,
                    emulated: !!session?.roleEmulation?.active,
                    reason: 'super_admin'
                });
            }

            // Handle image uploads
            console.log('[Save ID Card] Processing image uploads...');
            const effectiveOrgId = (session?.roleEmulation?.active ? 
                session.roleEmulation.emulated_org_id : 
                profile.org_id) ?? '';

            console.log('[Save ID Card] Organization resolution:', {
                effectiveOrgId,
                fromEmulation: session?.roleEmulation?.active,
                emulatedOrgId: session?.roleEmulation?.emulated_org_id,
                profileOrgId: profile.org_id
            });

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
            const formFields: Record<string, string> = {};
            for (const [key, value] of formData.entries()) {
                // Only include form_ prefixed fields and convert them to strings
                if (key.startsWith('form_')) {
                    const fieldName = key.replace('form_', '');
                    formFields[fieldName] = value.toString();
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