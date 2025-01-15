import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { supabase }, cookies }) => {
    await supabase.auth.signOut();
    
    // Clear all auth-related cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    throw redirect(303, '/auth');
};
