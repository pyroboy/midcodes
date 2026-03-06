import { describe, it, expect } from 'vitest';
import { formatAuditDuration } from './audit.utils';

describe('formatAuditDuration — standard (tableClosed)', () => {
	it('formats 90s as " [1m 30s]"', () => {
		expect(formatAuditDuration(90)).toBe(' [1m 30s]');
	});

	it('formats 0s as " [0m 0s]"', () => {
		expect(formatAuditDuration(0)).toBe(' [0m 0s]');
	});

	it('formats 65s as " [1m 5s]"', () => {
		expect(formatAuditDuration(65)).toBe(' [1m 5s]');
	});

	it('formats exactly 60s as " [1m 0s]"', () => {
		expect(formatAuditDuration(60)).toBe(' [1m 0s]');
	});

	it('formats large values correctly', () => {
		// 2h = 7200s → [120m 0s]
		expect(formatAuditDuration(7200)).toBe(' [120m 0s]');
	});

	it('returns empty string for null', () => {
		expect(formatAuditDuration(null)).toBe('');
	});

	it('returns empty string for undefined', () => {
		expect(formatAuditDuration(undefined)).toBe('');
	});
});

describe('formatAuditDuration — seated (orderVoided / zeroValueCancellation)', () => {
	it('formats 90s as " [seated 1m 30s]"', () => {
		expect(formatAuditDuration(90, true)).toBe(' [seated 1m 30s]');
	});

	it('formats 0s as " [seated 0m 0s]"', () => {
		expect(formatAuditDuration(0, true)).toBe(' [seated 0m 0s]');
	});

	it('formats 125s as " [seated 2m 5s]"', () => {
		expect(formatAuditDuration(125, true)).toBe(' [seated 2m 5s]');
	});

	it('returns empty string for null even with seated=true', () => {
		expect(formatAuditDuration(null, true)).toBe('');
	});

	it('default seated=false matches non-seated output', () => {
		expect(formatAuditDuration(90)).toBe(formatAuditDuration(90, false));
	});
});
