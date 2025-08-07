import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/auth/reset-password`
		});

		if (error) {
			return fail(500, {
				error: error.message,
				success: false,
				email
			});
		}

		return {
			success: true,
			message: 'Password reset instructions have been sent to your email.'
		};
	}
};
