import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { forgotPasswordSchema } from '../schema';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(forgotPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await superValidate(request, zod(forgotPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email } = form.data;

		try {
			// @ts-ignore - better-auth method name varies by version
			await (auth.api.forgetPassword ?? auth.api.sendResetPassword ?? auth.api.resetPassword)({
				body: {
					email,
					redirectTo: `${url.origin}/auth/reset-password`
				}
			});
		} catch (error: any) {
			console.error('Forget password error:', error);
			if (error.status === 400) {
				return fail(400, {
					form,
					message: 'Invalid email address or user not found'
				});
			}
			return fail(500, {
				form,
				message: error.message || 'Server error. Please try again later.'
			});
		}

		return {
			form,
			success: true,
			message: 'Password reset instructions have been sent to your email.'
		};
	}
};
