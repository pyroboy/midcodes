/**
 * POS Utility Functions — Pure calculations with no side effects.
 */
import type { Order } from '$lib/types';

export function calculateOrderTotals(order: Pick<Order, 'items' | 'discountType' | 'discountPax' | 'pax' | 'childPax' | 'freePax'>): { subtotal: number, discountAmount: number, vatAmount: number, total: number } {
	let sub = order.items.filter((i) => i.status !== 'cancelled' && i.tag !== 'FREE').reduce((s, i) => s + i.unitPrice * i.quantity, 0);

	// Child pricing: adjust package contribution when childPax or freePax > 0
	const childPax = order.childPax ?? 0;
	const freePax = order.freePax ?? 0;
	if (childPax > 0 || freePax > 0) {
		const pkgItem = order.items.find(i => i.tag === 'PKG' && i.status !== 'cancelled');
		if (pkgItem) {
			const totalPax = order.pax;
			const adultPax = Math.max(0, totalPax - childPax - freePax);
			const childUnitPrice = pkgItem.childUnitPrice ?? pkgItem.unitPrice;
			// Replace pax * unitPrice with adultPax * unitPrice + childPax * childUnitPrice
			sub = sub - pkgItem.unitPrice * totalPax + pkgItem.unitPrice * adultPax + childUnitPrice * childPax;
		}
	}
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
