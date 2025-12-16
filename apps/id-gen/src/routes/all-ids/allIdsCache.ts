import { browser } from '$app/environment';
import type { ViewMode } from '$lib/stores/viewMode';
import type { IDCard } from './data.remote';

export type TemplateDimensionsMap = Record<string, { width: number; height: number; orientation: 'landscape' | 'portrait'; unit: string }>;
export type TemplateFieldsMap = Record<string, { variableName: string; side: string }[]>;

export interface AllIdsCacheSnapshot {
	version: 1;
	cachedAt: number;

	// Data
	cards: IDCard[];
	totalCount: number;
	hasMore: boolean;
	nextOffset: number;
	templateDimensions: TemplateDimensionsMap;
	templateFields: TemplateFieldsMap;

	// UI state
	ui: {
		searchQuery: string;
		cardMinWidth: number;
		viewMode: ViewMode;
	};

	// Scroll restoration (for internal scroll containers, not window scroll)
	scrollTop: number;
}

export const ALL_IDS_CACHE_TTL_MS = 600_000; // 10 minutes

// Bumped to v3 to invalidate caches after orientation derivation fix
const STORAGE_KEY_BASE = 'idgen:all-ids:cache:v3';

/**
 * Optional scope key so caches can be isolated per user+org.
 * Pass something like `${userId}:${orgId}` from the caller.
 */
export function getStorageKey(scopeKey: string): string {
	return scopeKey ? `${STORAGE_KEY_BASE}:${scopeKey}` : STORAGE_KEY_BASE;
}

const memoryCacheByScope = new Map<string, AllIdsCacheSnapshot>();

function safeParse(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function isValidSnapshot(v: any): v is AllIdsCacheSnapshot {
	return (
		v &&
		v.version === 1 &&
		typeof v.cachedAt === 'number' &&
		Array.isArray(v.cards) &&
		typeof v.totalCount === 'number' &&
		typeof v.hasMore === 'boolean' &&
		typeof v.nextOffset === 'number' &&
		typeof v.templateDimensions === 'object' &&
		typeof v.templateFields === 'object' &&
		v.ui &&
		typeof v.ui.searchQuery === 'string' &&
		typeof v.ui.cardMinWidth === 'number' &&
		(v.ui.viewMode === 'table' || v.ui.viewMode === 'card') &&
		typeof v.scrollTop === 'number'
	);
}

export function isAllIdsCacheFresh(
	snapshot: AllIdsCacheSnapshot,
	ttlMs: number = ALL_IDS_CACHE_TTL_MS
): boolean {
	return Date.now() - snapshot.cachedAt < ttlMs;
}

export function readAllIdsCache(scopeKey: string = ''): AllIdsCacheSnapshot | null {
	const inMemory = memoryCacheByScope.get(scopeKey);
	if (inMemory) return inMemory;

	if (!browser) return null;

	try {
		const raw = window.sessionStorage.getItem(getStorageKey(scopeKey));
		if (!raw) return null;

		const parsed = safeParse(raw);
		if (!isValidSnapshot(parsed)) {
			// Remove invalid data to avoid repeated parse/validate costs
			window.sessionStorage.removeItem(getStorageKey(scopeKey));
			return null;
		}

		memoryCacheByScope.set(scopeKey, parsed);
		return parsed;
	} catch {
		return null;
	}
}

export function writeAllIdsCache(snapshot: AllIdsCacheSnapshot, scopeKey: string = ''): void {
	memoryCacheByScope.set(scopeKey, snapshot);

	if (!browser) return;

	try {
		window.sessionStorage.setItem(getStorageKey(scopeKey), JSON.stringify(snapshot));
	} catch {
		// If sessionStorage is full or blocked, we still keep in-memory cache.
	}
}

/**
 * Clears one scoped cache (if scopeKey provided) or all scopes.
 */
export function clearAllIdsCache(scopeKey?: string): void {
	if (scopeKey !== undefined) {
		memoryCacheByScope.delete(scopeKey);

		if (browser) {
			try {
				window.sessionStorage.removeItem(getStorageKey(scopeKey));
			} catch {
				// ignore
			}
		}

		return;
	}

	// Clear all scopes from memory
	memoryCacheByScope.clear();

	// Clear all scopes from sessionStorage
	if (!browser) return;

	try {
		// Remove both the base key and any scoped keys.
		window.sessionStorage.removeItem(STORAGE_KEY_BASE);

		for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
			const k = window.sessionStorage.key(i);
			if (!k) continue;
			if (k.startsWith(`${STORAGE_KEY_BASE}:`)) {
				window.sessionStorage.removeItem(k);
			}
		}
	} catch {
		// ignore
	}
}
