import { describe, it, expect } from 'vitest';
import { STOCK_ITEMS_LIST } from './stock.constants';

const VALID_CATEGORIES = new Set(['Meats', 'Sides', 'Dishes', 'Drinks']);
const VALID_LOCATIONS = new Set(['tag', 'pgl', 'wh-tag']);
const VALID_PROTEINS = new Set(['beef', 'pork', 'chicken', 'other']);

describe('STOCK_ITEMS_LIST — structural integrity', () => {
	it('contains entries', () => {
		expect(STOCK_ITEMS_LIST.length).toBeGreaterThan(0);
	});

	it('every item has all required fields non-empty', () => {
		for (const item of STOCK_ITEMS_LIST) {
			expect(item.menuItemId, `menuItemId on "${item.name}"`).toBeTruthy();
			expect(item.name, `name on menuItemId "${item.menuItemId}"`).toBeTruthy();
			expect(item.category, `category on "${item.name}"`).toBeTruthy();
			expect(item.locationId, `locationId on "${item.name}"`).toBeTruthy();
			expect(item.unit, `unit on "${item.name}"`).toBeTruthy();
		}
	});

	it('every item has minLevel > 0', () => {
		for (const item of STOCK_ITEMS_LIST) {
			expect(item.minLevel, `minLevel on "${item.name}"`).toBeGreaterThan(0);
		}
	});

	it('all categories are valid', () => {
		for (const item of STOCK_ITEMS_LIST) {
			expect(
				VALID_CATEGORIES.has(item.category),
				`invalid category "${item.category}" on "${item.name}"`
			).toBe(true);
		}
	});

	it('all locationIds are valid', () => {
		for (const item of STOCK_ITEMS_LIST) {
			expect(
				VALID_LOCATIONS.has(item.locationId),
				`invalid locationId "${item.locationId}" on "${item.name}"`
			).toBe(true);
		}
	});

	it('meat items all have a valid proteinType', () => {
		const meats = STOCK_ITEMS_LIST.filter(i => i.category === 'Meats');
		expect(meats.length).toBeGreaterThan(0);
		for (const meat of meats) {
			expect(meat.proteinType, `proteinType missing on meat "${meat.name}"`).toBeTruthy();
			expect(
				VALID_PROTEINS.has(meat.proteinType!),
				`invalid proteinType "${meat.proteinType}" on "${meat.name}"`
			).toBe(true);
		}
	});

	it('has entries for both tag and pgl branches', () => {
		const locations = new Set(STOCK_ITEMS_LIST.map(i => i.locationId));
		expect(locations.has('tag')).toBe(true);
		expect(locations.has('pgl')).toBe(true);
	});

	it('tag and pgl branches have the same set of meat menuItemIds', () => {
		const tagMeats = STOCK_ITEMS_LIST
			.filter(i => i.locationId === 'tag' && i.category === 'Meats')
			.map(i => i.menuItemId)
			.sort();
		const pglMeats = STOCK_ITEMS_LIST
			.filter(i => i.locationId === 'pgl' && i.category === 'Meats')
			.map(i => i.menuItemId)
			.sort();
		expect(tagMeats).toEqual(pglMeats);
	});

	it('no item has a negative minLevel', () => {
		for (const item of STOCK_ITEMS_LIST) {
			expect(item.minLevel).toBeGreaterThanOrEqual(0);
		}
	});

	it('no duplicate (menuItemId + locationId) pairs', () => {
		const seen = new Set<string>();
		const duplicates: string[] = [];
		for (const item of STOCK_ITEMS_LIST) {
			const key = `${item.menuItemId}:${item.locationId}`;
			if (seen.has(key)) duplicates.push(key);
			seen.add(key);
		}
		expect(duplicates).toEqual([]);
	});
});
