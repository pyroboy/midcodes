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
    department_logo_variants: Record<string, string> | null;
    mascot_name: string;
    mascot_logo: string | undefined;
    mascot_logo_variants: Record<string, string> | null;
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


async function cleanupImage(supabase: SupabaseClient, url: string | null) {
    if (!url) return;
    try {
        if (!url.includes('storage/v1/object/public/')) return;
        
        const urlPath = new URL(url).pathname;
        const pathParts = urlPath.split('/');
        const bucket = pathParts[pathParts.length - 2];
        const fileName = pathParts[pathParts.length - 1];

        if (fileName && (bucket === 'mascot-logos' || bucket === 'department-logos')) {
            const { error } = await supabase.storage.from(bucket).remove([fileName]);
            if (error) console.error('File removal error:', error);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

async function cleanupImageVariants(supabase: SupabaseClient, variants: Record<string, string> | null) {
    if (!variants) return;
    await Promise.all(Object.values(variants).map(url => cleanupImage(supabase, url)));
}

async function handleVariantUpload(
    supabase: SupabaseClient,
    formData: FormData,
    prefix: string,
    bucket: string
): Promise<Record<string, string> | null> {
    const variants: Record<string, string> = {};
    const sizes = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
        const file = formData.get(`${prefix}_${size}`) as File;
        if (!file || !(file instanceof File)) continue;

        const timestamp = Date.now();
        const fileName = `${timestamp}-${crypto.randomUUID()}-${size}.webp`;

        const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        variants[size] = urlData.publicUrl;
    }

    return Object.keys(variants).length > 0 ? variants : null;
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const form = await superValidate(zod(departmentSchema));

    const { data: departments, error: departmentsError } = await supabase
        .from('departments')
        .select('*');

    if (departmentsError) console.error('Error fetching departments:', departmentsError);

    return { form, departments };
};

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
            console.log('Processing department creation...');

            console.log(formData);
            if (!form.valid) {
                await logActivity(supabase, session.user.id, 'Invalid form data submitted');
                return fail(400, { form });
            }

            console.log('Processing department creation...');

            const [departmentVariants, mascotVariants] = await Promise.all([
                handleVariantUpload(supabase, formData, 'department_logo', 'department-logos'),
                handleVariantUpload(supabase, formData, 'mascot_logo', 'mascot-logos')
            ]);

            console.log('Variants processed:', {
                department: departmentVariants,
                mascot: mascotVariants
            });

            const newDepartment = {
                department_name: form.data.department_name,
                department_acronym: form.data.department_acronym,
                department_logo: departmentVariants?.large ?? null,
                department_logo_variants: departmentVariants,
                mascot_name: form.data.mascot_name,
                mascot_logo: mascotVariants?.large ?? null,
                mascot_logo_variants: mascotVariants
            };

            const { data, error: insertError } = await supabase
                .from('departments')
                .insert(newDepartment)
                .select()
                .single();

            if (insertError) {
                await Promise.all([
                    cleanupImageVariants(supabase, departmentVariants),
                    cleanupImageVariants(supabase, mascotVariants)
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
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const formData = await request.formData();
            const form = await superValidate(formData, zod(departmentSchema));
            if (!form.valid) return fail(400, { form });

            const id = form.data.id;
            if (!id) return fail(400, { form, message: 'Department ID required' });

            const { data: existingDepartment } = await supabase
                .from('departments')
                .select()
                .eq('id', id)
                .single();

            const keepDeptLogo = formData.get('keepDepartmentLogo') === 'true';
            const keepMascotLogo = formData.get('keepMascotLogo') === 'true';

            let departmentVariants = null;
            let mascotVariants = null;

            if (!keepDeptLogo) {
                departmentVariants = await handleVariantUpload(
                    supabase, 
                    formData, 
                    'department_logo', 
                    'department-logos'
                );
                if (existingDepartment?.department_logo_variants) {
                    await cleanupImageVariants(supabase, existingDepartment.department_logo_variants);
                }
            }

            if (!keepMascotLogo) {
                mascotVariants = await handleVariantUpload(
                    supabase,
                    formData,
                    'mascot_logo',
                    'mascot-logos'
                );
                if (existingDepartment?.mascot_logo_variants) {
                    await cleanupImageVariants(supabase, existingDepartment.mascot_logo_variants);
                }
            }

            const updateData = {
                department_name: form.data.department_name,
                department_acronym: form.data.department_acronym,
                department_logo: departmentVariants?.large ?? (keepDeptLogo ? existingDepartment?.department_logo : null),
                department_logo_variants: departmentVariants ?? (keepDeptLogo ? existingDepartment?.department_logo_variants : null),
                mascot_name: form.data.mascot_name,
                mascot_logo: mascotVariants?.large ?? (keepMascotLogo ? existingDepartment?.mascot_logo : null),
                mascot_logo_variants: mascotVariants ?? (keepMascotLogo ? existingDepartment?.mascot_logo_variants : null)
            };

            const { data: updatedDepartment, error: updateError } = await supabase
                .from('departments')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                if (departmentVariants) await cleanupImageVariants(supabase, departmentVariants);
                if (mascotVariants) await cleanupImageVariants(supabase, mascotVariants);
                return fail(500, { form, message: 'Update failed' });
            }

            await logActivity(supabase, session.user.id, `Updated department: ${form.data.department_name}`, {
                previous: existingDepartment,
                current: updatedDepartment
            });

            return { form };
        } catch (error) {
            console.error('Update error:', error);
            return fail(500, { message: 'Server error' });
        }
    },

    delete: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession();
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const formData = await request.formData();
            const id = formData.get('id');
            if (!id) return fail(400, { message: 'Invalid request' });

            const { data: existingDepartment } = await supabase
                .from('departments')
                .select()
                .eq('id', id)
                .single();

            const { error: deleteError } = await supabase
                .from('departments')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            if (existingDepartment) {
                await Promise.all([
                    cleanupImageVariants(supabase, existingDepartment.department_logo_variants),
                    cleanupImageVariants(supabase, existingDepartment.mascot_logo_variants)
                ]);

                await logActivity(supabase, session.user.id, 
                    `Deleted department: ${existingDepartment.department_name}`,
                    { previous: existingDepartment }
                );
            }

            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            return fail(500, { message: 'Delete failed' });
        }
    }
};