import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthApiError } from '@supabase/supabase-js';
import { ADMIN_URL } from '$env/static/private';

export interface AuthActionData {
    success: boolean;
    error?: string;
    email?: string;
    message?: string;
    [key: string]: unknown;
}

export const actions: Actions = {
    signin: async ({ request, locals: { supabase } }) => {
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

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('[Auth] Error loading profile:', profileError);
            return fail(500, { 
                error: 'Failed to load profile',
                success: false 
            });
        }

        if (!profile) {
            console.error('[Auth] No profile found for user:', data.user.id);
            return fail(404, {
                error: 'User profile not found',
                success: false
            });
        }

        console.log(`[Auth] Loaded profile for user ${data.user.id}, role: ${profile.role}`);

        if (profile.role === 'super_admin') {
            console.log(`[Auth] Redirecting super admin to /${ADMIN_URL}`);
            throw redirect(303, `/${ADMIN_URL}`);
        }

        if (profile.role === 'event_qr_checker') {
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('event_url')
                .single();
            
            if (eventError) {
                console.error('[Auth] Error loading event:', eventError);
                return fail(500, {
                    error: 'Failed to load event data',
                    success: false
                });
            }

            if (!eventData?.event_url) {
                console.error('[Auth] No event URL found for QR checker');
                return fail(404, {
                    error: 'Event URL not found',
                    success: false
                });
            }

            console.log(`[Auth] Redirecting QR checker to event: ${eventData.event_url}`);
            throw redirect(303, `/${eventData.event_url}/qr-checker`);
        }

        console.log('[Auth] Redirecting to templates page');
        throw redirect(303, '/templates');
    },

    signup: async ({ request, url, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        console.log(`[Auth] Sign up attempt for email: ${email}`);

        if (password !== confirmPassword) {
            console.error('[Auth] Password mismatch during signup');
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
            console.error('[Auth] Sign up error:', err);
            return fail(500, {
                error: err.message,
                success: false
            });
        }

        if (data?.user?.identities?.length === 0) {
            console.error('[Auth] Email already registered:', email);
            return fail(400, {
                error: 'Email already registered',
                success: false,
                email
            });
        }

        // Create a profile for the new user
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    role: 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error('[Auth] Error creating profile:', profileError);
                // Delete the auth user since profile creation failed
                await supabase.auth.admin.deleteUser(data.user.id);
                return fail(500, {
                    error: 'Failed to create user profile',
                    success: false
                });
            }
        }

        console.log(`[Auth] Successfully created account and profile for: ${email}`);
        return {
            success: true,
            message: 'Please check your email for a confirmation link.'
        } as const;
    }
};