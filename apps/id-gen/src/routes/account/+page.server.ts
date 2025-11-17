import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserCredits, getCreditHistory } from '$lib/utils/credits';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to auth if not logged in
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	try {
		// Fetch user credits information
		const userCredits = await getUserCredits(locals.user.id);

		// Fetch recent transaction history (last 30 transactions)
		const creditHistory = await getCreditHistory(locals.user.id, 30);

		return {
			user: locals.user,
			userCredits,
			creditHistory
		};
	} catch (error) {
		console.error('Error loading account data:', error);

		return {
			user: locals.user,
			userCredits: null,
			creditHistory: [],
			error: 'Failed to load account data'
		};
	}
};
