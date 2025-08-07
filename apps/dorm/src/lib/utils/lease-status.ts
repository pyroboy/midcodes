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
			daysOverdue: 0
		};
	}

	const today = new Date();
	const overdueBillings = lease.billings.filter(
		(b) => b.status === 'OVERDUE' || b.status === 'PENALIZED'
	);
	const pendingBillings = lease.billings.filter((b) => b.status === 'PENDING');
	const partialBillings = lease.billings.filter((b) => b.status === 'PARTIAL');

	// Calculate next due date from pending billings
	const nextDueDate =
		pendingBillings.length > 0
			? pendingBillings.sort(
					(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
				)[0].due_date
			: null;

	// Calculate days overdue
	const oldestOverdue = overdueBillings.sort(
		(a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
	)[0];
	const daysOverdue = oldestOverdue
		? Math.floor(
				(today.getTime() - new Date(oldestOverdue.due_date).getTime()) / (1000 * 60 * 60 * 24)
			)
		: 0;

	return {
		hasOverdue: overdueBillings.length > 0,
		hasPending: pendingBillings.length > 0,
		hasPartial: partialBillings.length > 0,
		overdueBalance: overdueBillings.reduce((sum, b) => sum + b.balance, 0),
		pendingBalance: pendingBillings.reduce((sum, b) => sum + b.balance, 0),
		partialBalance: partialBillings.reduce((sum, b) => sum + b.balance, 0),
		nextDueDate,
		daysOverdue
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
