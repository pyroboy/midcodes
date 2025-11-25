import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to auth if not logged in
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	try {
		// Get user's current credit balance and transactions
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', locals.user.id)
      .single() as any;

		// Get recent credit transactions
		const { data: transactions } = await locals.supabase
			.from('credit_transactions')
			.select('*')
			.eq('user_id', locals.user.id)
			.order('created_at', { ascending: false })
			.limit(50);

		// Get usage statistics for the current month
		const currentMonth = new Date();
		const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

		const { data: monthlyUsage } = await locals.supabase
			.from('id_cards')
			.select('created_at')
			.eq('user_id', locals.user.id)
			.gte('created_at', startOfMonth.toISOString())
			.order('created_at', { ascending: false });

		// Get all-time stats
		const { data: totalGenerations } = await locals.supabase
			.from('id_cards')
			.select('id')
			.eq('user_id', locals.user.id);

		// Get purchase history from payments table
		const { data: purchases } = await locals.supabase
			.from('payments')
			.select('*')
			.eq('user_id', locals.user.id)
			.in('status', ['completed', 'paid'])
			.order('created_at', { ascending: false })
			.limit(20);

		return {
			user: locals.user,
			credits: profile?.credits_balance || 0,

			transactions: transactions || [],
			monthlyUsage: monthlyUsage?.length || 0,
			totalGenerations: totalGenerations?.length || 0,
			purchases: purchases || []
		};
	} catch (error) {
		console.error('Error loading credits data:', error);
		return {
			user: locals.user,
			credits: 0,
			monthlyGenerationsUsed: 0,
			transactions: [],
			monthlyUsage: 0,
			totalGenerations: 0,
			purchases: [],
			error: 'Failed to load credits data'
		};
	}
};
