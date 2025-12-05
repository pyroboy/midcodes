import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { forgotPasswordSchema } from '../schema';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(forgotPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase }, url }) => {
		const form = await superValidate(request, zod(forgotPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email } = form.data;

		// Redirect to the reset-password route after clicking email link
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/auth/reset-password`
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
			message: 'Password reset instructions have been sent to your email.'
		};
	}
};
