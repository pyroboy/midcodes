/**
 * Transient "just paid" state for lease cards.
 * Stores lease ID → { amount, timestamp } for 8 seconds after a payment.
 */

const justPaid = $state({ map: new Map<string, { amount: number; timestamp: number }>() });

export function markJustPaid(leaseId: string, amount: number) {
	const m = new Map(justPaid.map);
	m.set(leaseId, { amount, timestamp: Date.now() });
	justPaid.map = m;
	setTimeout(() => {
		const u = new Map(justPaid.map);
		u.delete(leaseId);
		justPaid.map = u;
	}, 8000);
}

export const justPaidMap = $derived(justPaid.map);
