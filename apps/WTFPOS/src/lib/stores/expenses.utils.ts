/**
 * Pure validation logic for expenses — no side-effect imports, safe to unit test.
 */

// ─── Category Groups ──────────────────────────────────────────────────────────
export const expenseCategoryGroups: { label: string; color: string; options: { value: string; label: string; icon: string }[] }[] = [
	{
		label: 'Staff & Labor',
		color: 'purple',
		options: [
			{ value: 'Daily Wages', label: 'Daily Wages', icon: '👷' },
			{ value: 'Benefits (SSS/PhilHealth)', label: 'Benefits (SSS/PhilHealth)', icon: '🏥' },
			{ value: 'Staff Meals', label: 'Staff Meals', icon: '🍱' },
		]
	},
	{
		label: 'Procurement',
		color: 'orange',
		options: [
			{ value: 'Meat & Protein', label: 'Meat & Protein', icon: '🥩' },
			{ value: 'Sides & Supplies', label: 'Sides & Supplies', icon: '🥬' },
		]
	},
	{
		label: 'Utilities',
		color: 'blue',
		options: [
			{ value: 'Electricity', label: 'Electricity', icon: '⚡' },
			{ value: 'Water', label: 'Water', icon: '💧' },
			{ value: 'Gas / LPG', label: 'Gas / LPG', icon: '🔥' },
			{ value: 'Internet', label: 'Internet', icon: '📶' },
		]
	},
	{
		label: 'Operations',
		color: 'gray',
		options: [
			{ value: 'Rent', label: 'Rent', icon: '🏠' },
			{ value: 'Repairs & Maintenance', label: 'Repairs & Maintenance', icon: '🔧' },
			{ value: 'Other / Miscellaneous', label: 'Other / Miscellaneous', icon: '📦' },
		]
	},
];

// Flat list derived from groups (used for validation + legacy select fallback)
export const expenseCategories: string[] = expenseCategoryGroups.flatMap(g => g.options.map(o => o.value));

// ─── Group mapping helpers ────────────────────────────────────────────────────
const CATEGORY_TO_GROUP: Record<string, string> = {};
const CATEGORY_TO_ICON: Record<string, string> = {};
for (const group of expenseCategoryGroups) {
	for (const opt of group.options) {
		CATEGORY_TO_GROUP[opt.value] = group.label;
		CATEGORY_TO_ICON[opt.value] = opt.icon;
	}
}

export function getCategoryGroup(category: string): string {
	return CATEGORY_TO_GROUP[category] ?? 'Operations';
}

export function getCategoryIcon(category: string): string {
	return CATEGORY_TO_ICON[category] ?? '📦';
}

// Badge classes per group — Tailwind utility strings
const GROUP_BADGE_CLASSES: Record<string, string> = {
	'Staff & Labor': 'bg-purple-100 text-purple-700',
	'Procurement': 'bg-orange-100 text-orange-700',
	'Utilities': 'bg-blue-100 text-blue-700',
	'Operations': 'bg-gray-100 text-gray-700',
};

export function getCategoryBadgeClass(category: string): string {
	const group = getCategoryGroup(category);
	return GROUP_BADGE_CLASSES[group] ?? GROUP_BADGE_CLASSES.Operations;
}

// Group border-left color for step 1 grid (Tailwind class)
const GROUP_BORDER_COLORS: Record<string, string> = {
	'Staff & Labor': 'border-l-purple-400',
	'Procurement': 'border-l-orange-400',
	'Utilities': 'border-l-blue-400',
	'Operations': 'border-l-gray-400',
};

export function getGroupBorderColor(group: string): string {
	return GROUP_BORDER_COLORS[group] ?? 'border-l-gray-400';
}

// ─── Legacy category migration map ───────────────────────────────────────────
// Maps old category names to the new simplified names.
// Used by RxDB migration (expense schema v5→v6) and for display of old records.
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
	'Wages':                       'Daily Wages',
	'Wages (Actual)':              'Daily Wages',
	'Labor Budget':                'Daily Wages',
	'Labor Allocation (Budget)':   'Daily Wages',
	'Employee Benefits':           'Benefits (SSS/PhilHealth)',
	'Meat Procurement':            'Meat & Protein',
	'Produce & Sides':             'Sides & Supplies',
	'Gas/LPG':                     'Gas / LPG',
	'Utilities':                   'Other / Miscellaneous',
	'Petty Cash':                  'Other / Miscellaneous',
	'Petty Cash Replenishment':    'Other / Miscellaneous',
	'Miscellaneous':               'Other / Miscellaneous',
};

/** Resolves a category name — returns the new name if legacy, or the original if current */
export function resolveCategory(category: string): string {
	return LEGACY_CATEGORY_MAP[category] ?? category;
}

// ─── Paid-by options (touch pill buttons) ─────────────────────────────────────
export const PAID_BY_OPTIONS = [
	'Cash from Register',
	'GCash',
	'Maya',
	'Company Card',
	"Owner's Pocket",
] as const;

export type PaidByOption = typeof PAID_BY_OPTIONS[number];

export function validateExpense(
	category: string,
	amount: number,
	description: string,
	paidBy: string
): string | null {
	if (!category || category.trim() === '') return 'Category is required';
	if (!expenseCategories.includes(category)) return 'Invalid category';
	if (typeof amount !== 'number' || isNaN(amount) || amount <= 0)
		return 'Amount must be a positive number';
	if (amount > 999999999) return 'Amount exceeds maximum allowed';
	if (!description || description.trim() === '') return 'Description is required';
	if (description.length > 500) return 'Description is too long (max 500 characters)';
	if (!paidBy || paidBy.trim() === '') return 'Paid by is required';
	if (paidBy.length > 100) return 'Paid by name is too long (max 100 characters)';
	return null;
}
