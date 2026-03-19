import type { Billing } from '$lib/types/lease';

/**
 * Format a date string to a readable format
 * @param dateStr - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Format a number as currency with PHP peso symbol
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP'
	}).format(amount || 0);
};

/**
 * Unified status → Tailwind classes map (covers ALL entity types)
 * Use this instead of local getStatusColor() functions
 */
const STATUS_COLOR_MAP: Record<string, string> = {
	ACTIVE: 'bg-green-100 text-green-800 border-green-200',
	INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
	TERMINATED: 'bg-red-100 text-red-800 border-red-200',
	EXPIRED: 'bg-orange-100 text-orange-800 border-orange-200',
	PAID: 'bg-green-100 text-green-800 border-green-200',
	PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
	PARTIAL: 'bg-blue-100 text-blue-800 border-blue-200',
	OVERDUE: 'bg-red-100 text-red-800 border-red-200',
	PENALIZED: 'bg-red-200 text-red-900 border-red-300',
	'OVERDUE-PARTIAL': 'bg-orange-200 text-orange-900 border-orange-300',
	BLACKLISTED: 'bg-red-100 text-red-800 border-red-200',
	ONGOING: 'bg-blue-100 text-blue-800 border-blue-200',
	COMPLETED: 'bg-green-100 text-green-800 border-green-200',
	APPROVED: 'bg-green-100 text-green-800 border-green-200',
	REJECTED: 'bg-red-100 text-red-800 border-red-200',
	MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
	VACANT: 'bg-gray-100 text-gray-700 border-gray-200',
	OCCUPIED: 'bg-green-100 text-green-800 border-green-200',
	RESERVED: 'bg-blue-100 text-blue-800 border-blue-200',
	PLANNED: 'bg-blue-100 text-blue-800 border-blue-200'
};

export function getStatusClasses(status: string): string {
	return STATUS_COLOR_MAP[status?.toUpperCase()] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get the appropriate variant for a status badge
 * @param status - The status string
 * @returns The variant name for the badge component
 */
export function getStatusVariant(
	status: string
): 'default' | 'destructive' | 'outline' | 'secondary' {
	switch (status?.toUpperCase()) {
		case 'ACTIVE':
			return 'default';
		case 'INACTIVE':
			return 'secondary';
		case 'TERMINATED':
			return 'destructive';
		case 'EXPIRED':
			return 'outline';
		default:
			return 'secondary';
	}
}

/**
 * Get the appropriate Tailwind classes for a billing status
 * @param status - The billing status
 * @returns Tailwind classes for the status badge
 */
export function getBillingStatusColor(status: string): string {
	const colors: { [key: string]: string } = {
		PENDING: 'bg-yellow-100 text-yellow-800',
		PARTIAL: 'bg-blue-100 text-blue-800',
		PAID: 'bg-green-100 text-green-800',
		OVERDUE: 'bg-red-100 text-red-800',
		PENALIZED: 'bg-red-200 text-red-900',
		'OVERDUE-PARTIAL': 'bg-orange-200 text-orange-900'
	};
	return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Determine the display status for a billing based on its properties
 * @param billing - The billing object
 * @returns The display status string
 */
export function getDisplayStatus(billing: Billing): string {
	if (billing.balance <= 0) {
		return 'PAID';
	}
	if (billing.penalty_amount > 0) {
		return 'PENALIZED';
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const isOverdue = new Date(billing.due_date) < today;

	if (isOverdue) {
		if (billing.status === 'PARTIAL') {
			return 'OVERDUE-PARTIAL';
		}
		return 'OVERDUE';
	}

	return billing.status; // PENDING or PARTIAL
}
