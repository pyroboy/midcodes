/**
 * Pure payment calculations — no side effects, safe to unit test.
 */

const PAYMENT_LABELS: Record<string, string> = {
	cash: 'Cash',
	gcash: 'GCash',
	maya: 'Maya',
	card: 'Card',
};

/** Formats a payment method code to its display label. */
export function formatPaymentMethod(method: string): string {
	return PAYMENT_LABELS[method] ?? method;
}

/**
 * Distributes a total peso amount equally across N sub-bills.
 * When total doesn't divide evenly, the first `remainder` guests each pay ₱1 more.
 * Returns an array of integer amounts that always sum exactly to `total`.
 */
export function calculateEqualSplit(total: number, splitCount: number): number[] {
	if (total <= 0 || splitCount <= 0) return [];
	const baseAmount = Math.floor(total / splitCount);
	const remainder = total % splitCount;
	const amounts = Array.from({ length: splitCount }, (_, i) =>
		baseAmount + (i < remainder ? 1 : 0)
	);
	// Float-safe correction guard (practically a no-op with integer totals)
	const sum = amounts.reduce((s, a) => s + a, 0);
	if (sum !== total) amounts[amounts.length - 1] += total - sum;
	return amounts;
}

/**
 * Computes the leftover meat penalty at checkout.
 * BIR rule: ₱50 per 100g (or partial 100g bracket) of unconsumed meat.
 */
export function calculateLeftoverPenalty(weightGrams: number, ratePerHundredGrams: number = 50): number {
	if (weightGrams <= 0) return 0;
	return Math.ceil(weightGrams / 100) * ratePerHundredGrams;
}
