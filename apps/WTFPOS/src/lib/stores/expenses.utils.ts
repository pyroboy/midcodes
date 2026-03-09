/**
 * Pure validation logic for expenses — no side-effect imports, safe to unit test.
 */

// ─── Category Groups ──────────────────────────────────────────────────────────
export const expenseCategoryGroups: { label: string; options: { value: string; label: string }[] }[] = [
	{
		label: 'Overhead',
		options: [
			{ value: 'Rent', label: 'Rent' },
			{ value: 'Wages', label: 'Wages' },
			{ value: 'Wages (Actual)', label: 'Wages (Actual)' },
			{ value: 'Labor Budget', label: 'Labor Budget' },
			{ value: 'Labor Allocation (Budget)', label: 'Labor Allocation (Budget)' },
			{ value: 'Employee Benefits', label: 'Employee Benefits' },
		]
	},
	{
		label: 'Procurement',
		options: [
			{ value: 'Meat Procurement', label: 'Meat Procurement' },
			{ value: 'Produce & Sides', label: 'Produce & Sides' },
		]
	},
	{
		label: 'Utilities',
		options: [
			{ value: 'Electricity', label: 'Electricity' },
			{ value: 'Gas/LPG', label: 'Gas/LPG' },
			{ value: 'Water', label: 'Water' },
			{ value: 'Internet', label: 'Internet' },
			{ value: 'Utilities', label: 'Utilities (General)' },
		]
	},
	{
		label: 'Operations',
		options: [
			{ value: 'Petty Cash', label: 'Petty Cash' },
			{ value: 'Petty Cash Replenishment', label: 'Petty Cash Replenishment' },
			{ value: 'Repairs & Maintenance', label: 'Repairs & Maintenance' },
			{ value: 'Miscellaneous', label: 'Miscellaneous' },
		]
	},
];

// Flat list derived from groups (used for validation + legacy select fallback)
export const expenseCategories: string[] = expenseCategoryGroups.flatMap(g => g.options.map(o => o.value));

// ─── Group mapping helpers ────────────────────────────────────────────────────
const CATEGORY_TO_GROUP: Record<string, string> = {};
for (const group of expenseCategoryGroups) {
	for (const opt of group.options) {
		CATEGORY_TO_GROUP[opt.value] = group.label;
	}
}

export function getCategoryGroup(category: string): string {
	return CATEGORY_TO_GROUP[category] ?? 'Other';
}

// Badge classes per group — Tailwind utility strings
const GROUP_BADGE_CLASSES: Record<string, string> = {
	Overhead: 'bg-purple-100 text-purple-700',
	Procurement: 'bg-orange-100 text-orange-700',
	Utilities: 'bg-blue-100 text-blue-700',
	Operations: 'bg-gray-100 text-gray-700',
	Other: 'bg-gray-100 text-gray-500',
};

export function getCategoryBadgeClass(category: string): string {
	const group = getCategoryGroup(category);
	return GROUP_BADGE_CLASSES[group] ?? GROUP_BADGE_CLASSES.Other;
}

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
