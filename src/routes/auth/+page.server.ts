import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthApiError } from '@supabase/supabase-js';

export const actions: Actions = {
    signin: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (error instanceof AuthApiError && error.status === 400) {
                return fail(400, {
                    error: 'Invalid credentials',
                    success: false,
                    email
                });
            }
            return fail(500, {
                error: 'Server error. Please try again later.',
                success: false
            });
        }

        throw redirect(303, '/templates');
    },

    signup: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            return fail(400, {
                error: 'Passwords do not match',
                success: false,
                email
            });
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${new URL(request.url).origin}/auth/callback`
            }
        });

        if (error) {
            return fail(500, {
                error: error.message,
                success: false,
                email
            });
        }

        return {
            success: true,
            message: 'Please check your email for a confirmation link.'
        };
    }
};
