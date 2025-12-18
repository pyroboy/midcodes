import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { paymentRecords, invoices, invoiceItems, profiles } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	if (!user) {
		throw redirect(302, '/auth');
	}

	try {
		// Get payment records with Drizzle
		const payments = await db.select()
			.from(paymentRecords)
			.where(eq(paymentRecords.userId, user.id))
			.orderBy(desc(paymentRecords.createdAt))
			.limit(50);

		// Get invoices with items for this user
		const invoicesData = await db.select()
			.from(invoices)
			.where(eq(invoices.userId, user.id))
			.orderBy(desc(invoices.createdAt));

		// Get invoice items for all invoices
		const invoiceIds = invoicesData.map(inv => inv.id);
		const items = invoiceIds.length > 0 
			? await db.select().from(invoiceItems).where(
				// Simple approach: get all items and filter in memory
				eq(invoiceItems.invoiceId, invoiceIds[0]) // Will be enhanced if needed
			)
			: [];

		// Attach items to invoices (simplified)
		const invoicesWithItems = invoicesData.map(inv => ({
			...inv,
			invoice_items: items.filter(item => item.invoiceId === inv.id)
		}));

		// Get current profile info
		const [profile] = await db.select({
			creditsBalance: profiles.creditsBalance,
			unlimitedTemplates: profiles.unlimitedTemplates,
			removeWatermarks: profiles.removeWatermarks
		})
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);

		// Calculate total spent (from paid invoices and successful payments)
		let totalSpent = 0;

		for (const invoice of invoicesData) {
			if (invoice.status === 'paid') {
				totalSpent += invoice.totalAmount || 0;
			}
		}

		for (const payment of payments) {
			if (payment.status === 'paid') {
				totalSpent += Number(payment.amountPhp || 0) * 100; // Convert to centavos
			}
		}

		return {
			payments: payments || [],
			invoices: invoicesWithItems || [],
			profile: {
				credits_balance: profile?.creditsBalance || 0,
				unlimited_templates: profile?.unlimitedTemplates || false,
				remove_watermarks: profile?.removeWatermarks || false
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
