import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Force browser mode for cache modules (they use `$app/environment`)
vi.mock('$app/environment', () => ({ browser: true }));

import {
	cachedRemoteFunctionCall,
	clearRemoteFunctionCacheByPrefix,
	DEFAULT_REMOTE_FN_CACHE_TTL_MS
} from '../../src/lib/remote/remoteFunctionCache';

async function flushMicrotasks() {
	await Promise.resolve();
	await Promise.resolve();
}

describe('remoteFunctionCache', () => {
	beforeEach(() => {
		// Ensure clean slate across tests (session + in-memory map)
		window.sessionStorage.clear();
		clearRemoteFunctionCacheByPrefix('idgen:rf:v1:');

		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('caches in memory and avoids calling fetcher twice for same key+args', async () => {
		const fetcher = vi.fn(async (args: { n: number }) => `value:${args.n}:${Date.now()}`);

		const scopeKey = 'user:org';
		const keyBase = 'all-ids:getIDCards';

		const v1 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { n: 1 },
			fetcher
		});
		const v2 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { n: 1 },
			fetcher
		});

		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(v2).toBe(v1);
	});

	it('reads from sessionStorage when memory cache is empty (module reload simulation)', async () => {
		const scopeKey = 'user:org';
		const keyBase = 'all-ids:getCardCount';

		const firstFetcher = vi.fn(async () => 123);

		const first = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: null as any,
			fetcher: async (_args) => firstFetcher()
		});

		expect(first).toBe(123);
		expect(firstFetcher).toHaveBeenCalledTimes(1);

		// Simulate "memory map is gone" by re-importing module.
		vi.resetModules();
		vi.mock('$app/environment', () => ({ browser: true }));

		const { cachedRemoteFunctionCall: cachedRemoteFunctionCall2 } =
			await import('../../src/lib/remote/remoteFunctionCache');

		const secondFetcher = vi.fn(async () => 999);

		const second = await cachedRemoteFunctionCall2({
			scopeKey,
			keyBase,
			args: null as any,
			fetcher: async (_args) => secondFetcher()
		});

		// Should have come from sessionStorage without calling secondFetcher
		expect(second).toBe(123);
		expect(secondFetcher).toHaveBeenCalledTimes(0);
	});

	it('forceRefresh bypasses cache and overwrites stored value', async () => {
		const scopeKey = 'user:org';
		const keyBase = 'all-ids:getTemplateMetadata';

		const fetcher = vi.fn().mockResolvedValueOnce({ a: 1 }).mockResolvedValueOnce({ a: 2 });

		const v1 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: ['T1'],
			fetcher: async (args) => fetcher(args)
		});

		const v2 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: ['T1'],
			forceRefresh: true,
			fetcher: async (args) => fetcher(args)
		});

		const v3 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: ['T1'],
			fetcher: async (args) => fetcher(args)
		});

		expect(v1).toEqual({ a: 1 });
		expect(v2).toEqual({ a: 2 });
		expect(v3).toEqual({ a: 2 });
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('staleWhileRevalidate returns stale value and triggers background refresh', async () => {
		const scopeKey = 'user:org';
		const keyBase = 'all-ids:getIDCards';

		const fetcher = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

		const ttlMs = 10;

		const v1 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { offset: 0, limit: 10 },
			fetcher: async (args) => fetcher(args),
			options: { ttlMs, staleWhileRevalidate: true }
		});

		// Expire the cache
		vi.setSystemTime(new Date(Date.now() + ttlMs + 1));

		const v2 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { offset: 0, limit: 10 },
			fetcher: async (args) => fetcher(args),
			options: { ttlMs, staleWhileRevalidate: true }
		});

		// v2 returns stale immediately
		expect(v2).toBe('first');

		// Background refresh should have been started
		await flushMicrotasks();
		expect(fetcher).toHaveBeenCalledTimes(2);

		// Subsequent read should see updated value
		const v3 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { offset: 0, limit: 10 },
			fetcher: async (args) => fetcher(args),
			options: { ttlMs, staleWhileRevalidate: true }
		});

		expect(v3).toBe('second');
	});

	it('when staleWhileRevalidate=false, stale entries are awaited/refetched before returning', async () => {
		const scopeKey = 'user:org';
		const keyBase = 'all-ids:getTemplateDimensions';

		const fetcher = vi
			.fn()
			.mockResolvedValueOnce({ T1: { width: 1, height: 2, unit: 'pixels' } })
			.mockResolvedValueOnce({ T1: { width: 3, height: 4, unit: 'pixels' } });

		const ttlMs = 5;

		const v1 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: ['T1'],
			fetcher: async (args) => fetcher(args),
			options: { ttlMs, staleWhileRevalidate: false }
		});

		vi.setSystemTime(new Date(Date.now() + ttlMs + 1));

		const v2 = await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: ['T1'],
			fetcher: async (args) => fetcher(args),
			options: { ttlMs, staleWhileRevalidate: false }
		});

		expect(v1.T1.width).toBe(1);
		expect(v2.T1.width).toBe(3);
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('clearRemoteFunctionCacheByPrefix removes sessionStorage keys for that prefix', async () => {
		const scopeKey = 'user:org';
		const keyBase = 'all-ids:getCardCount';

		const fetcher = vi.fn(async () => 1);

		await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: null as any,
			fetcher: async (_args) => fetcher()
		});

		const beforeKeys = Object.keys(window.sessionStorage);
		expect(beforeKeys.some((k) => k.startsWith('idgen:rf:v1:'))).toBe(true);

		clearRemoteFunctionCacheByPrefix(`idgen:rf:v1:${scopeKey}:${keyBase}:`);

		const afterKeys = Object.keys(window.sessionStorage);
		expect(afterKeys.some((k) => k.includes(`${scopeKey}:${keyBase}:`))).toBe(false);

		// Cache should be cold now (fetcher will be called again)
		await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: null as any,
			fetcher: async (_args) => fetcher()
		});

		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('uses default TTL when none provided', async () => {
		const scopeKey = 'user:org';
		const keyBase = 'default-ttl';

		const fetcher = vi.fn(async () => 'v');

		await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { x: 1 },
			fetcher
		});

		vi.setSystemTime(new Date(Date.now() + DEFAULT_REMOTE_FN_CACHE_TTL_MS - 1));

		await cachedRemoteFunctionCall({
			scopeKey,
			keyBase,
			args: { x: 1 },
			fetcher
		});

		expect(fetcher).toHaveBeenCalledTimes(1);
	});
});
