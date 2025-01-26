import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AuthApiError } from '@supabase/supabase-js';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
    const { session } = await safeGetSession();
    
    if (!session) {
        throw redirect(303, '/auth');
    }
};

export const actions: Actions = {
    default: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            return fail(400, {
                error: 'Passwords do not match',
                success: false
            });
        }

        const { error } = await supabase.auth.updateUser({
            password
        });

        if (error) {
            if (error instanceof AuthApiError && error.status === 400) {
                return fail(400, {
                    error: 'Invalid password format',
                    success: false
                });
            }
            return fail(500, {
                error: 'Server error. Please try again later.',
                success: false
            });
        }

        return {
            success: true,
            message: 'Password has been reset successfully.'
        };
    }
};
