import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SupabaseClient, User } from '@supabase/supabase-js';

interface ParentData {
    session: User | null;
    user: User | null;
    profile: {
        id: string;
        role: UserRole;
        org_id: string | null;
    } | null;
    organizations: any[];
    currentOrg: any | null;
}

type UserRole = 'super_admin' | 'org_admin' | 'user';

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

export const load: PageServerLoad = async ({ params, locals, parent }) => {
    const { session, supabase } = locals;
    
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    const parentData = await parent() as ParentData;
    const isSuperAdmin = parentData?.profile?.role === 'super_admin';

    const { data: simpleTemplate, error: simpleError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', params.id)
        .single();

    if (simpleTemplate) {
        const { data: template, error: templateError } = await supabase
            .from('templates')
            .select(`
                *,
                organizations (
                    id,
                    name
                )
            `)
            .eq('id', params.id)
            .single();

        if (template) {
            return {
                template,
                session: session.user,
                profile: parentData?.profile
            };
        }
    }

    throw error(404, 'Template not found');
};

export const actions: Actions = {
    saveIdCard: async ({ request, locals: { supabase, session } }) => {
        if (!session) {
            return fail(401, { error: 'Unauthorized' });
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, org_id')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profileData) {
            return fail(400, {
                type: 'failure',
                data: { message: 'Failed to fetch user profile' }
            });
        }

        try {
            const formData = await request.formData();
            const templateId = formData.get('templateId')?.toString();

            if (!templateId) {
                return fail(400, {
                    type: 'failure',
                    data: { message: 'Template ID is required' }
                });
            }

            const { data: template, error: templateError } = await supabase
                .from('templates')
                .select('*, organizations(*)')
                .eq('id', templateId)
                .single();

            if (templateError || !template) {
                return fail(400, {
                    type: 'failure',
                    data: { message: 'Failed to fetch template' }
                });
            }

            const effectiveOrgId = template.org_id;
            if (!effectiveOrgId) {
                return fail(400, {
                    type: 'failure',
                    data: { message: 'Template has no organization' }
                });
            }

            if (profileData.role === 'org_admin' && profileData.org_id !== effectiveOrgId) {
                return fail(403, {
                    type: 'failure',
                    data: { message: 'You do not have permission to use this template' }
                });
            }

            const { frontPath, backPath } = await handleImageUploads(
                supabase,
                formData,
                effectiveOrgId,
                templateId
            );

            const formFields = extractFormFields(formData);
            await saveIdCardData(supabase, {
                templateId,
                orgId: effectiveOrgId,
                frontPath,
                backPath,
                formFields
            });

            return {
                type: 'success',
                data: {
                    message: 'ID Card generated successfully',
                    frontPath,
                    backPath,
                    organizationId: effectiveOrgId
                }
            };

        } catch (err) {
            return fail(500, {
                type: 'failure',
                data: {
                    message: err instanceof Error ? err.message : 'Failed to save ID card'
                }
            });
        }
    }
};

async function handleImageUploads(
    supabase: SupabaseClient,
    formData: FormData,
    orgId: string,
    templateId: string
) {
    const frontImage = formData.get('frontImage') as Blob;
    const backImage = formData.get('backImage') as Blob;

    if (!frontImage || !backImage) {
        throw new Error('Missing image files');
    }

    const timestamp = Date.now();
    const frontPath = `${orgId}/${templateId}/${timestamp}_front.png`;
    const backPath = `${orgId}/${templateId}/${timestamp}_back.png`;

    const frontUpload = await uploadToStorage(supabase, {
        bucket: 'rendered-id-cards',
        file: frontImage,
        path: frontPath
    });

    if (frontUpload.error) {
        throw new Error('Front image upload failed');
    }

    const backUpload = await uploadToStorage(supabase, {
        bucket: 'rendered-id-cards',
        file: backImage,
        path: backPath
    });

    if (backUpload.error) {
        await deleteFromStorage(supabase, 'rendered-id-cards', frontPath);
        throw new Error('Back image upload failed');
    }

    return { frontPath, backPath };
}

function extractFormFields(formData: FormData): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('form_')) {
            fields[key.replace('form_', '')] = value.toString();
        }
    }
    return fields;
}

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
            cacheControl: '3600',
            contentType: 'image/png',
            upsert: true,
            ...options
        });
}

async function saveIdCardData(
    supabase: SupabaseClient,
    {
        templateId,
        orgId,
        frontPath,
        backPath,
        formFields
    }: {
        templateId: string;
        orgId: string;
        frontPath: string;
        backPath: string;
        formFields: Record<string, string>;
    }
) {
    const { error: dbError } = await supabase
        .from('idcards')
        .insert({
            template_id: templateId,
            org_id: orgId,
            front_image: frontPath,
            back_image: backPath,
            data: formFields
        });

    if (dbError) {
        await Promise.all([
            deleteFromStorage(supabase, 'rendered-id-cards', frontPath),
            deleteFromStorage(supabase, 'rendered-id-cards', backPath)
        ]);
        throw new Error('Failed to save ID card data');
    }
}

async function deleteFromStorage(
    supabase: SupabaseClient,
    bucket: string,
    path: string
): Promise<void> {
    await supabase.storage.from(bucket).remove([path]);
}