/**
 * POS Utility Functions — Pure calculations with no side effects.
 */
import type { Order } from '$lib/types';

export function calculateOrderTotals(order: Pick<Order, 'items' | 'discountType' | 'discountPax' | 'pax'>): { subtotal: number, discountAmount: number, vatAmount: number, total: number } {
	const sub = order.items.filter((i) => i.status !== 'cancelled' && i.tag !== 'FREE').reduce((s, i) => s + i.unitPrice * i.quantity, 0);
	let disc = 0;
	let vat = 0;

	if (order.discountType === 'senior' || order.discountType === 'pwd') {
		const totalPax = Math.max(1, order.pax);
		const qualifyingPax = Math.max(0, Math.min(order.discountPax ?? 1, totalPax));
		const nonQualifyingPax = totalPax - qualifyingPax;

		const qualifyingShare = sub * (qualifyingPax / totalPax);
		const taxableShare = sub * (nonQualifyingPax / totalPax);

		// BIR Rule: 20% discount on net-of-vat price
		disc = Math.round((qualifyingShare / 1.12) * 0.20);

		// Only non-qualifying share is taxable
		vat = Math.round(taxableShare - taxableShare / 1.12);
	}
	else if (order.discountType === 'comp' || order.discountType === 'service_recovery' || order.discountType === 'promo') {
		disc = sub;
		vat = 0;
	} else {
		// Standard 12% inclusive VAT
		vat = Math.round(sub - sub / 1.12);
	}

	const net = Math.max(0, sub - disc);
	return { subtotal: sub, discountAmount: disc, vatAmount: vat, total: net };
}
