/**
 * Pure item pricing logic — no side effects, safe to unit test.
 */
import type { MenuItem } from '$lib/types';

type ItemInput = Pick<MenuItem, 'category' | 'price' | 'isWeightBased' | 'pricePerGram' | 'isFree'>;

/**
 * Derives the unit price, quantity, and tag for an order item.
 * - Meats and isFree items are always FREE (₱0, tag: 'FREE')
 * - Package items are charged at package price × pax (tag: 'PKG')
 * - Weight-based items: Math.round(weight * pricePerGram)
 * - Everything else: item.price
 */
export function deriveOrderItemProps(
	item: ItemInput,
	pax: number,
	qty: number,
	weight?: number,
	forceFree: boolean = false
): { unitPrice: number; quantity: number; tag: 'PKG' | 'FREE' | null } {
	const isFree = item.category === 'meats' || item.isFree || forceFree;
	const isPackage = item.category === 'packages';
	const unitPrice = isFree ? 0
		: isPackage ? item.price
		: item.isWeightBased ? Math.round((weight ?? 0) * (item.pricePerGram ?? 0))
		: item.price;
	const quantity = isPackage ? pax : qty;
	const tag: 'PKG' | 'FREE' | null = isFree ? 'FREE' : isPackage ? 'PKG' : null;
	return { unitPrice, quantity, tag };
}
