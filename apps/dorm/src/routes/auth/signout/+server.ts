import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase }, cookies }) => {
	// 1. Sign out from Supabase API
	await supabase.auth.signOut();

	// 2. Force clear cookies
	const cookieOptions = { path: '/', expires: new Date(0) };
	cookies.set('sb-access-token', '', cookieOptions);
	cookies.set('sb-refresh-token', '', cookieOptions);

	// 3. Clear any sidebar state or app-specific cookies
	cookies.set('sidebar:state', '', cookieOptions);
	cookies.set('selectedOrgId', '', cookieOptions);

	throw redirect(303, '/auth');
};

export const POST = GET;
