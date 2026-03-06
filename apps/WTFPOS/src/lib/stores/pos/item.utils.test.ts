import { describe, it, expect } from 'vitest';
import { deriveOrderItemProps } from './item.utils';
import type { MenuItem } from '$lib/types';

type Partial_MenuItem = Partial<Pick<MenuItem, 'category' | 'price' | 'isWeightBased' | 'pricePerGram' | 'isFree'>>;

function menuItem(overrides: Partial_MenuItem = {}): Parameters<typeof deriveOrderItemProps>[0] {
	return {
		category: 'sides',
		price: 120,
		isWeightBased: false,
		pricePerGram: undefined,
		isFree: false,
		...overrides
	};
}

describe('deriveOrderItemProps — meat items', () => {
	it('assigns FREE tag and ₱0 price for meat category', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'meats' }), 4, 1);
		expect(result.tag).toBe('FREE');
		expect(result.unitPrice).toBe(0);
		expect(result.quantity).toBe(1); // qty, not pax
	});

	it('uses forceFree to override any category to FREE', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'drinks', price: 80 }), 4, 2, undefined, true);
		expect(result.tag).toBe('FREE');
		expect(result.unitPrice).toBe(0);
	});

	it('item.isFree=true overrides to FREE regardless of category', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'sides', isFree: true, price: 50 }), 4, 1);
		expect(result.tag).toBe('FREE');
		expect(result.unitPrice).toBe(0);
	});
});

describe('deriveOrderItemProps — package items', () => {
	it('assigns PKG tag and package price', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'packages', price: 599 }), 4, 1);
		expect(result.tag).toBe('PKG');
		expect(result.unitPrice).toBe(599);
	});

	it('sets quantity to pax (not qty) for packages', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'packages', price: 599 }), 4, 1);
		expect(result.quantity).toBe(4); // pax
	});

	it('updates quantity when pax changes', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'packages', price: 599 }), 6, 1);
		expect(result.quantity).toBe(6);
	});
});

describe('deriveOrderItemProps — regular items', () => {
	it('assigns no tag and item.price for a standard side', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'sides', price: 120 }), 4, 2);
		expect(result.tag).toBeNull();
		expect(result.unitPrice).toBe(120);
		expect(result.quantity).toBe(2); // qty
	});

	it('assigns no tag for drinks', () => {
		const result = deriveOrderItemProps(menuItem({ category: 'drinks', price: 80 }), 4, 3);
		expect(result.tag).toBeNull();
		expect(result.unitPrice).toBe(80);
		expect(result.quantity).toBe(3);
	});
});

describe('deriveOrderItemProps — weight-based items', () => {
	it('computes price as Math.round(weight × pricePerGram)', () => {
		// 250g × ₱0.55/g = 137.5 → Math.round → 138
		const result = deriveOrderItemProps(
			menuItem({ isWeightBased: true, pricePerGram: 0.55 }),
			4, 1, 250
		);
		expect(result.unitPrice).toBe(138);
	});

	it('returns ₱0 for weight-based item with no weight provided', () => {
		const result = deriveOrderItemProps(
			menuItem({ isWeightBased: true, pricePerGram: 0.55 }),
			4, 1, undefined
		);
		expect(result.unitPrice).toBe(0);
	});

	it('rounds fractional peso correctly', () => {
		// 3g × ₱10.5/g = 31.5 → Math.round → 32
		// 10.5 = 21/2 is exactly representable in IEEE 754
		const result = deriveOrderItemProps(
			menuItem({ isWeightBased: true, pricePerGram: 10.5 }),
			2, 1, 3
		);
		expect(result.unitPrice).toBe(32);
	});
});
