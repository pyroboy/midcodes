import { browser } from '$app/environment';

export interface RemoteFunctionCacheOptions {
	/**
	 * TTL in ms. Default is 60s.
	 */
	ttlMs?: number;

	/**
	 * If true, return cached data immediately even if stale, and refresh in the background.
	 * Background refresh is implemented by calling `fetcher()` but not awaiting it.
	 */
	staleWhileRevalidate?: boolean;

	/**
	 * Debug logging (console.info) for hits/misses.
	 */
	debug?: boolean;
}

export const DEFAULT_REMOTE_FN_CACHE_TTL_MS = 60_000;

type CacheEntry<T> = {
	version: 1;
	cachedAt: number;
	value: T;
};

function safeParse(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function now(): number {
	return Date.now();
}

function isFresh(entry: CacheEntry<unknown>, ttlMs: number): boolean {
	return now() - entry.cachedAt < ttlMs;
}

function makeKey(scopeKey: string, keyBase: string, argsKey: string): string {
	// Per-tab cache only (sessionStorage), scoped by user+org.
	// Example:
	// idgen:rf:v1:<userId>:<orgId>:getIDCards:{"offset":0,"limit":10}
	return `idgen:rf:v1:${scopeKey}:${keyBase}:${argsKey}`;
}

function stableStringify(value: unknown): string {
	// Good enough for our use cases where args are plain objects/arrays/primitives.
	// If args include Dates/functions/etc, the caller should pass a custom argsKey.
	return JSON.stringify(value);
}

const memory = new Map<string, CacheEntry<unknown>>();

export function clearRemoteFunctionCacheByPrefix(prefix: string): void {
	// Clears both memory + sessionStorage keys that start with prefix.
	// Example prefix: `idgen:rf:v1:${scopeKey}:getIDCards:`
	for (const key of Array.from(memory.keys())) {
		if (key.startsWith(prefix)) memory.delete(key);
	}

	if (!browser) return;

	try {
		for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
			const k = window.sessionStorage.key(i);
			if (!k) continue;
			if (k.startsWith(prefix)) window.sessionStorage.removeItem(k);
		}
	} catch {
		// ignore
	}
}

export function clearRemoteFunctionCacheForScope(scopeKey: string): void {
	const prefix = `idgen:rf:v1:${scopeKey}:`;
	clearRemoteFunctionCacheByPrefix(prefix);
}

export async function cachedRemoteFunctionCall<TArgs, TResult>(params: {
	/**
	 * Something stable like `${userId}:${orgId}`.
	 */
	scopeKey: string;

	/**
	 * Something stable like `getIDCards` or `all-ids:getTemplateMetadata`.
	 */
	keyBase: string;

	/**
	 * The args passed to the remote function.
	 */
	args: TArgs;

	/**
	 * Optional override for the args portion of the cache key.
	 */
	argsKey?: string;

	/**
	 * Force bypass cache and fetch fresh. Also writes to cache.
	 */
	forceRefresh?: boolean;

	/**
	 * The function to call for fetching. Typically a remote `query()` function.
	 */
	fetcher: (args: TArgs) => Promise<TResult>;

	options?: RemoteFunctionCacheOptions;
}): Promise<TResult> {
	const ttlMs = params.options?.ttlMs ?? DEFAULT_REMOTE_FN_CACHE_TTL_MS;
	const swr = params.options?.staleWhileRevalidate ?? true;
	const debug = params.options?.debug ?? false;

	const argsKey = params.argsKey ?? stableStringify(params.args);
	const key = makeKey(params.scopeKey, params.keyBase, argsKey);

	const readFromSessionStorage = (): CacheEntry<TResult> | null => {
		if (!browser) return null;
		try {
			const raw = window.sessionStorage.getItem(key);
			if (!raw) return null;
			const parsed = safeParse(raw) as any;
			if (!parsed || parsed.version !== 1 || typeof parsed.cachedAt !== 'number' || !('value' in parsed)) {
				window.sessionStorage.removeItem(key);
				return null;
			}
			return parsed as CacheEntry<TResult>;
		} catch {
			return null;
		}
	};

	const writeEntry = (entry: CacheEntry<TResult>) => {
		memory.set(key, entry as CacheEntry<unknown>);
		if (!browser) return;
		try {
			window.sessionStorage.setItem(key, JSON.stringify(entry));
		} catch {
			// ignore
		}
	};

	const fetchAndWrite = async (): Promise<TResult> => {
		const value = await params.fetcher(params.args);
		const entry: CacheEntry<TResult> = { version: 1, cachedAt: now(), value };
		writeEntry(entry);
		return value;
	};

	if (params.forceRefresh) {
		if (debug) console.info('[remote-cache] forceRefresh', { keyBase: params.keyBase, argsKey });
		return fetchAndWrite();
	}

	// 1) memory hit
	const mem = memory.get(key) as CacheEntry<TResult> | undefined;
	if (mem) {
		const fresh = isFresh(mem, ttlMs);

		if (debug) console.info('[remote-cache] memory hit', { keyBase: params.keyBase, argsKey, fresh });

		if (fresh) return mem.value;

		// stale
		if (swr) {
			// background refresh
			void fetchAndWrite();
			return mem.value;
		}

		return fetchAndWrite();
	}

	// 2) sessionStorage hit
	const stored = readFromSessionStorage();
	if (stored) {
		const fresh = isFresh(stored, ttlMs);

		if (debug) console.info('[remote-cache] storage hit', { keyBase: params.keyBase, argsKey, fresh });

		memory.set(key, stored as CacheEntry<unknown>);

		if (fresh) return stored.value;

		// stale
		if (swr) {
			void fetchAndWrite();
			return stored.value;
		}

		return fetchAndWrite();
	}

	// 3) miss
	if (debug) console.info('[remote-cache] miss', { keyBase: params.keyBase, argsKey });
	return fetchAndWrite();
}