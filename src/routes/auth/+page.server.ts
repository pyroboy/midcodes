import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AuthApiError } from '@supabase/supabase-js';
import { ADMIN_URL } from '$env/static/private';

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
                throw redirect(303, ADMIN_URL);
            case 'org_admin':
                throw redirect(303, '/org');
            case 'event_admin':
                throw redirect(303, '/events');
            case 'event_qr_checker':
                throw redirect(303, '/check');
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
                console.error('[Auth] Invalid credentials:', error.message);
                return fail(400, {
                    error: 'Invalid credentials',
                    success: false,
                    email
                });
            }
            console.error('[Auth] Server error during sign in:', error);
            return fail(500, {
                error: 'Server error. Please try again later.',
                success: false
            });
        }

        if (!data.user) {
            console.error('[Auth] No user data returned after successful authentication');
            return fail(400, {
                error: 'No user returned after sign in',
                success: false
            });
        }

        console.log(`[Auth] Successfully authenticated user: ${data.user.id}`);

        // Set session cookies
        const { access_token, refresh_token } = data.session;
        
        cookies.set('sb-access-token', access_token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 3600 // 1 hour
        });
        
        cookies.set('sb-refresh-token', refresh_token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 604800 // 1 week
        });

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (!profile) {
            console.error('[Auth] No profile found for user:', data.user.id);
            return fail(400, {
                error: 'No profile found',
                success: false
            });
        }

        console.log(`[Auth] User role: ${profile.role}`);

        // Redirect based on role
        switch (profile.role) {
            case 'super_admin':
                throw redirect(303, ADMIN_URL);
            case 'org_admin':
                throw redirect(303, '/org');
            case 'event_admin':
                throw redirect(303, '/events');
            case 'event_qr_checker':
                throw redirect(303, '/check');
            default:
                throw redirect(303, '/');
        }
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