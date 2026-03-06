import { describe, it, expect } from 'vitest';
import { calculateEqualSplit, calculateLeftoverPenalty } from './payment.utils';

describe('calculateEqualSplit', () => {
	it('splits evenly with no remainder', () => {
		expect(calculateEqualSplit(1000, 4)).toEqual([250, 250, 250, 250]);
	});

	it('gives first guest ₱1 more when remainder is 1', () => {
		// 1001 ÷ 4 = 250 base, remainder 1 → [251, 250, 250, 250]
		expect(calculateEqualSplit(1001, 4)).toEqual([251, 250, 250, 250]);
	});

	it('distributes remainder across first N guests', () => {
		// 1003 ÷ 4 = 250 base, remainder 3 → [251, 251, 251, 250]
		expect(calculateEqualSplit(1003, 4)).toEqual([251, 251, 251, 250]);
	});

	it('handles a single guest (no split)', () => {
		expect(calculateEqualSplit(1000, 1)).toEqual([1000]);
	});

	it('handles odd amount across 3 guests', () => {
		// 7 ÷ 3 = 2 base, remainder 1 → [3, 2, 2]
		expect(calculateEqualSplit(7, 3)).toEqual([3, 2, 2]);
	});

	it('splits 2 guests with odd total', () => {
		// 501 ÷ 2 = 250 base, remainder 1 → [251, 250]
		expect(calculateEqualSplit(501, 2)).toEqual([251, 250]);
	});

	it('invariant: amounts always sum exactly to total', () => {
		const total = 1337;
		const splitCount = 7;
		const amounts = calculateEqualSplit(total, splitCount);
		expect(amounts.reduce((s, a) => s + a, 0)).toBe(total);
	});

	it('invariant: returns exactly splitCount amounts', () => {
		expect(calculateEqualSplit(1000, 5)).toHaveLength(5);
	});

	it('invariant: no amount is less than floor(total/splitCount)', () => {
		const amounts = calculateEqualSplit(1003, 4);
		const base = Math.floor(1003 / 4);
		expect(amounts.every(a => a >= base)).toBe(true);
	});

	it('returns empty array when total is 0', () => {
		expect(calculateEqualSplit(0, 4)).toEqual([]);
	});

	it('returns empty array when splitCount is 0', () => {
		expect(calculateEqualSplit(1000, 0)).toEqual([]);
	});
});

describe('calculateLeftoverPenalty', () => {
	it('charges 1 bracket (₱50) for exactly 100g', () => {
		expect(calculateLeftoverPenalty(100)).toBe(50);
	});

	it('charges 2 brackets for 101g (ceil to next bracket)', () => {
		expect(calculateLeftoverPenalty(101)).toBe(100);
	});

	it('charges 1 bracket minimum for 1g', () => {
		expect(calculateLeftoverPenalty(1)).toBe(50);
	});

	it('charges 1 bracket for 50g (ceil of 0.5 is 1)', () => {
		expect(calculateLeftoverPenalty(50)).toBe(50);
	});

	it('charges 2 brackets for exactly 200g', () => {
		expect(calculateLeftoverPenalty(200)).toBe(100);
	});

	it('charges 3 brackets for 201g', () => {
		expect(calculateLeftoverPenalty(201)).toBe(150);
	});

	it('returns 0 for 0g (no leftover)', () => {
		expect(calculateLeftoverPenalty(0)).toBe(0);
	});

	it('returns 0 for negative weight (safety guard)', () => {
		expect(calculateLeftoverPenalty(-100)).toBe(0);
	});

	it('respects custom rate per 100g', () => {
		// 150g at ₱100/100g = 2 brackets × ₱100 = ₱200
		expect(calculateLeftoverPenalty(150, 100)).toBe(200);
	});

	it('penalty is always a multiple of the rate', () => {
		const rate = 50;
		const penalty = calculateLeftoverPenalty(333, rate);
		expect(penalty % rate).toBe(0);
	});
});
