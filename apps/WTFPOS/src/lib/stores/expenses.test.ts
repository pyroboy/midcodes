import { describe, it, expect } from 'vitest';
import { validateExpense, expenseCategories } from './expenses.utils';

describe('validateExpense', () => {
	const validArgs = ['Labor Budget', 500, 'Office supplies', 'Juan dela Cruz'] as const;

	it('returns null for a valid expense', () =>
		expect(validateExpense(...validArgs)).toBeNull());

	it('rejects empty category', () =>
		expect(validateExpense('', 500, 'desc', 'Juan')).toBe('Category is required'));

	it('rejects whitespace-only category', () =>
		expect(validateExpense('   ', 500, 'desc', 'Juan')).toBe('Category is required'));

	it('rejects category not in the allowed list', () =>
		expect(validateExpense('InvalidCat', 500, 'desc', 'Juan')).toBe('Invalid category'));

	it('accepts all valid categories', () => {
		for (const cat of expenseCategories) {
			expect(validateExpense(cat, 100, 'desc', 'Juan')).toBeNull();
		}
	});

	it('rejects zero amount', () =>
		expect(validateExpense('Rent', 0, 'desc', 'Juan')).toBe('Amount must be a positive number'));

	it('rejects negative amount', () =>
		expect(validateExpense('Rent', -1, 'desc', 'Juan')).toBe('Amount must be a positive number'));

	it('rejects NaN amount', () =>
		expect(validateExpense('Rent', NaN, 'desc', 'Juan')).toBe('Amount must be a positive number'));

	it('rejects amount over max', () =>
		expect(validateExpense('Rent', 1_000_000_000, 'desc', 'Juan')).toBe('Amount exceeds maximum allowed'));

	it('accepts amount at the max boundary', () =>
		expect(validateExpense('Rent', 999_999_999, 'desc', 'Juan')).toBeNull());

	it('rejects empty description', () =>
		expect(validateExpense('Rent', 100, '', 'Juan')).toBe('Description is required'));

	it('rejects description over 500 chars', () =>
		expect(validateExpense('Rent', 100, 'x'.repeat(501), 'Juan')).toBe(
			'Description is too long (max 500 characters)'
		));

	it('accepts description at exactly 500 chars', () =>
		expect(validateExpense('Rent', 100, 'x'.repeat(500), 'Juan')).toBeNull());

	it('rejects whitespace-only description', () =>
		expect(validateExpense('Rent', 100, '   ', 'Juan')).toBe('Description is required'));

	it('rejects empty paidBy', () =>
		expect(validateExpense('Rent', 100, 'desc', '')).toBe('Paid by is required'));

	it('rejects whitespace-only paidBy', () =>
		expect(validateExpense('Rent', 100, 'desc', '   ')).toBe('Paid by is required'));

	it('rejects paidBy over 100 chars', () =>
		expect(validateExpense('Rent', 100, 'desc', 'x'.repeat(101))).toBe(
			'Paid by name is too long (max 100 characters)'
		));

	it('accepts paidBy at exactly 100 chars', () =>
		expect(validateExpense('Rent', 100, 'desc', 'x'.repeat(100))).toBeNull());

	it('rejects Infinity as amount (exceeds max)', () =>
		expect(validateExpense('Rent', Infinity, 'desc', 'Juan')).toBe('Amount exceeds maximum allowed'));

	it('validates all fields in order — category checked before amount', () =>
		expect(validateExpense('', -1, '', '')).toBe('Category is required'));
});
