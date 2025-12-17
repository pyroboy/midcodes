import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;

	if (session) {
		const returnTo = url.searchParams.get('returnTo');
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

export const actions: Actions = {
	signin: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try {
			const result = await auth.api.signInEmail({
				body: {
					email,
					password
				}
			});

			if (result) {
				const returnTo = url.searchParams.get('returnTo');
				throw redirect(303, returnTo || '/');
			}
		} catch (error: any) {
			console.error('Sign in error:', error);
			if (error.status === 400 || error.code === 'INVALID_CREDENTIALS') {
				return fail(400, {
					error: 'Invalid credentials',
					success: false,
					email
				});
			}
			if (error instanceof Response && error.status === 302) {
				// Success redirect from Better Auth
				const returnTo = url.searchParams.get('returnTo');
				throw redirect(303, returnTo || '/');
			}
			return fail(500, {
				error: error.message || 'Server error. Please try again later.',
				success: false
			});
		}
	},

	signup: async ({ request, url }) => {
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

		try {
			const result = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: email.split('@')[0] // Default name
				}
			});

			if (result) {
				return {
					success: true,
					email,
					message: 'Account created successfully. You can now sign in.'
				};
			}
		} catch (error: any) {
			console.error('Sign up error:', error);
			if (error.status === 400) {
				return fail(400, {
					error: error.message || 'Invalid registration details',
					success: false,
					email
				});
			}
			return fail(500, {
				error: error.message || 'Server error. Please try again later.',
				success: false
			});
		}
	}
};
