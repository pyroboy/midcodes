import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface TemplateElement {
    id: string;
    type: 'text' | 'photo' | 'signature';
    side: 'front' | 'back';
    variableName: string;
    content?: string;
    width?: number;
    height?: number;
}

interface Template {
    id: string;
    user_id: string;
    name: string;
    front_background: string;
    back_background: string;
    orientation: 'landscape' | 'portrait';
    created_at: string;
    updated_at: string;
    template_elements: TemplateElement[];
}

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw error(401, 'Unauthorized access');

    const { data: templates, error: templateError } = await supabase
        .from('templates')
        .select()
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

    if (templateError) throw error(500, 'Failed to fetch template');
    if (!templates) throw error(404, 'Template not found');

    return { template: templates as Template };
};

export const actions: Actions = {
    saveIdCard: async ({ request, locals: { supabase } }) => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return fail(401, { message: 'Authentication required' });

        try {
            const formData = await request.formData();
            const frontBlob = formData.get('front') as Blob;
            const backBlob = formData.get('back') as Blob;
            const templateId = formData.get('templateId') as string;
            const formDataJson = formData.get('data') as string;

            if (!frontBlob || !backBlob || !templateId || !formDataJson) {
                return fail(400, { message: 'Missing required fields' });
            }

            const timestamp = Date.now();
            const frontPath = `${user.id}/${templateId}/${timestamp}_front.png`;
            const backPath = `${user.id}/${templateId}/${timestamp}_back.png`;

            const { data: frontData, error: frontError } = await uploadToStorage(supabase, {
                bucket: 'rendered-id-cards',
                file: frontBlob,
                path: frontPath
            });

            if (frontError || !frontData) {
                return fail(500, { message: 'Front image upload failed' });
            }

            const { data: backData, error: backError } = await uploadToStorage(supabase, {
                bucket: 'rendered-id-cards',
                file: backBlob,
                path: backPath
            });

            if (backError || !backData) {
                await deleteFromStorage(supabase, 'rendered-id-cards', frontPath);
                return fail(500, { message: 'Back image upload failed' });
            }

            const { error: insertError } = await supabase
                .from('idcards')
                .insert({
                    template_id: templateId,
                    front_image: frontData.path,
                    back_image: backData.path,
                    data: JSON.parse(formDataJson),
                    user_id: user.id
                });

            if (insertError) {
                await Promise.all([
                    deleteFromStorage(supabase, 'rendered-id-cards', frontPath),
                    deleteFromStorage(supabase, 'rendered-id-cards', backPath)
                ]);
                return fail(500, { message: 'Failed to save ID card data' });
            }

            return {
                status: 200,
                body: {
                    message: 'ID card saved successfully',
                    frontImage: frontData.path,
                    backImage: backData.path
                }
            };
        } catch (err) {
            return fail(500, { 
                message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    }
};

async function uploadToStorage(
    supabase: SupabaseClient,
    {
        bucket,
        file,
        path,
        options = {}
    }: {
        bucket: string;
        file: Blob;
        path: string;
        options?: {
            cacheControl?: string;
            contentType?: string;
            upsert?: boolean;
        };
    }
) {
    return await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: options.cacheControl || '3600',
            contentType: options.contentType || 'image/png',
            upsert: options.upsert ?? true
        });
}

async function deleteFromStorage(
    supabase: SupabaseClient,
    bucket: string,
    path: string
): Promise<void> {
    await supabase.storage.from(bucket).remove([path]);
}