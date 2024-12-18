import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
    const { supabase, session } = locals;
    console.log(' [Template API] Fetching template:', params.id);
    
    if (!session) {
        throw error(401, { message: 'Unauthorized' });
    }

    try {
        const { data, error: supabaseError } = await supabase
            .from('templates')
            .select(`
                id,
                user_id,
                name,
                front_background,
                back_background,
                orientation,
                template_elements,
                created_at
            `)
            .eq('id', params.id)
            .single();

        if (supabaseError) {
            console.error(' [Template API] Error fetching template:', supabaseError);
            throw error(500, { message: supabaseError.message || 'Error fetching template details' });
        }

        if (!data) {
            throw error(404, { message: 'Template not found' });
        }

        console.log(' [Template API] Template fetched successfully:', {
            id: data.id,
            name: data.name,
            elementsCount: data.template_elements?.length || 0
        });

        return json(data);
    } catch (err) {
        console.error(' [Template API] Unexpected error:', err);
        throw error(500, { message: 'An unexpected error occurred' });
    }
};
