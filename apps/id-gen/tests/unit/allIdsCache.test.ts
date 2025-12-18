import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Force browser mode for cache modules (they use `$app/environment`)
vi.mock('$app/environment', () => ({ browser: true }));

import {
	ALL_IDS_CACHE_TTL_MS,
	clearAllIdsCache,
	isAllIdsCacheFresh,
	getStorageKey as storageKey, // Fix renamed import
	readAllIdsCache,
	writeAllIdsCache,
	type AllIdsCacheSnapshot
} from '../../src/routes/all-ids/allIdsCache';

function makeSnapshot(overrides: Partial<AllIdsCacheSnapshot> = {}): AllIdsCacheSnapshot {
	return {
		version: 1,
		cachedAt: Date.now(),
		cards: [
			{
				idcard_id: '1',
				template_name: 'T1',
				front_image: null,
				back_image: null,
				created_at: new Date('2025-01-01T00:00:00.000Z'),
				fields: {}
			}
		],
		totalCount: 1,
		hasMore: false,
		nextOffset: 1,
		templateDimensions: { T1: { width: 1013, height: 638, orientation: 'landscape' as const, unit: 'pixels' } },
		templateFields: { T1: [{ variableName: 'Name', side: 'front' }] },
		ui: { searchQuery: '', cardMinWidth: 250, viewMode: 'card' },
		scrollTop: 0,
		...overrides
	};
}

// Emulate dynamic import for testing (or just use direct imports since we are in same context)
const importAllIdsCache = async () => ({
	writeAllIdsCache,
	readAllIdsCache,
	clearAllIdsCache,
	isAllIdsCacheFresh,
	getStorageKey: storageKey
});

describe('allIdsCache', () => {
	const scopeKey = 'test-scope'; // Define scopeKey

	beforeEach(() => {
		window.sessionStorage.clear();
		clearAllIdsCache(); // clear all scopes
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('writeAllIdsCache + readAllIdsCache round-trip (scoped)', () => {
		const scopeKey = 'user:org';
		const snap = makeSnapshot({ scrollTop: 123, ui: { searchQuery: 'abc', cardMinWidth: 200, viewMode: 'table' } });

		writeAllIdsCache(snap, scopeKey);

		const read = readAllIdsCache(scopeKey);
		expect(read).not.toBeNull();
		expect(read?.scrollTop).toBe(123);
		expect(read?.ui.viewMode).toBe('table');
		expect(read?.ui.searchQuery).toBe('abc');
	});

	it('scope isolation: different scopeKey does not see data', () => {
		const snap = makeSnapshot();
		writeAllIdsCache(snap, 'scope-a');

		expect(readAllIdsCache('scope-a')).not.toBeNull();
		expect(readAllIdsCache('scope-b')).toBeNull();
	});

	it('clearAllIdsCache(scopeKey) only clears that scope', () => {
		const key = storageKey(scopeKey);

		window.sessionStorage.setItem(key, '{not valid json');
		expect(window.sessionStorage.getItem(key)).toBeTruthy();

		const read = readAllIdsCache(scopeKey);
		expect(read).toBeNull();
		expect(window.sessionStorage.getItem(key)).toBeNull();
	});

	it('readAllIdsCache evicts invalid shape snapshots from sessionStorage', async () => {
		const { readAllIdsCache } = await importAllIdsCache();
		const scopeKey = 'u1:o1';
		const key = storageKey(scopeKey);

		// Valid JSON but invalid schema (missing required fields)
		window.sessionStorage.setItem(key, JSON.stringify({ version: 1, cachedAt: Date.now(), value: 'nope' }));
		expect(window.sessionStorage.getItem(key)).toBeTruthy();

		const read = readAllIdsCache(scopeKey);
		expect(read).toBeNull();
		expect(window.sessionStorage.getItem(key)).toBeNull();
	});

	it('clearAllIdsCache(scopeKey) clears only that scope', async () => {
		const { writeAllIdsCache, readAllIdsCache, clearAllIdsCache } = await importAllIdsCache();
		const scopeA = 'u1:o1';
		const scopeB = 'u2:o2';

		writeAllIdsCache(makeSnapshot({ cachedAt: Date.now(), totalCount: 1 }) as any, scopeA);
		writeAllIdsCache(makeSnapshot({ cachedAt: Date.now(), totalCount: 2 }) as any, scopeB);

		expect(readAllIdsCache(scopeA)?.cards).toHaveLength(1);
		expect(readAllIdsCache(scopeB)?.cards).toHaveLength(1); // cards length is 1 in makeSnapshot default

		clearAllIdsCache(scopeA);

		expect(readAllIdsCache(scopeA)).toBeNull();
		expect(readAllIdsCache(scopeB)?.cards).toHaveLength(1);
		expect(window.sessionStorage.getItem(storageKey(scopeA))).toBeNull();
		expect(window.sessionStorage.getItem(storageKey(scopeB))).toBeTruthy();
	});

	it('clearAllIdsCache() clears all scopes', async () => {
		const { writeAllIdsCache, readAllIdsCache, clearAllIdsCache } = await importAllIdsCache();
		const scopeA = 'u1:o1';
		const scopeB = 'u2:o2';

		writeAllIdsCache(makeSnapshot({ cachedAt: Date.now(), totalCount: 1 }) as any, scopeA);
		writeAllIdsCache(makeSnapshot({ cachedAt: Date.now(), totalCount: 2 }) as any, scopeB);

		expect(readAllIdsCache(scopeA)).not.toBeNull();
		expect(readAllIdsCache(scopeB)).not.toBeNull();

		clearAllIdsCache();

		expect(readAllIdsCache(scopeA)).toBeNull();
		expect(readAllIdsCache(scopeB)).toBeNull();
		expect(window.sessionStorage.getItem(storageKey(scopeA))).toBeNull();
		expect(window.sessionStorage.getItem(storageKey(scopeB))).toBeNull();
	});

	it('isAllIdsCacheFresh respects ttlMs', async () => {

		const nowSpy = vi.spyOn(Date, 'now');

		nowSpy.mockReturnValue(1000);
		const snap = makeSnapshot({ cachedAt: 900 });

		expect(isAllIdsCacheFresh(snap as any, 200)).toBe(true);
		expect(isAllIdsCacheFresh(snap as any, 50)).toBe(false);
	});
});