import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
