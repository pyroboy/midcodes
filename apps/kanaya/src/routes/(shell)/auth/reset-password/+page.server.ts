import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	// Reset password page is accessed via email link with a token
	const token = url.searchParams.get('token');

	if (!token) {
		// No token = can't reset. Redirect to forgot-password
		throw redirect(303, '/auth/forgot-password');
	}

	return { token };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;
		const token = formData.get('token') as string;

		if (!token) {
			return fail(400, {
				error: 'Reset token is missing. Please use the link from your email.',
				success: false
			});
		}

		if (!password || password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters',
				success: false
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				success: false
			});
		}

		try {
			await auth.api.resetPassword({
				body: {
					newPassword: password,
					token
				}
			});
		} catch (error: any) {
			console.error('Reset password error:', error);
			return fail(500, {
				error: error.message || 'Failed to reset password. The link may have expired.',
				success: false
			});
		}

		return {
			success: true,
			message: 'Password has been reset successfully. You can now sign in.'
		};
	}
};
