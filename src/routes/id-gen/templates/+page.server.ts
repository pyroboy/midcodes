import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Define types for better type safety and documentation
interface Profile {
    role?: string;
    org_id?: string;
}

interface Template {
    id: string;
    name: string;
    user_id: string;
    org_id?: string;
    orientation: 'landscape' | 'portrait';
    front_background: string;
    back_background: string;
    template_elements: any[];
    created_at: string;
}

// Custom error class with code
class AppError extends Error {
    code: string;
    constructor(message: string, code: string) {
        super(message);
        this.code = code;
        this.name = 'AppError';
    }
}

export const load: PageServerLoad = async ({ locals: { supabase, session, profile } }) => {
    console.log(' [Templates Page] ====== START LOAD ======');
    console.log(' [Templates Page] Current state:', {
        hasSession: !!session,
        hasProfile: !!profile,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        role: profile?.role,
        orgId: profile?.org_id
    });

    // Authentication check
    if (!session) {
        console.log(' [Templates Page] No session found, redirecting to auth');
        throw redirect(303, '/auth');
    }

    // Authorization check - verify user has id_gen role
    if (!profile?.role?.startsWith('id_gen')) {
        console.log(' [Templates Page] Unauthorized role:', {
            role: profile?.role,
            userId: session.user.id
        });
        throw error(403, 'Unauthorized - Incorrect user role');
    }

    try {
        console.log(' [Templates Page] Building query with filters:', {
            isSuperAdmin: profile.role === 'super_admin',
            orgId: profile.org_id
        });

        // Build the base query with all needed fields
        let templatesQuery = supabase
            .from('templates')
            .select(`
                id,
                name,
                user_id,
                org_id,
                orientation,
                created_at,
                front_background,
                back_background,
                template_elements
            `)
            .order('created_at', { ascending: false });

        // Apply organization filter if not super_admin
        if (profile.role !== 'super_admin' && profile.org_id) {
            console.log(' [Templates Page] Applying org filter:', profile.org_id);
            templatesQuery = templatesQuery.eq('org_id', profile.org_id);
        }

        // Execute the query
        console.log(' [Templates Page] Executing database query...');
        const { data: templates, error: templatesError } = await templatesQuery;

        // Handle query errors
        if (templatesError) {
            console.error(' [Templates Page] Database error:', {
                error: templatesError,
                details: templatesError.details,
                hint: templatesError.hint,
                code: templatesError.code
            });
            throw error(500, 'Error loading templates from database');
        }

        // Log success and return the data
        console.log(' [Templates Page] Query successful:', {
            totalTemplates: templates?.length || 0,
            firstTemplateId: templates?.[0]?.id || 'no templates',
            hasTemplateElements: templates?.[0]?.template_elements ? 'yes' : 'no'
        });

        console.log(' [Templates Page] Template sample:', templates?.[0] ? {
            id: templates[0].id,
            name: templates[0].name,
            elementsCount: templates[0].template_elements?.length || 0
        } : 'no templates');

        const response = {
            templates: templates || [],
            user: {
                id: session.user.id,
                role: profile.role,
                org_id: profile.org_id
            }
        };

        console.log(' [Templates Page] ====== END LOAD ======');
        return response;

    } catch (e) {
        // Log any unexpected errors
        console.error(' [Templates Page] Unexpected error:', {
            error: e,
            message: e instanceof Error ? e.message : 'Unknown error',
            stack: e instanceof Error ? e.stack : undefined
        });
        throw error(500, 'An unexpected error occurred while loading templates');
    }
};