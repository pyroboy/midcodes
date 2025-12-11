import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Minimal server load - just auth check
// All data is fetched client-side for instant page display
export const load: PageServerLoad = async ({ locals }) => {
	const { user, org_id } = locals;

	// Redirect to auth if not logged in
	if (!user) {
		throw redirect(302, '/auth');
	}

	// Return minimal data - the page will fetch everything else client-side
	return {
		user,
		org_id
	};
};
