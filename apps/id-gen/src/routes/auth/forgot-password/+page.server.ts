import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		try {
			await auth.api.forgetPassword({
				body: {
					email,
					redirectTo: `${url.origin}/auth/reset-password`
				}
			});

			return {
				success: true,
				message: 'Password reset instructions have been sent to your email.'
			};
		} catch (error: any) {
			console.error('Forget password error:', error);
			if (error.status === 400) {
				return fail(400, {
					error: 'Invalid email address or user not found',
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
