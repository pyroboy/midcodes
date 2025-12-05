import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { resetPasswordSchema } from '../schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	// Ensure user is authenticated (via the link they clicked)
	const { session } = await safeGetSession();

	// Note: Sometimes the session isn't immediately available depending on how the 
	// link handler is set up (PKCE flow). If using implicit flow, the token is in hash 
	// and needs client-side handling. Assuming standard PKCE flow handled by SvelteKit helpers:

	const form = await superValidate(zod(resetPasswordSchema));
	return { form, hasSession: !!session };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(resetPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { password } = form.data;

		const { error } = await supabase.auth.updateUser({
			password
		});

		if (error) {
			return fail(500, {
				form,
				message: error.message
			});
		}

		throw redirect(303, '/auth?message=Password+updated+successfully');
	}
};
