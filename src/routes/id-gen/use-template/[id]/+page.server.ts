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

    const userRole = profile.role;
    const orgId = profile.org_id;
    
    // Check role-specific access - all roles that can use templates
    const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
    if (!allowedRoles.includes(userRole)) {
        throw error(403, 'Insufficient permissions');
    }

    const templateId = params.id;
    
    // Fetch the template
    const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (templateError || !template) {
        throw error(404, 'Template not found');
    }

    // Check organization access for non-super-admin roles
    if (userRole !== 'super_admin' && template.org_id !== orgId) {
        throw error(403, 'You do not have access to this template');
    }

    return {
        template
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
    saveIdCard: async ({ request, locals: { supabase, safeGetSession, user, profile } }) => {
        const { session } = await safeGetSession();
        if (!session) {
            return fail(401, { error: 'Unauthorized' });
        }

        if (!profile) {
            return fail(400, { error: 'Profile not found' });
        }

        const userRole = profile.role;
        const orgId = profile.org_id;

        // All roles with template access can save ID cards
        const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
        if (!allowedRoles.includes(userRole)) {
            return fail(403, { error: 'Insufficient permissions' });
        }

        try {
            const formData = await request.formData();
            const templateId = formData.get('templateId') as string;

            // Verify template access
            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('org_id')
                .eq('id', templateId)
                .single();

            if (templateError || !template) {
                return fail(404, { error: 'Template not found' });
            }

            // Check organization access for non-super-admin roles
            if (userRole !== 'super_admin' && template.org_id !== orgId) {
                return fail(403, { error: 'You do not have access to this template' });
            }

            // Handle image uploads
            const uploadResult = await handleImageUploads(
                supabase,
                formData,
                orgId || '',
                templateId
            );

            if ('error' in uploadResult) {
                return fail(500, { error: uploadResult.error });
            }

            // Save ID card data
            const { data: idCard, error: saveError } = await saveIdCardData(supabase, {
                templateId,
                orgId: orgId || '',
                frontPath: uploadResult.frontPath,
                backPath: uploadResult.backPath,
                formFields: {}
            });

            if (saveError) {
                // Clean up uploaded images if data save fails
                await Promise.all([
                    deleteFromStorage(supabase, 'rendered-id-cards', uploadResult.frontPath),
                    deleteFromStorage(supabase, 'rendered-id-cards', uploadResult.backPath)
                ]);
                return fail(500, { error: 'Failed to save ID card data' });
            }

            return { success: true, data: idCard };
        } catch (err) {
            console.error('Error in saveIdCard:', err);
            return fail(500, {
                error: err instanceof Error ? err.message : 'An unexpected error occurred'
            });
        }
    }
};