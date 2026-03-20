import type { Billing } from '$lib/types/lease';

/**
 * Format a billing type enum value to a human-friendly label.
 * e.g. "SECURITY_DEPOSIT" → "Security Deposit", "RENT" → "Rent"
 */
export function formatBillingType(type: string): string {
	return type
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

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
 * Format currency in compact form for tight mobile UI spaces.
 * e.g. 500 → "₱500", 1500 → "₱1.5K", 150000 → "₱150K", 1200000 → "₱1.2M"
 */
export function formatCompactCurrency(amount: number): string {
	const n = amount || 0;
	if (n >= 1_000_000) {
		const m = n / 1_000_000;
		return `₱${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
	}
	if (n >= 1_000) {
		const k = n / 1_000;
		return `₱${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
	}
	return `₱${Math.round(n).toLocaleString()}`;
}

/**
 * Humanize expense type enum values for display.
 * e.g., "OPERATIONAL" → "Operational", "EQUIPMENT_RENTAL" → "Equipment Rental"
 */
const EXPENSE_TYPE_LABELS: Record<string, string> = {
	OPERATIONAL: 'Operational',
	CAPITAL: 'Capital',
	MAINTENANCE: 'Maintenance',
	UTILITIES: 'Utilities',
	SUPPLIES: 'Supplies',
	SALARY: 'Salary',
	OTHERS: 'Other',
	EQUIPMENT_RENTAL: 'Equipment Rental'
};

export function humanizeExpenseType(type: string): string {
	return EXPENSE_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Humanize property / rental-unit type enums for display.
 * Known values get explicit labels; anything else falls back to
 * title-casing with underscores replaced by spaces.
 */
const TYPE_LABELS: Record<string, string> = {
	DORMITORY: 'Dormitory',
	PRIVATEROOM: 'Private Room',
	APARTMENT: 'Apartment',
	COMMERCIAL: 'Commercial'
};

export function humanizeType(type: string): string {
	if (!type) return '';
	if (TYPE_LABELS[type]) return TYPE_LABELS[type];
	return type
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Return the standard unit suffix for a utility meter type.
 * e.g., "ELECTRICITY" → "kWh", "WATER" → "m³"
 */
const METER_UNIT_MAP: Record<string, string> = {
	ELECTRICITY: 'kWh',
	WATER: 'm\u00B3',
	INTERNET: 'Mbps'
};

export function getMeterUnit(type: string): string {
	return METER_UNIT_MAP[type?.toUpperCase()] ?? '';
}

/**
 * Convert ALL_CAPS or SNAKE_CASE enum values to Title Case for display.
 * e.g., "ELECTRICITY" → "Electricity", "RENTAL_UNIT" → "Rental Unit"
 */
export function formatEnumLabel(value: string): string {
	if (!value) return '';
	return value
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Format a lease status enum value to title-case for display.
 * e.g., "ACTIVE" → "Active", "TERMINATED" → "Terminated"
 */
export function formatLeaseStatus(status: string): string {
	if (!status) return 'Inactive';
	return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

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
