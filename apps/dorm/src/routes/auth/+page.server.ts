import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema, registerSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';
import { AuthApiError } from '@supabase/supabase-js';

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { session } = await safeGetSession();

	// If already logged in, redirect
	if (session) {
		const returnTo = url.searchParams.get('returnTo') || '/';
		throw redirect(303, returnTo);
	}

	// Initialize both forms
	const loginForm = await superValidate(zod(loginSchema));
	const registerForm = await superValidate(zod(registerSchema));

	return { loginForm, registerForm };
};

export const actions: Actions = {
	login: async ({ request, locals: { supabase }, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password } = form.data;

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			if (error instanceof AuthApiError && error.status === 400) {
				return fail(400, {
					form,
					message: 'Invalid email or password'
				});
			}
			return fail(500, {
				form,
				message: 'Server error. Please try again later.'
			});
		}

		// Standard Supabase Auth Cookie setting for SSR
		/* Note: Supabase helpers usually handle this automatically, 
		   but explicit setting ensures reliability in some environments */
		if (data.session) {
			const { access_token, refresh_token } = data.session;
			// Cookies options should match your supabase client config
			const cookieOptions = {
				path: '/',
				secure: true,
				httpOnly: true,
				sameSite: 'lax' as const,
				maxAge: 60 * 60 * 24 * 7 // 1 week
			};

			cookies.set('sb-access-token', access_token, cookieOptions);
			cookies.set('sb-refresh-token', refresh_token, cookieOptions);
		}

		throw redirect(303, '/');
	},

	register: async ({ request, url, locals: { supabase } }) => {
		const form = await superValidate(request, zod(registerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password } = form.data;

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(500, {
				form,
				message: error.message
			});
		}

		return {
			form,
			success: true,
			message: 'Registration successful! Please check your email to confirm your account.'
		};
	}
};
