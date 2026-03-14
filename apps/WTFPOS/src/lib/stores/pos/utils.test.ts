import { describe, it, expect } from 'vitest';
import { calculateOrderTotals } from './utils';
import type { OrderItem } from '$lib/types';

// Helper to build a minimal active item
function item(unitPrice: number, quantity = 1, tag: OrderItem['tag'] = null): OrderItem {
	return {
		id: 'i1',
		menuItemId: 'm1',
		menuItemName: 'Test Item',
		quantity,
		unitPrice,
		weight: null,
		status: 'served',
		sentAt: null,
		tag
	};
}

describe('calculateOrderTotals — no discount', () => {
	it('includes 12% VAT inclusive in the total', () => {
		// subtotal 1120, VAT = round2(1120 - 1120/1.12) = 120
		const result = calculateOrderTotals({ items: [item(1120)], discountType: 'none', discountPax: 0, pax: 4 });
		expect(result.subtotal).toBe(1120);
		expect(result.discountAmount).toBe(0);
		expect(result.vatAmount).toBe(120);
		expect(result.total).toBe(1120);
	});

	it('sums multiple items', () => {
		const result = calculateOrderTotals({
			items: [item(560, 2), item(280, 1)],
			discountType: 'none',
			discountPax: 0,
			pax: 2
		});
		expect(result.subtotal).toBe(1400);
		expect(result.total).toBe(1400);
	});
});

describe('calculateOrderTotals — SC/PWD discount (BIR-compliant)', () => {
	it('applies VAT exemption + 20% discount for full table SC', () => {
		// subtotal 1120, 1/1 pax qualifies
		// vatExemptSale = 1120/1.12 = 1000
		// disc = 1000 * 0.20 = 200
		// exemptedVat = 1120 - 1000 = 120
		// total = 1120 - 120 - 200 = 800
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 1,
			pax: 1
		});
		expect(result.subtotal).toBe(1120);
		expect(result.discountAmount).toBe(200);
		expect(result.vatAmount).toBe(0);
		expect(result.total).toBe(800);
	});

	it('applies pro-rata VAT exemption + discount for partial qualifying pax', () => {
		// subtotal 1120, 2/4 pax qualify
		// qualifyingShare = 560, taxableShare = 560
		// vatExemptSale = 560/1.12 = 500
		// disc = 500 * 0.20 = 100
		// exemptedVat = 560 - 500 = 60
		// vat = round2(560 - 500) = 60
		// total = 1120 - 60 - 100 = 960
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'pwd',
			discountPax: 2,
			pax: 4
		});
		expect(result.subtotal).toBe(1120);
		expect(result.discountAmount).toBe(100);
		expect(result.vatAmount).toBe(60);
		expect(result.total).toBe(960);
	});

	it('caps qualifying pax at total pax', () => {
		// discountPax > pax should not produce a discount larger than full-table discount
		const full = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 4,
			pax: 4
		});
		const capped = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 99,
			pax: 4
		});
		expect(capped.discountAmount).toBe(full.discountAmount);
		expect(capped.total).toBe(full.total);
	});
});

describe('calculateOrderTotals — BIR centavo precision', () => {
	it('₱3,300 / 4 pax all SC: correct VAT exemption + discount', () => {
		// subtotal = 3300, 4/4 pax qualify
		// vatExemptSale = 3300/1.12 = 2946.43
		// disc = 2946.43 * 0.20 = 589.29
		// exemptedVat = 3300 - 2946.43 = 353.57
		// total = 3300 - 353.57 - 589.29 = 2357.14
		const result = calculateOrderTotals({
			items: [item(825, 4, 'PKG')],
			discountType: 'senior',
			discountPax: 4,
			pax: 4
		});
		expect(result.subtotal).toBe(3300);
		expect(result.discountAmount).toBe(589.29);
		expect(result.vatAmount).toBe(0);
		expect(result.total).toBe(2357.14);
	});

	it('₱499/head, 3 pax, 2 SC: user-reported scenario', () => {
		// subtotal = 1497, 2/3 qualify
		// qualifyingShare = 998, taxableShare = 499
		// vatExemptSale = 998/1.12 = 891.07
		// disc = 891.07 * 0.20 = 178.21
		// exemptedVat = 998 - 891.07 = 106.93
		// vat = round2(499 - 499/1.12) = round2(53.46) = 53.46
		// total = 1497 - 106.93 - 178.21 = 1211.86
		const result = calculateOrderTotals({
			items: [item(499, 3, 'PKG')],
			discountType: 'senior',
			discountPax: 2,
			pax: 3
		});
		expect(result.subtotal).toBe(1497);
		expect(result.discountAmount).toBe(178.21);
		expect(result.vatAmount).toBe(53.46);
		expect(result.total).toBe(1211.86);
	});

	it('₱3,300 / 4 pax, 2 SC: partial pax centavo precision', () => {
		// subtotal = 3300, 2/4 qualify
		// qualifyingShare = 1650, taxableShare = 1650
		// vatExemptSale = 1650/1.12 = 1473.21
		// disc = 1473.21 * 0.20 = 294.64
		// exemptedVat = 1650 - 1473.21 = 176.79
		// vat = round2(1650 - 1650/1.12) = 176.79
		// total = 3300 - 176.79 - 294.64 = 2828.57
		const result = calculateOrderTotals({
			items: [item(825, 4, 'PKG')],
			discountType: 'senior',
			discountPax: 2,
			pax: 4
		});
		expect(result.subtotal).toBe(3300);
		expect(result.discountAmount).toBe(294.64);
		expect(result.vatAmount).toBe(176.79);
		expect(result.total).toBe(2828.57);
	});
});

describe('calculateOrderTotals — comp / promo / service_recovery', () => {
	it('sets discount = subtotal and vat = 0 for comp', () => {
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'comp',
			discountPax: 0,
			pax: 4
		});
		expect(result.discountAmount).toBe(1120);
		expect(result.vatAmount).toBe(0);
		expect(result.total).toBe(0);
	});

	it('zeroes out total for promo', () => {
		const result = calculateOrderTotals({
			items: [item(500), item(200)],
			discountType: 'promo',
			discountPax: 0,
			pax: 2
		});
		expect(result.total).toBe(0);
	});

	it('zeroes out total for service_recovery', () => {
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'service_recovery',
			discountPax: 0,
			pax: 4
		});
		expect(result.discountAmount).toBe(1120);
		expect(result.vatAmount).toBe(0);
		expect(result.total).toBe(0);
	});
});

describe('calculateOrderTotals — SC edge cases', () => {
	it('produces no discount when discountPax is 0 (senior type)', () => {
		// qualifyingPax = 0, so no qualifying share → disc = 0, full VAT applies
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 0,
			pax: 4
		});
		expect(result.discountAmount).toBe(0);
		expect(result.vatAmount).toBe(120); // standard 12% inclusive
		expect(result.total).toBe(1120);
	});

	it('guards against pax=0 by treating it as 1', () => {
		// Math.max(1, 0) = 1, discountPax capped to 1 → full table qualifies
		// vatExemptSale = 1120/1.12 = 1000, disc = 200, exemptedVat = 120
		// total = 1120 - 120 - 200 = 800
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 1,
			pax: 0
		});
		expect(result.discountAmount).toBe(200);
		expect(result.total).toBe(800);
	});
});

describe('calculateOrderTotals — item filtering', () => {
	it('excludes FREE-tagged items from subtotal', () => {
		const result = calculateOrderTotals({
			items: [item(280, 1, null), item(100, 2, 'FREE')],
			discountType: 'none',
			discountPax: 0,
			pax: 2
		});
		expect(result.subtotal).toBe(280);
	});

	it('excludes cancelled items from subtotal', () => {
		const cancelled: OrderItem = { ...item(500), status: 'cancelled' };
		const result = calculateOrderTotals({
			items: [item(280), cancelled],
			discountType: 'none',
			discountPax: 0,
			pax: 2
		});
		expect(result.subtotal).toBe(280);
	});

	it('returns zero total for an order with all FREE items', () => {
		const result = calculateOrderTotals({
			items: [item(280, 4, 'FREE')],
			discountType: 'none',
			discountPax: 0,
			pax: 4
		});
		expect(result.subtotal).toBe(0);
		expect(result.total).toBe(0);
	});

	it('includes PKG-tagged items in subtotal (only FREE is excluded)', () => {
		const result = calculateOrderTotals({
			items: [item(280, 4, 'PKG'), item(50, 1, 'FREE')],
			discountType: 'none',
			discountPax: 0,
			pax: 4
		});
		expect(result.subtotal).toBe(1120); // 280*4, the FREE 50 is excluded
	});

	it('handles empty items array', () => {
		const result = calculateOrderTotals({
			items: [],
			discountType: 'none',
			discountPax: 0,
			pax: 4
		});
		expect(result.subtotal).toBe(0);
		expect(result.discountAmount).toBe(0);
		expect(result.vatAmount).toBe(0);
		expect(result.total).toBe(0);
	});

	it('mixed: cancelled + FREE + PKG + active all filtered correctly', () => {
		const cancelled: OrderItem = { ...item(500), status: 'cancelled' };
		const result = calculateOrderTotals({
			items: [
				item(280, 4, 'PKG'),   // 1120 — included
				item(100, 2, 'FREE'),  // 200  — excluded
				cancelled,             // 500  — excluded
				item(120, 1, null)     // 120  — included
			],
			discountType: 'none',
			discountPax: 0,
			pax: 4
		});
		expect(result.subtotal).toBe(1240); // 1120 + 120
	});
});
