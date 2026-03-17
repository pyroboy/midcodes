import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema, registerSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already logged in, redirect
	if (locals.session) {
		const returnTo = url.searchParams.get('returnTo') || '/';
		throw redirect(303, returnTo);
	}

	// Initialize both forms
	const loginForm = await superValidate(zod(loginSchema));
	const registerForm = await superValidate(zod(registerSchema));

	return { loginForm, registerForm };
};

export const actions: Actions = {
	login: async ({ request }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password } = form.data;

		try {
			const result = await auth.api.signInEmailAndPassword({
				body: { email, password }
			});

			if (!result) {
				return fail(400, {
					form,
					message: 'Invalid email or password'
				});
			}
		} catch (e: any) {
			const message = e?.message || 'Invalid email or password';
			return fail(400, {
				form,
				message
			});
		}

		throw redirect(303, '/');
	},

	register: async ({ request }) => {
		const form = await superValidate(request, zod(registerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password } = form.data;

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: email.split('@')[0] // Default name from email prefix
				}
			});
		} catch (e: any) {
			return fail(500, {
				form,
				message: e?.message || 'Registration failed. Please try again.'
			});
		}

		return {
			form,
			success: true,
			message: 'Registration successful! You can now log in.'
		};
	}
};
