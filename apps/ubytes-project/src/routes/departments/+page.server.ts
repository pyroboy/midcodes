import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface Department {
    id: number;
    department_name: string;
    department_acronym: string;
    department_logo: string | undefined;
    mascot_name: string;
    mascot_logo: string | undefined;
    updated_at: string;
    updated_by: string;
}

interface LogChanges {
    previous?: Partial<Department>;
    current?: Partial<Department>;
}

const departmentSchema = z.object({
    id: z.number().int().optional(),
    department_name: z.string().min(1, "Department name is required"),
    department_acronym: z.string().min(1, "Department acronym is required"),
    department_logo: z.string().nullable(),
    mascot_name: z.string().min(1, "Spirit Animal name is required"),
    mascot_logo: z.string().nullable(),
});

async function logActivity(
    supabase: SupabaseClient,
    userId: string | null,
    activity: string,
    changes?: LogChanges
) {
    const logEntry = {
        user_id: userId,
        activity,
        created_at: new Date().toISOString(),
        previous_data: changes?.previous || null,
        new_data: changes?.current || null
    };

    const { error } = await supabase
        .from('logging_activities')
        .insert(logEntry);

    if (error) console.error('Logging error:', error);
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const form = await superValidate(zod(departmentSchema));

    const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('*');

    if (departmentsError) console.error('Error fetching departments:', departmentsError);

    return { form, departments };
};

async function handleImageUpload(
    supabase: SupabaseClient,
    file: File | null,
    bucket: string,
    fieldName: string
): Promise<{ url: string | null; error?: string }> {
    if (!file || file.size === 0) {
        return { url: null };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { url: null, error: `${fieldName} must be less than 5MB` };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return { url: null, error: `Invalid file type for ${fieldName}. Use JPG, PNG, or WebP` };
    }

    try {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return { url: data.publicUrl };
    } catch (error) {
        console.error(`${fieldName} upload error:`, error);
        return { url: null, error: `Failed to upload ${fieldName}` };
    }
}

async function cleanupImage(supabase: SupabaseClient, url: string | null) {
    if (!url) return;
    try {
        if (url.includes('supabase.co')) {
            const bucket = url.includes('mascot-logos') ? 'mascot-logos' : 'department-logos';
            const fileName = url.split('/').pop();
            if (fileName) {
                await supabase.storage.from(bucket).remove([fileName]);
            }
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

export const actions: Actions = {
    create: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession();
        
        if (!session) {
            await logActivity(supabase, null, 'Unauthorized attempt to create department');
            return fail(403, { message: 'Not authorized' });
        }

        try {
            const formData = await request.formData();
            const form = await superValidate(formData, zod(departmentSchema));
            
            if (!form.valid) {
                await logActivity(supabase, session.user.id, 'Invalid form data submitted');
                return fail(400, { form });
            }

            const departmentFile = formData.get('imageFile') as File | null;
            const mascotFile = formData.get('mascotImageFile') as File | null;

            const [deptUpload, mascotUpload] = await Promise.all([
                handleImageUpload(supabase, departmentFile, 'department-logos', 'Department Logo'),
                handleImageUpload(supabase, mascotFile, 'mascot-logos', 'Spirit Animal Image')
            ]);

            if (deptUpload.error) {
                await logActivity(supabase, session.user.id, `Upload error: ${deptUpload.error}`);
                return fail(400, { form, message: deptUpload.error });
            }
            if (mascotUpload.error) {
                await logActivity(supabase, session.user.id, `Upload error: ${mascotUpload.error}`);
                return fail(400, { form, message: mascotUpload.error });
            }

            const newDepartment = {
                department_name: form.data.department_name,
                department_acronym: form.data.department_acronym,
                department_logo: deptUpload.url,
                mascot_name: form.data.mascot_name,
                mascot_logo: mascotUpload.url,
            };

            const { data, error: insertError } = await supabase
                .from('departments')
                .insert(newDepartment)
                .select()
                .single();

            if (insertError) {
                await Promise.all([
                    cleanupImage(supabase, deptUpload.url),
                    cleanupImage(supabase, mascotUpload.url)
                ]);
                await logActivity(supabase, session.user.id, `Failed to create department: ${insertError.message}`);
                return fail(500, { form, message: 'Failed to create department' });
            }

            await logActivity(
                supabase,
                session.user.id,
                `Created department: ${form.data.department_name}`,
                { current: data }
            );

            return { form };
        } catch (error) {
            console.error('Create error:', error);
            await logActivity(supabase, session.user.id, `Server error during department creation: ${error}`);
            return fail(500, { message: 'Server error' });
        }
    },

    update: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession();
        
        if (!session) {
            await logActivity(supabase, null, 'Unauthorized attempt to update department');
            return fail(403, { message: 'Not authorized' });
        }

        try {
            const formData = await request.formData();
            const form = await superValidate(formData, zod(departmentSchema));
            
            if (!form.valid) {
                await logActivity(supabase, session.user.id, 'Invalid form data submitted for department update');
                return fail(400, { form });
            }

            const id = form.data.id;
            if (!id) {
                await logActivity(supabase, session.user.id, 'Department ID missing for update');
                return fail(400, { form, message: 'Department ID required' });
            }

            const { data: existingDepartment } = await supabase
                .from('departments')
                .select()
                .eq('id', id)
                .single();

            const keepDeptLogo = formData.get('keepDepartmentLogo') === 'true';
            const keepMascotLogo = formData.get('keepMascotLogo') === 'true';
            const departmentFile = formData.get('imageFile') as File | null;
            const mascotFile = formData.get('mascotImageFile') as File | null;

            let departmentLogoUrl = null;
            if (keepDeptLogo && existingDepartment?.department_logo) {
                departmentLogoUrl = existingDepartment.department_logo;
            } else if (departmentFile) {
                const upload = await handleImageUpload(supabase, departmentFile, 'department-logos', 'Department Logo');
                if (upload.error) {
                    await logActivity(supabase, session.user.id, `Upload error: ${upload.error}`);
                    return fail(400, { form, message: upload.error });
                }
                departmentLogoUrl = upload.url;
                if (existingDepartment?.department_logo) await cleanupImage(supabase, existingDepartment.department_logo);
            }

            let mascotLogoUrl = null;
            if (keepMascotLogo && existingDepartment?.mascot_logo) {
                mascotLogoUrl = existingDepartment.mascot_logo;
            } else if (mascotFile) {
                const upload = await handleImageUpload(supabase, mascotFile, 'mascot-logos', 'Spirit Animal Image');
                if (upload.error) {
                    await logActivity(supabase, session.user.id, `Upload error: ${upload.error}`);
                    return fail(400, { form, message: upload.error });
                }
                mascotLogoUrl = upload.url;
                if (existingDepartment?.mascot_logo) await cleanupImage(supabase, existingDepartment.mascot_logo);
            }

            const updateData = {
                department_name: form.data.department_name,
                department_acronym: form.data.department_acronym,
                department_logo: departmentLogoUrl,
                mascot_name: form.data.mascot_name,
                mascot_logo: mascotLogoUrl,
                // updated_by: session.user.id
            };

            const { data: updatedDepartment, error: updateError } = await supabase
                .from('departments')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                await logActivity(supabase, session.user.id, `Failed to update department: ${updateError.message}`);
                return fail(500, { form, message: 'Update failed' });
            }

            await logActivity(
                supabase,
                session.user.id,
                `Updated department: ${form.data.department_name}`,
                {
                    previous: existingDepartment,
                    current: updatedDepartment
                }
            );

            return { form };
        } catch (error) {
            console.error('Update error:', error);
            await logActivity(supabase, session.user.id, `Server error during department update: ${error}`);
            return fail(500, { message: 'Server error' });
        }
    },

    delete: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession();
        
        if (!session) {
            await logActivity(supabase, null, 'Unauthorized attempt to delete department');
            return fail(403, { message: 'Not authorized' });
        }

        try {
            const formData = await request.formData();
            const id = formData.get('id');
            
            if (!id) {
                await logActivity(supabase, session.user.id, 'Invalid department ID for deletion');
                return fail(400, { message: 'Invalid request' });
            }

            const { data: existingDepartment } = await supabase
                .from('departments')
                .select()
                .eq('id', id)
                .single();

            const { error: deleteError } = await supabase
                .from('departments')
                .delete()
                .eq('id', id);

            if (deleteError) {
                await logActivity(
                    supabase, 
                    session.user.id, 
                    `Failed to delete department: ${deleteError.message}`
                );
                throw deleteError;
            }

            if (existingDepartment) {
                await Promise.all([
                    cleanupImage(supabase, existingDepartment.department_logo),
                    cleanupImage(supabase, existingDepartment.mascot_logo)
                ]);

                await logActivity(
                    supabase,
                    session.user.id,
                    `Deleted department: ${existingDepartment.department_name}`,
                    { previous: existingDepartment }
                );
            }

            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            await logActivity(supabase, session.user.id, `Server error during department deletion: ${error}`);
            return fail(500, { message: 'Delete failed' });
        }
    }
};