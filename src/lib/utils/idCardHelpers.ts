import type { SupabaseClient } from '@supabase/supabase-js';

export async function handleImageUploads(
    supabase: SupabaseClient,
    formData: FormData,
    orgId: string,
    templateId: string
): Promise<{ frontPath: string; backPath: string; error?: string }> {
    try {
        console.log(' [Image Upload] Starting upload process...');
        const frontImage = formData.get('frontImage') as Blob;
        const backImage = formData.get('backImage') as Blob;

        if (!frontImage || !backImage) {
            console.error(' [Image Upload] Missing image files');
            return { error: 'Missing image files', frontPath: '', backPath: '' };
        }

        const timestamp = Date.now();
        const frontPath = `${orgId}/${templateId}/${timestamp}_front.png`;
        const backPath = `${orgId}/${templateId}/${timestamp}_back.png`;

        console.log(' [Image Upload] Uploading front image...');
        const frontUpload = await uploadToStorage(supabase, {
            bucket: 'rendered-id-cards',
            file: frontImage,
            path: frontPath
        });

        if (frontUpload.error) {
            console.error(' [Image Upload] Front image upload failed:', frontUpload.error);
            return { error: 'Front image upload failed', frontPath: '', backPath: '' };
        }

        console.log(' [Image Upload] Uploading back image...');
        const backUpload = await uploadToStorage(supabase, {
            bucket: 'rendered-id-cards',
            file: backImage,
            path: backPath
        });

        if (backUpload.error) {
            console.error(' [Image Upload] Back image upload failed:', backUpload.error);
            await deleteFromStorage(supabase, 'rendered-id-cards', frontPath);
            return { error: 'Back image upload failed', frontPath: '', backPath: '' };
        }

        console.log(' [Image Upload] Upload successful:', { frontPath, backPath });
        return { frontPath, backPath };
    } catch (err) {
        console.error(' [Image Upload] Unexpected error:', err);
        return { 
            error: err instanceof Error ? err.message : 'Failed to handle image uploads',
            frontPath: '',
            backPath: ''
        };
    }
}

export async function saveIdCardData(
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
    try {
        const { data, error } = await supabase
            .from('idcards')
            .insert({
                template_id: templateId,
                org_id: orgId,
                front_image: frontPath,
                back_image: backPath,
                data: formFields
            })
            .select()
            .single();

        if (error) {
            await Promise.all([
                deleteFromStorage(supabase, 'rendered-id-cards', frontPath),
                deleteFromStorage(supabase, 'rendered-id-cards', backPath)
            ]);
            return { error };
        }

        return { data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to save ID card data' };
    }
}

export async function deleteFromStorage(
    supabase: SupabaseClient,
    bucket: string,
    path: string
): Promise<{ error?: string }> {
    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            return { error: error.message };
        }
        return {};
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to delete from storage' };
    }
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
