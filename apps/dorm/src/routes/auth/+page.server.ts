import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AuthApiError } from '@supabase/supabase-js';


export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
    const { session } = await safeGetSession();
    
    if (session) {
        const returnTo = url.searchParams.get('returnTo');
        // If returnTo parameter exists, redirect there, otherwise go to home
        if (returnTo) {
            throw redirect(303, returnTo);
        }
        // Default redirect to home
        throw redirect(303, '/');
    }
};

export interface AuthActionData {
    success: boolean;
    error?: string;
    email?: string;
    message?: string;
    [key: string]: unknown;
}

export const actions: Actions = {
    signin: async ({ request, locals: { supabase }, cookies }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { data, error } = await supabase.auth.signInWithPassword({
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

        if (!data.session) {
            return fail(400, {
                error: 'No session after sign in',
                success: false
            });
        }

        // Set auth cookies
        const { access_token, refresh_token } = data.session;
        cookies.set('sb-access-token', access_token, {
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 // 1 hour
        });
        cookies.set('sb-refresh-token', refresh_token, {
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // Redirect to home after successful sign in
        throw redirect(303, '/');
    },

    signup: async ({ request, url, locals: { supabase } }) => {
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

        const { data, error: err } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${url.origin}/auth/callback`
            }
        });

        if (err) {
            if (err instanceof AuthApiError && err.status === 400) {
                return fail(400, {
                    error: 'Invalid email or password',
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
            message: 'Please check your email for a confirmation link.'
        };
    }
};