import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, {
				error: 'Email is required',
				success: false
			});
		}

		try {
			await auth.api.requestPasswordReset({
				body: {
					email,
					redirectTo: `${url.origin}/auth/reset-password`
				}
			});

			// Always show success to avoid email enumeration
			return {
				success: true,
				message: 'If an account exists with that email, password reset instructions have been sent.'
			};
		} catch (error: any) {
			console.error('Forget password error:', error);
			// Still show generic success to avoid email enumeration
			return {
				success: true,
				message: 'If an account exists with that email, password reset instructions have been sent.'
			};
		}
	}
};
