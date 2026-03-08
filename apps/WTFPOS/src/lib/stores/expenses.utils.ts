/**
 * Pure validation logic for expenses — no side-effect imports, safe to unit test.
 */

export const expenseCategories = [
	'Labor Budget',
	'Petty Cash',
	'Meat Procurement',
	'Produce & Sides',
	'Utilities',
	'Electricity',
	'Gas/LPG',
	'Water',
	'Internet',
	'Wages',
	'Rent',
	'Miscellaneous'
];

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
