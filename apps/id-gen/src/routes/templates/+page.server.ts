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

// Function to determine orientation from image dimensions
async function getImageOrientation(imageUrl: string): Promise<'landscape' | 'portrait'> {
    try {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await new Promise(resolve => img.onload = resolve);
        const width = img.width;
        const height = img.height;
        URL.revokeObjectURL(url);
        return width >= height ? 'landscape' : 'portrait';
    } catch (err) {
        console.error('Error determining image orientation:', err);
        return 'landscape'; // default fallback
    }
}

export const load: PageServerLoad = async ({ locals }) => {
    const { session, supabase, org_id } = locals;
    console.log(' [Templates Page] ====== START LOAD ======');

    // Authentication check
    if (!session) {
        console.log(' [Templates Page] No session found, redirecting to auth');
        throw redirect(303, '/auth');
    }

    try {
        // Build the base query with all needed fields
        console.log(' [Templates Page] Querying templates for org_id:', org_id);
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
            .eq('org_id', org_id)
            .order('created_at', { ascending: false });

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
            user: session.user,
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

export const actions = {
    create: async ({ request, locals}) => {
        const { supabase, session, org_id } = locals;

        try {
            const formData = await request.formData();
            const templateDataStr = formData.get('templateData') as string;

            if (!templateDataStr) {
                throw error(400, 'Template data is required');
            }

            const templateData = JSON.parse(templateDataStr);

            // Set the org_id and user_id from the session
            templateData.user_id = session?.user?.id;
            templateData.org_id = org_id;

            console.log('🎨 Server: Processing template save:', {
                id: templateData.id,
                name: templateData.name,
                org_id: templateData.org_id,
                elementsCount: templateData.template_elements?.length
            });

            // Set the user_id from the session

            const { data, error: dbError } = await supabase
                .from('templates')
                .upsert(templateData)
                .select()
                .single();

            if (dbError) {
                console.error('❌ Server: Database error:', dbError);
                throw error(500, 'Error saving template');
            }

            if (!data) {
                throw error(500, 'No data returned from database');
            }

            console.log('✅ Server: Template saved successfully:', {
                id: data.id,
                name: data.name,
                org_id: data.org_id,
                elementsCount: data.template_elements?.length,
                action: templateData.id ? 'updated' : 'created'
            });

            return {
                success: true,
                data,
                message: `Template ${templateData.id ? 'updated' : 'created'} successfully`
            };
        } catch (err) {
            console.error('❌ Server: Error in create action:', err);
            throw error(
                err instanceof Error && err.message.includes('400') ? 400 : 500,
                err instanceof Error ? err.message : 'Error processing template save'
            );
        }
    },
    
    delete: async ({ request, locals: { supabase, session } }) => {
        if (!session) {
            throw error(401, 'Unauthorized');
        }

        try {
            const formData = await request.formData();
            const templateId = formData.get('templateId') as string;

            if (!templateId) {
                throw error(400, 'Template ID is required');
            }

            console.log('🗑️ Server: Processing template delete:', { templateId });

            // First, update ID cards that use this template
            const { error: updateError } = await supabase
                .from('idcards')
                .update({ template_id: null })
                .eq('template_id', templateId);

            if (updateError) {
                console.error('❌ Server: Error updating ID cards:', updateError);
                throw error(500, 'Error updating ID cards');
            }

            // Then delete the template, ensuring it belongs to the user
            const { error: deleteError } = await supabase
                .from('templates')
                .delete()
                .match({ id: templateId })
                .eq('user_id', session.user.id);

            if (deleteError) {
                console.error('❌ Server: Database error:', deleteError);
                throw error(500, 'Error deleting template');
            }

            console.log('✅ Server: Template deleted successfully:', { templateId });

            return {
                success: true,
                message: 'Template deleted successfully'
            };
        } catch (err) {
            console.error('❌ Server: Error in delete action:', err);
            throw error(
                err instanceof Error && err.message.includes('400') ? 400 : 500,
                err instanceof Error ? err.message : 'Error deleting template'
            );
        }
    },
    select: async ({ request, locals: { supabase, session } }) => {
        if (!session) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const templateId = formData.get('id');

        if (!templateId) {
            throw error(400, 'Template ID is required');
        }

        const { data: template, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (templateError) {
            console.error('Error fetching template:', templateError);
            throw error(500, 'Failed to fetch template');
        }

        if (!template) {
            throw error(404, 'Template not found');
        }

        return { template };
    },
};