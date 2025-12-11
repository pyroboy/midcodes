import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'auto';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('auto');

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				updateDOM(theme);
			}
			set(theme);
		},
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('theme') as Theme;
				const theme = stored || 'auto';
				updateDOM(theme);
				set(theme);
			}
		}
	};
}

function updateDOM(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	
	if (theme === 'auto') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
	} else {
		root.setAttribute('data-theme', theme);
	}
}

export const theme = createThemeStore();

// Initialize theme on page load
if (browser) {
	theme.init();
	
	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		theme.subscribe((currentTheme) => {
			if (currentTheme === 'auto') {
				updateDOM('auto');
			}
		})();
	});
}