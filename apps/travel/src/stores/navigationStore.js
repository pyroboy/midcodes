import { writable } from 'svelte/store';
import { NAVIGATION_LINKS } from '$lib/constants';

export const preloadStatus = writable(new Map());

export async function preloadAllPages() {
    const { preloadData } = await import('$app/navigation');
    
    NAVIGATION_LINKS.forEach(async ([path]) => {
        try {
            preloadStatus.update(status => status.set(path, 'loading'));
            await preloadData(path);
            preloadStatus.update(status => status.set(path, 'loaded'));
        } catch (error) {
            preloadStatus.update(status => status.set(path, 'error'));
            console.error(`Failed to preload ${path}:`, error);
        }
    });
}
