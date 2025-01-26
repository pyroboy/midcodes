import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthApiError } from '@supabase/supabase-js';

export const actions: Actions = {
    default: async ({ request, url, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${url.origin}/auth/reset-password`
        });

        if (error) {
            if (error instanceof AuthApiError && error.status === 400) {
                return fail(400, {
                    error: 'Invalid email address',
                    success: false,
                    email
                });
            }
            return fail(500, {
                error: 'Server error. Please try again later.',
                success: false
            });
        }

        return {
            success: true,
            message: 'Password reset instructions have been sent to your email.'
        };
    }
};
