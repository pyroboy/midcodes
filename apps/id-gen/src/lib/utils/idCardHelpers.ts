import type { SupabaseClient } from '@supabase/supabase-js';

export interface ImageUploadResult {
    frontPath: string;
    backPath: string;
    error?: string;
}

export interface ImageUploadError {
    error: string;
    frontPath?: never;
    backPath?: never;
}

export async function handleImageUploads(
    supabase: SupabaseClient,
    formData: FormData,
    orgId: string,
    templateId: string
): Promise<ImageUploadResult | ImageUploadError> {
    try {
        const frontImage = formData.get('frontImage') as Blob;
        const backImage = formData.get('backImage') as Blob;

        if (!frontImage || !backImage) {
            return { error: 'Missing image files' };
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
            return { error: 'Front image upload failed' };
        }

        const backUpload = await uploadToStorage(supabase, {
            bucket: 'rendered-id-cards',
            file: backImage,
            path: backPath
        });

        if (backUpload.error) {
            await deleteFromStorage(supabase, 'rendered-id-cards', frontPath);
            return { error: 'Back image upload failed' };
        }

        return { frontPath, backPath };
    } catch (err) {
        return { 
            error: err instanceof Error ? err.message : 'Failed to handle image uploads'
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
