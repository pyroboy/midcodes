import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserCredits, getCreditHistory } from '$lib/utils/credits';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user, org_id } = locals;

	// Redirect to auth if not logged in
	if (!user) {
		throw redirect(302, '/auth');
	}

	try {
		// Fetch user credits information
		const userCredits = await getUserCredits(supabase, user.id);

		// Fetch recent transaction history (last 30 transactions)
		const creditHistory = await getCreditHistory(supabase, user.id, 30);

		// Fetch dashboard stats
		let totalCards = 0;
		let totalTemplates = 0;
		let weeklyCards = 0;
		let recentCardsCount = 0;

		if (org_id && supabase) {
			// Get total cards count
			const { count: cardsCount } = await supabase
				.from('idcards')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id);
			totalCards = cardsCount || 0;

			// Get total templates count
			const { count: templatesCount } = await supabase
				.from('templates')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id);
			totalTemplates = templatesCount || 0;

			// Get this week's cards count
			const oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
			const { count: weeklyCount } = await supabase
				.from('idcards')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.gte('created_at', oneWeekAgo.toISOString());
			weeklyCards = weeklyCount || 0;

			// Get recent cards count (last 12)
			const { data: recentCards } = await supabase
				.from('idcards')
				.select('id')
				.eq('org_id', org_id)
				.order('created_at', { ascending: false })
				.limit(12);
			recentCardsCount = recentCards?.length || 0;
		}

		return {
			user,
			userCredits,
			creditHistory,
			stats: {
				totalCards,
				totalTemplates,
				weeklyCards,
				recentCardsCount
			}
		};
	} catch (error) {
		console.error('Error loading account data:', error);

		return {
			user,
			userCredits: null,
			creditHistory: [],
			stats: {
				totalCards: 0,
				totalTemplates: 0,
				weeklyCards: 0,
				recentCardsCount: 0
			},
			error: 'Failed to load account data'
		};
	}
};
