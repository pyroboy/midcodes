import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export type RecentViewMode = 'carousel' | 'grid' | 'list';

const STORAGE_KEY = 'id-gen-recent-view-mode';

function getInitial(): RecentViewMode {
    if (!browser) return 'carousel';
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === 'carousel' || raw === 'grid' || raw === 'list') return raw;
        return 'carousel'; // default to carousel
    } catch {
        return 'carousel';
    }
}

export const recentViewMode: Writable<RecentViewMode> = writable(getInitial());

if (browser) {
    recentViewMode.subscribe((val) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, val);
        } catch {
            // ignore persistence errors
        }
    });
}
