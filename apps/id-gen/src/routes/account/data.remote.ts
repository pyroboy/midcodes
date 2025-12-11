import { query, getRequestEvent } from '$app/server';

// Types for account data
export interface UserCredits {
	credits_balance: number;
	card_generation_count: number;
	template_count: number;
	unlimited_templates: boolean;
	remove_watermarks: boolean;
}

export interface DashboardStats {
	totalCards: number;
	totalTemplates: number;
	weeklyCards: number;
	recentCardsCount: number;
}

export interface CreditTransaction {
	id: string;
	user_id: string;
	transaction_type: string;
	amount: number;
	credits_after: number;
	description: string | null;
	reference_id: string | null;
	created_at: string;
}

// Query for user credits (balance, counts, features)
export const getUserCredits = query(async (): Promise<UserCredits | null> => {
	const { locals } = getRequestEvent();
	const { supabase, user } = locals;
	
	if (!user?.id) return null;
	
	const { data, error } = await supabase
		.from('profiles')
		.select('credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks')
		.eq('id', user.id)
		.single();

	if (error) {
		console.error('Error fetching user credits:', error);
		return null;
	}

	return data as UserCredits;
});

// Query for dashboard stats
export const getDashboardStats = query(async (): Promise<DashboardStats> => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;
	
	if (!org_id) {
		return { totalCards: 0, totalTemplates: 0, weeklyCards: 0, recentCardsCount: 0 };
	}

	// Run all count queries in parallel
	const [cardsResult, templatesResult, weeklyResult, recentResult] = await Promise.all([
		// Total cards
		supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
		// Total templates
		supabase.from('templates').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
		// This week's cards
		supabase.from('idcards').select('*', { count: 'exact', head: true })
			.eq('org_id', org_id)
			.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
		// Recent cards (last 12)
		supabase.from('idcards').select('id').eq('org_id', org_id)
			.order('created_at', { ascending: false }).limit(12)
	]);

	return {
		totalCards: cardsResult.count || 0,
		totalTemplates: templatesResult.count || 0,
		weeklyCards: weeklyResult.count || 0,
		recentCardsCount: recentResult.data?.length || 0
	};
});

// Query for credit history
export const getCreditHistory = query(async (): Promise<CreditTransaction[]> => {
	const { locals } = getRequestEvent();
	const { supabase, user } = locals;
	
	if (!user?.id) return [];

	const { data, error } = await supabase
		.from('credit_transactions')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(30);

	if (error) {
		console.error('Error fetching credit history:', error);
		return [];
	}

	return (data || []) as CreditTransaction[];
});
