import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CreditTransaction } from '$lib/schemas/billing.schema';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { supabase, user, org_id } = locals;

	if (!user) {
		throw redirect(302, '/auth');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const type = url.searchParams.get('type') || 'all';
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		// Build query for credit transactions
		let query = supabase
			.from('credit_transactions')
			.select('*', { count: 'exact' })
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		// Filter by transaction type
		if (type && type !== 'all') {
			query = query.eq('transaction_type', type);
		}

		const { data: transactions, count, error } = await query;

		if (error) {
			console.error('Error fetching transactions:', error);
		}

		// Get user's current credit info
		const { data: profile } = await supabase
			.from('profiles')
			.select('credits_balance, card_generation_count, template_count, unlimited_templates')
			.eq('id', user.id)
			.single();

		// Get usage summary for current month
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const { data: monthlyTransactions } = await supabase
			.from('credit_transactions')
			.select('amount, transaction_type')
			.eq('user_id', user.id)
			.gte('created_at', startOfMonth.toISOString());

		// Calculate monthly usage
		let creditsUsedThisMonth = 0;
		let creditsPurchasedThisMonth = 0;

		if (monthlyTransactions) {
			for (const tx of monthlyTransactions as any[]) {
				if (tx.transaction_type === 'usage' && tx.amount < 0) {
					creditsUsedThisMonth += Math.abs(tx.amount);
				} else if (tx.transaction_type === 'purchase' && tx.amount > 0) {
					creditsPurchasedThisMonth += tx.amount;
				}
			}
		}

		// Get ID cards and templates created this month
		const { count: cardsThisMonth } = await supabase
			.from('idcards')
			.select('*', { count: 'exact', head: true })
			.eq('org_id', org_id!)
			.gte('created_at', startOfMonth.toISOString());

		const { count: templatesThisMonth } = await supabase
			.from('templates')
			.select('*', { count: 'exact', head: true })
			.eq('org_id', org_id!)
			.gte('created_at', startOfMonth.toISOString());

		const profileData = profile as any;
		return {
			transactions: (transactions || []) as CreditTransaction[],
			totalCount: count || 0,
			currentPage: page,
			totalPages: Math.ceil((count || 0) / limit),
			filterType: type,
			summary: {
				currentBalance: profileData?.credits_balance || 0,
				cardGenerationCount: profileData?.card_generation_count || 0,
				templateCount: profileData?.template_count || 0,
				unlimitedTemplates: profileData?.unlimited_templates || false,
				creditsUsedThisMonth,
				creditsPurchasedThisMonth,
				cardsThisMonth: cardsThisMonth || 0,
				templatesThisMonth: templatesThisMonth || 0
			}
		};
	} catch (error) {
		console.error('Error loading history:', error);
		return {
			transactions: [],
			totalCount: 0,
			currentPage: 1,
			totalPages: 1,
			filterType: 'all',
			summary: {
				currentBalance: 0,
				cardGenerationCount: 0,
				templateCount: 0,
				unlimitedTemplates: false,
				creditsUsedThisMonth: 0,
				creditsPurchasedThisMonth: 0,
				cardsThisMonth: 0,
				templatesThisMonth: 0
			},
			error: 'Failed to load history'
		};
	}
};
