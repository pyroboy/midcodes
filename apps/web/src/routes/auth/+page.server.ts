import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AuthApiError } from '@supabase/supabase-js';
import { PRIVATE_ADMIN_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
    const { session, profile } = await safeGetSession();
    
    // If user is already logged in, redirect them based on their role
    if (session && profile) {
        const returnTo = url.searchParams.get('returnTo');
        if (returnTo) {
            throw redirect(303, returnTo);
        }

        switch (profile.role) {
            case 'super_admin':
                throw redirect(303, PRIVATE_ADMIN_URL);
            default:
                throw redirect(303, '/');
        }
    }

    return {};
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

        console.log(`[Auth] Sign in attempt for email: ${email}`);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (error instanceof AuthApiError && error.status === 400) {
                console.log('[Auth] Invalid credentials:', error.message);
                return fail(400, {
                    error: 'Invalid credentials',
                    success: false,
                    email
                });
            }
            console.log('[Auth] Server error during sign in:', error);
            return fail(500, {
                error: 'Server error. Please try again later.',
                success: false
            });
        }

        if (!data.session) {
            console.log('[Auth] No session after sign in');
            return fail(400, {
                error: 'No session after sign in',
                success: false
            });
        }

        // Set auth cookie
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

        // Get user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

        console.log('[Auth] Got profile after sign in:', profile);

        // Redirect based on role
        if (profile?.role === 'super_admin') {
            console.log('[Auth] Redirecting super_admin to:', PRIVATE_ADMIN_URL);
            throw redirect(303, PRIVATE_ADMIN_URL);
        }

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