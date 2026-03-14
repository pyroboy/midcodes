/**
 * POS Utility Functions — Pure calculations with no side effects.
 */
import type { Order } from '$lib/types';

// ─── Package Color Tokens ─────────────────────────────────────────────────────
// Single source of truth for Pork / Beef / Beef+Pork color identity.
// Used by POS FloorPlan, Weigh Station, and Dispatch to ensure visual consistency.

export const PKG_COLORS = {
  'pkg-pork': {
    label:   '#be185d',   // rose-700
    fill:    '#fce7f3',   // rose-100
    stroke:  '#be185d',   // rose-700
    bg:      'bg-rose-50',
    text:    'text-rose-700',
    border:  'border-rose-200',
    accent:  'border-l-4 border-rose-500',
    name:    'PORK',
    emoji:   '🐷',
  },
  'pkg-beef': {
    label:   '#1d4ed8',   // blue-700
    fill:    '#dbeafe',   // blue-100
    stroke:  '#1d4ed8',   // blue-700
    bg:      'bg-blue-50',
    text:    'text-blue-700',
    border:  'border-blue-200',
    accent:  'border-l-4 border-blue-500',
    name:    'BEEF',
    emoji:   '🐄',
  },
  'pkg-combo': {
    label:   '#ea580c',   // orange-600 (brand accent)
    fill:    '#fed7aa',   // orange-100
    stroke:  '#ea580c',   // orange-600
    bg:      'bg-orange-50',
    text:    'text-orange-700',
    border:  'border-orange-200',
    accent:  'border-l-4 border-orange-500',
    name:    'BEEF+PORK',
    emoji:   '🔥',
  },
} as const;

export type PkgColorKey = keyof typeof PKG_COLORS;

export function getPkgColors(packageId: string | null | undefined) {
  if (!packageId) return null;
  return PKG_COLORS[packageId as PkgColorKey] ?? null;
}

export function getPkgProtein(packageId: string | null | undefined): string | null {
  return getPkgColors(packageId)?.name ?? null;
}

export function getPkgEmoji(packageId: string | null | undefined): string {
  return getPkgColors(packageId)?.emoji ?? '';
}

/**
 * Derive protein color tokens from the specific meat item name.
 * Used at the weigh station so that "Sliced Beef" from a combo order
 * shows BEEF (blue), not BEEF+PORK (orange).
 *
 * Returns pkg-beef colors if the name contains "beef",
 * pkg-pork colors if it contains "pork", null otherwise.
 */
export function getItemProteinColors(itemName: string | null | undefined) {
  if (!itemName) return null;
  const lower = itemName.toLowerCase();
  if (lower.includes('beef')) return PKG_COLORS['pkg-beef'];
  if (lower.includes('pork')) return PKG_COLORS['pkg-pork'];
  return null;
}

/** Round to 2 decimal places (centavo precision for BIR compliance). */
function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

export function calculateOrderTotals(order: Pick<Order, 'items' | 'discountType' | 'discountEntries' | 'discountPax' | 'pax' | 'childPax' | 'freePax'>): { subtotal: number, discountAmount: number, vatAmount: number, total: number } {
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
	// VAT removed from qualifying (SC/PWD) share — must be deducted from total
	let exemptedVat = 0;

	if (order.discountEntries && Object.keys(order.discountEntries).length > 0) {
		const keys = Object.keys(order.discountEntries) as (keyof typeof order.discountEntries)[];
		const hasBusinessDiscount = keys.some(k => k === 'promo' || k === 'comp' || k === 'service_recovery');

		if (hasBusinessDiscount) {
			disc = sub;
			vat = 0;
		} else {
			let totalQualifyingPax = 0;
			for (const key of keys) {
				const entry = order.discountEntries[key];
				if (entry) totalQualifyingPax += entry.pax ?? entry.discountPax ?? 0;
			}
			const totalPax = Math.max(1, order.pax);
			const qualifyingPax = Math.max(0, Math.min(totalQualifyingPax, totalPax));
			const nonQualifyingPax = totalPax - qualifyingPax;

			const qualifyingShare = sub * (qualifyingPax / totalPax);
			const taxableShare = sub * (nonQualifyingPax / totalPax);

			// BIR Rule: SC/PWD are VAT-exempt, then 20% discount on VAT-exempt base
			const vatExemptSale = round2(qualifyingShare / 1.12);
			disc = round2(vatExemptSale * 0.20);
			exemptedVat = round2(qualifyingShare - vatExemptSale);
			// Only non-qualifying share carries VAT
			vat = round2(taxableShare - taxableShare / 1.12);
		}
	} else if (order.discountType === 'senior' || order.discountType === 'pwd') {
		const totalPax = Math.max(1, order.pax);
		const qualifyingPax = Math.max(0, Math.min(order.discountPax ?? 1, totalPax));
		const nonQualifyingPax = totalPax - qualifyingPax;

		const qualifyingShare = sub * (qualifyingPax / totalPax);
		const taxableShare = sub * (nonQualifyingPax / totalPax);

		// BIR Rule: SC/PWD are VAT-exempt, then 20% discount on VAT-exempt base
		const vatExemptSale = round2(qualifyingShare / 1.12);
		disc = round2(vatExemptSale * 0.20);
		exemptedVat = round2(qualifyingShare - vatExemptSale);

		// Only non-qualifying share is taxable
		vat = round2(taxableShare - taxableShare / 1.12);
	}
	else if (order.discountType === 'comp' || order.discountType === 'service_recovery' || order.discountType === 'promo') {
		disc = sub;
		vat = 0;
	} else {
		// Standard 12% inclusive VAT
		vat = round2(sub - sub / 1.12);
	}

	// Total = subtotal - exempted VAT (SC/PWD are VAT-free) - 20% discount
	const net = round2(Math.max(0, sub - exemptedVat - disc));
	return { subtotal: sub, discountAmount: disc, vatAmount: vat, total: net };
}
