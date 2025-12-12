import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export type ViewMode = 'table' | 'card';

const STORAGE_KEY = 'id-gen-view-mode';

/**
 * Detects optimal view mode based on viewport width.
 * Only call this AFTER hydration (in onMount) to avoid SSR mismatch.
 */
export function detectViewportDefault(): ViewMode {
	if (!browser) return 'table';
	try {
		const w = window.innerWidth;
		if (w < 768) return 'card'; // mobile default
		if (w > 1024) return 'table'; // desktop default
		return 'table';
	} catch {
		return 'table';
	}
}

/**
 * Get initial view mode - always returns 'table' for SSR consistency.
 * Viewport detection should happen in onMount to avoid hydration mismatch.
 */
function getInitial(): ViewMode {
	if (!browser) return 'table'; // SSR: always 'table'
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw === 'table' || raw === 'card') return raw;
		// No stored preference - return 'table' for consistent hydration
		// Components can call detectViewportDefault() in onMount if needed
		return 'table';
	} catch {
		return 'table';
	}
}

export const viewMode: Writable<ViewMode> = writable(getInitial());

if (browser) {
	viewMode.subscribe((val) => {
		try {
			window.localStorage.setItem(STORAGE_KEY, val);
		} catch {
			// ignore persistence errors
		}
	});
}
