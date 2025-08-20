import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export type ViewMode = 'table' | 'card';

const STORAGE_KEY = 'id-gen-view-mode';

function detectDefault(): ViewMode {
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

function getInitial(): ViewMode {
	if (!browser) return detectDefault();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw === 'table' || raw === 'card') return raw;
		return detectDefault();
	} catch {
		return detectDefault();
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
