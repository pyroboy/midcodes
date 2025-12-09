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
		throw redirect(303, '/');
	}

	return {
		session: null,
		profile: null
	};
};

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

		const returnTo = url.searchParams.get('returnTo');
		const emailRedirectTo = returnTo
			? `${url.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
			: `${url.origin}/auth/callback`;

		const { data, error: err } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo
			}
		});

		if (err) {
			if (err instanceof AuthApiError && err.status === 400) {
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

		return {
			success: true,
			email,
			message: 'Please check your email for a confirmation link.'
		};
	}
};
