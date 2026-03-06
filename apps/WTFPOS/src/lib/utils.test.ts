import { describe, it, expect } from 'vitest';
import { formatPeso, formatCountdown, cn } from './utils';

describe('formatPeso', () => {
	it('formats whole pesos', () => expect(formatPeso(500)).toBe('₱500.00'));
	it('formats with centavos', () => expect(formatPeso(1234.5)).toBe('₱1,234.50'));
	it('formats zero', () => expect(formatPeso(0)).toBe('₱0.00'));
	it('formats large amounts with comma separator', () => expect(formatPeso(10000)).toBe('₱10,000.00'));
	it('always produces exactly 2 decimal places', () => {
		// Intl rounding: 1.005 may be subject to float precision, but minimumFractionDigits=2 guarantees 2 places
		expect(formatPeso(1.1)).toMatch(/\d+\.\d{2}$/);
	});
	it('formats negative amounts with a minus sign', () => {
		// Refunds / credits appear as negative; locale may vary in symbol placement
		const result = formatPeso(-100);
		expect(result).toContain('100.00');
		expect(result).toMatch(/-/); // minus sign present
	});
});

describe('formatCountdown', () => {
	it('formats seconds to MM:SS', () => expect(formatCountdown(150)).toBe('02:30'));
	it('handles zero', () => expect(formatCountdown(0)).toBe('00:00'));
	it('pads single-digit minutes and seconds', () => expect(formatCountdown(65)).toBe('01:05'));
	it('handles exactly one hour', () => expect(formatCountdown(3600)).toBe('60:00'));
	it('handles 1 second', () => expect(formatCountdown(1)).toBe('00:01'));
	it('handles 59 seconds', () => expect(formatCountdown(59)).toBe('00:59'));
	it('handles 60 seconds (boundary)', () => expect(formatCountdown(60)).toBe('01:00'));
});

describe('cn', () => {
	it('merges class names', () => expect(cn('a', 'b')).toBe('a b'));
	it('handles conditional falsy values', () => expect(cn('base', false && 'hidden')).toBe('base'));
	it('handles undefined input', () => expect(cn('base', undefined)).toBe('base'));
	it('deduplicates conflicting Tailwind classes (last wins)', () =>
		expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500'));
	it('deduplicates conflicting bg classes', () =>
		expect(cn('bg-white', 'bg-accent')).toBe('bg-accent'));
	it('deduplicates conflicting padding classes', () =>
		expect(cn('p-2', 'p-4')).toBe('p-4'));
	it('returns empty string for no args', () => expect(cn()).toBe(''));
	it('accepts object syntax for conditional classes', () =>
		expect(cn({ 'font-bold': true, 'font-normal': false })).toBe('font-bold'));
	it('accepts an array of class names', () =>
		expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2'));
});
