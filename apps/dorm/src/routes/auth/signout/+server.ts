import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase }, cookies }) => {
    // First, sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Error signing out:', error.message);
    }
    
    // Clear all Supabase-related cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    // Clear session from cache by setting expired cookies
    cookies.set('sb-access-token', '', {
        path: '/',
        expires: new Date(0),
    });
    cookies.set('sb-refresh-token', '', {
        path: '/',
        expires: new Date(0),
    });
    
    // Redirect to auth page after successful signout
    throw redirect(303, '/auth');
};

export const POST = GET;
