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
		// subtotal 1120, VAT = round(1120 - 1120/1.12) = round(120) = 120
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

describe('calculateOrderTotals — SC/PWD discount', () => {
	it('applies 20% on net-of-VAT for all qualifying pax (full table)', () => {
		// subtotal 1120, 1/1 pax qualifies
		// qualifyingShare = 1120, disc = round((1120/1.12)*0.20) = round(200) = 200
		// vat = 0 (no non-qualifying share)
		// total = 1120 - 200 = 920
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 1,
			pax: 1
		});
		expect(result.subtotal).toBe(1120);
		expect(result.discountAmount).toBe(200);
		expect(result.vatAmount).toBe(0);
		expect(result.total).toBe(920);
	});

	it('applies pro-rata discount for partial qualifying pax', () => {
		// subtotal 1120, 2/4 pax qualify
		// qualifyingShare = 560, disc = round((560/1.12)*0.20) = round(100) = 100
		// taxableShare = 560, vat = round(560 - 560/1.12) = round(60) = 60
		// total = 1120 - 100 = 1020
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'pwd',
			discountPax: 2,
			pax: 4
		});
		expect(result.subtotal).toBe(1120);
		expect(result.discountAmount).toBe(100);
		expect(result.vatAmount).toBe(60);
		expect(result.total).toBe(1020);
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
		const result = calculateOrderTotals({
			items: [item(1120)],
			discountType: 'senior',
			discountPax: 1,
			pax: 0
		});
		// Identical to full-table SC discount with pax=1
		expect(result.discountAmount).toBe(200);
		expect(result.total).toBe(920);
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
