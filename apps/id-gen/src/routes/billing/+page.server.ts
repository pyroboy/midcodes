import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(302, '/auth');
	}

	try {
		// Get payment records (PayMongo payments)
		const { data: payments, error: paymentsError } = await supabase
			.from('payment_records')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(50);

		if (paymentsError) {
			console.error('Error fetching payments:', paymentsError);
		}

		// Get invoices for this user
		const { data: invoices, error: invoicesError } = await supabase
			.from('invoices')
			.select(
				`
				*,
				invoice_items (*)
			`
			)
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (invoicesError) {
			console.error('Error fetching invoices:', invoicesError);
		}

		// Get current profile info
		const { data: profile } = await supabase
			.from('profiles')
			.select('credits_balance, unlimited_templates, remove_watermarks')
			.eq('id', user.id)
			.single();

		// Calculate total spent (from paid invoices and successful payments)
		let totalSpent = 0;

		if (invoices) {
			for (const invoice of invoices as any[]) {
				if (invoice.status === 'paid') {
					totalSpent += invoice.total_amount || 0;
				}
			}
		}

		if (payments) {
			for (const payment of payments as any[]) {
				if (payment.status === 'paid') {
					totalSpent += (payment.amount_php || 0) * 100; // Convert to centavos
				}
			}
		}

		const profileData = profile as any;
		return {
			payments: payments || [],
			invoices: invoices || [],
			profile: {
				credits_balance: profileData?.credits_balance || 0,
				unlimited_templates: profileData?.unlimited_templates || false,
				remove_watermarks: profileData?.remove_watermarks || false
			},
			totalSpent: totalSpent / 100 // Convert back to PHP
		};
	} catch (error) {
		console.error('Error loading billing data:', error);
		return {
			payments: [],
			invoices: [],
			profile: {
				credits_balance: 0,
				unlimited_templates: false,
				remove_watermarks: false
			},
			totalSpent: 0,
			error: 'Failed to load billing data'
		};
	}
};
