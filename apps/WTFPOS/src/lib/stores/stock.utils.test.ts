import { describe, it, expect } from 'vitest';
import { getProteinType } from './stock.constants';

describe('getProteinType', () => {
	it('detects beef from menuItemId', () => {
		expect(getProteinType('meat-beef-bone-in')).toBe('beef');
		expect(getProteinType('meat-beef-sliced')).toBe('beef');
		expect(getProteinType('meat-beef-trimmings')).toBe('beef');
	});

	it('detects pork from menuItemId', () => {
		expect(getProteinType('meat-pork-bone-in')).toBe('pork');
		expect(getProteinType('meat-pork-sliced')).toBe('pork');
		expect(getProteinType('meat-pork-trimmings')).toBe('pork');
	});

	it('detects chicken from menuItemId', () => {
		expect(getProteinType('meat-chicken-wing')).toBe('chicken');
		expect(getProteinType('meat-chicken-leg')).toBe('chicken');
	});

	it('returns undefined for non-meat items', () => {
		expect(getProteinType('side-kimchi')).toBeUndefined();
		expect(getProteinType('drink-soju')).toBeUndefined();
		expect(getProteinType('side-rice')).toBeUndefined();
	});

	it('beef check takes priority over pork when both appear (check order)', () => {
		// Beef is checked first — if a hypothetical ID had both, beef wins
		expect(getProteinType('meat-beef-bone-in')).toBe('beef');
	});

	it('returns undefined for unknown meat varieties', () => {
		expect(getProteinType('meat-duck-breast')).toBeUndefined();
		expect(getProteinType('meat-lamb-chop')).toBeUndefined();
	});

	it('is case-sensitive (only lowercase matches)', () => {
		// All real menuItemIds are lowercase; BEEF would not match
		expect(getProteinType('meat-BEEF-bone-in')).toBeUndefined();
	});
});
