import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PRIVATE_ADMIN_URL } from '$env/static/private';
import { jwtDecode } from 'jwt-decode';
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
            adminUrl: PRIVATE_ADMIN_URL
        });

        // Redirect based on role
        if (profile?.role === 'super_admin') {
            console.log('[Auth Callback] Redirecting super_admin to:', PRIVATE_ADMIN_URL);
            throw redirect(303, PRIVATE_ADMIN_URL);
        }
    }

    console.log('[Auth Callback] Fallback redirect to home');
    throw redirect(303, '/');
};
