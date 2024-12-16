import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ADMIN_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
    const code = url.searchParams.get('code');
    console.log('[Auth Callback] Starting with code:', !!code);

    if (code) {
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
        console.log('[Auth Callback] Got session:', {
            userId: session?.user?.id,
            hasSession: !!session
        });
        
        // Get user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user.id)
            .single();

        console.log('[Auth Callback] Got profile:', {
            profile,
            role: profile?.role,
            isSuperAdmin: profile?.role === 'super_admin',
            adminUrl: ADMIN_URL
        });

        // Redirect based on role
        if (profile?.role === 'super_admin') {
            console.log('[Auth Callback] Redirecting super_admin to:', ADMIN_URL);
            throw redirect(303, ADMIN_URL);
        }
    }

    console.log('[Auth Callback] Fallback redirect to home');
    throw redirect(303, '/');
};
