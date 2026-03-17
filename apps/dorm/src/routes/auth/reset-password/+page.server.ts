import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { resetPasswordSchema } from '../schema';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Ensure user is authenticated (via the link they clicked)
	const { session } = locals;

	const form = await superValidate(zod(resetPasswordSchema));
	return { form, hasSession: !!session };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(resetPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { password } = form.data;

		try {
			// Use Better Auth changePassword API
			// If the user arrived via a reset email link, they have a session
			await auth.api.changePassword({
				body: {
					newPassword: password,
					currentPassword: '' // Reset flow - user arrived via email link
				},
				headers: request.headers
			});
		} catch (error: any) {
			return fail(500, {
				form,
				message: error.message || 'Failed to update password. Please try again.'
			});
		}

		throw redirect(303, '/auth?message=Password+updated+successfully');
	}
};
