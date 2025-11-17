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

	const today = new Date();
	
	// Separate regular billings from utility billings
	const regularBillings = lease.billings.filter((b) => b.type !== 'UTILITY');
	const utilityBillings = lease.billings.filter((b) => b.type === 'UTILITY');
	
	// Regular billings
	const overdueBillings = regularBillings.filter(
		(b) => b.status === 'OVERDUE' || b.status === 'PENALIZED'
	);
	const pendingBillings = regularBillings.filter((b) => b.status === 'PENDING');
	const partialBillings = regularBillings.filter((b) => b.status === 'PARTIAL');
	
	// Utility billings
	const utilityOverdueBillings = utilityBillings.filter(
		(b) => b.status === 'OVERDUE' || b.status === 'PENALIZED'
	);
	const utilityPendingBillings = utilityBillings.filter((b) => b.status === 'PENDING');
	const utilityPartialBillings = utilityBillings.filter((b) => b.status === 'PARTIAL');

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
		daysOverdue,
		// Utility billing status
		hasUtilityOverdue: utilityOverdueBillings.length > 0,
		hasUtilityPending: utilityPendingBillings.length > 0,
		hasUtilityPartial: utilityPartialBillings.length > 0,
		utilityOverdueBalance: utilityOverdueBillings.reduce((sum, b) => sum + b.balance, 0),
		utilityPendingBalance: utilityPendingBillings.reduce((sum, b) => sum + b.balance, 0),
		utilityPartialBalance: utilityPartialBillings.reduce((sum, b) => sum + b.balance, 0)
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
