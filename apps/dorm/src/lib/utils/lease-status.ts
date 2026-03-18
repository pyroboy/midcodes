import type { Lease, Billing } from '$lib/types/lease';

export interface LeaseBalanceStatus {
	hasOverdue: boolean;
	hasPending: boolean;
	hasPartial: boolean;
	overdueBalance: number;
	pendingBalance: number;
	partialBalance: number;
	nextDueDate: string | null;
	daysOverdue: number;
	// Utility billing specific status
	utilityOverdueBalance: number;
	utilityPendingBalance: number;
	utilityPartialBalance: number;
	hasUtilityOverdue: boolean;
	hasUtilityPending: boolean;
	hasUtilityPartial: boolean;
}

export function calculateLeaseBalanceStatus(lease: Lease): LeaseBalanceStatus {
	if (!lease.billings || lease.billings.length === 0) {
		return {
			hasOverdue: false,
			hasPending: false,
			hasPartial: false,
			overdueBalance: 0,
			pendingBalance: 0,
			partialBalance: 0,
			nextDueDate: null,
			daysOverdue: 0,
			utilityOverdueBalance: 0,
			utilityPendingBalance: 0,
			utilityPartialBalance: 0,
			hasUtilityOverdue: false,
			hasUtilityPending: false,
			hasUtilityPartial: false
		};
	}

	const today = Date.now();
	let overdueBalance = 0;
	let pendingBalance = 0;
	let partialBalance = 0;
	let utilityOverdueBalance = 0;
	let utilityPendingBalance = 0;
	let utilityPartialBalance = 0;
	let earliestPendingDueMs = Infinity;
	let earliestPendingDue: string | null = null;
	let oldestOverdueDueMs = Infinity;

	// Single pass over all billings
	for (const b of lease.billings) {
		const isUtility = b.type === 'UTILITY';
		const isOverdue = b.status === 'OVERDUE' || b.status === 'PENALIZED';
		const isPending = b.status === 'PENDING';
		const isPartial = b.status === 'PARTIAL';

		if (isOverdue) {
			if (isUtility) {
				utilityOverdueBalance += b.balance;
			} else {
				overdueBalance += b.balance;
				const dueMs = new Date(b.due_date).getTime();
				if (dueMs < oldestOverdueDueMs) oldestOverdueDueMs = dueMs;
			}
		} else if (isPending) {
			if (isUtility) {
				utilityPendingBalance += b.balance;
			} else {
				pendingBalance += b.balance;
				const dueMs = new Date(b.due_date).getTime();
				if (dueMs < earliestPendingDueMs) {
					earliestPendingDueMs = dueMs;
					earliestPendingDue = b.due_date;
				}
			}
		} else if (isPartial) {
			if (isUtility) {
				utilityPartialBalance += b.balance;
			} else {
				partialBalance += b.balance;
			}
		}
	}

	const daysOverdue = oldestOverdueDueMs < Infinity
		? Math.floor((today - oldestOverdueDueMs) / 86400000)
		: 0;

	return {
		hasOverdue: overdueBalance > 0,
		hasPending: pendingBalance > 0,
		hasPartial: partialBalance > 0,
		overdueBalance,
		pendingBalance,
		partialBalance,
		nextDueDate: earliestPendingDue,
		daysOverdue,
		hasUtilityOverdue: utilityOverdueBalance > 0,
		hasUtilityPending: utilityPendingBalance > 0,
		hasUtilityPartial: utilityPartialBalance > 0,
		utilityOverdueBalance,
		utilityPendingBalance,
		utilityPartialBalance
	};
}

export function getLeaseDisplayStatus(status: LeaseBalanceStatus) {
	if (status.hasOverdue) {
		return {
			label: 'Overdue',
			variant: 'destructive' as const,
			color: 'red',
			bgColor: 'bg-red-50',
			textColor: 'text-red-600',
			icon: 'AlertCircle'
		};
	}

	if (status.hasPartial) {
		return {
			label: 'Partial',
			variant: 'secondary' as const,
			color: 'amber',
			bgColor: 'bg-amber-50',
			textColor: 'text-amber-600',
			icon: 'AlertTriangle'
		};
	}

	if (status.hasPending) {
		return {
			label: 'Pending',
			variant: 'secondary' as const,
			color: 'orange',
			bgColor: 'bg-orange-50',
			textColor: 'text-orange-600',
			icon: 'Clock'
		};
	}

	return {
		label: 'Paid',
		variant: 'default' as const,
		color: 'green',
		bgColor: 'bg-green-50',
		textColor: 'text-green-600',
		icon: 'CheckCircle'
	};
}

export function getUtilityDisplayStatus(status: LeaseBalanceStatus) {
	if (status.hasUtilityOverdue) {
		return {
			label: 'Utility Overdue',
			variant: 'destructive' as const,
			color: 'red',
			bgColor: 'bg-red-50',
			textColor: 'text-red-600',
			icon: 'AlertCircle',
			amount: status.utilityOverdueBalance
		};
	}

	if (status.hasUtilityPartial) {
		return {
			label: 'Utility Partial',
			variant: 'secondary' as const,
			color: 'amber',
			bgColor: 'bg-amber-50',
			textColor: 'text-amber-600',
			icon: 'AlertTriangle',
			amount: status.utilityPartialBalance
		};
	}

	if (status.hasUtilityPending) {
		return {
			label: 'Utility Pending',
			variant: 'secondary' as const,
			color: 'blue',
			bgColor: 'bg-blue-50',
			textColor: 'text-blue-600',
			icon: 'Clock',
			amount: status.utilityPendingBalance
		};
	}

	return null; // No utility billings or all paid
}
