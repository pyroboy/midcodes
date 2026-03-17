import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function createThemeStore() {
	const defaultTheme: Theme = 'light';

	// Get stored theme with validation
	const getStoredTheme = (): Theme => {
		if (!browser) return defaultTheme;

		try {
			const stored = localStorage.getItem('theme');
			return stored && ['light', 'dark'].includes(stored) ? (stored as Theme) : defaultTheme;
		} catch (error) {
			console.warn('Failed to read theme from localStorage:', error);
			return defaultTheme;
		}
	};

	const initialTheme = getStoredTheme();
	const { subscribe, set } = writable<Theme>(initialTheme);

	// Apply theme to DOM with error handling
	function applyTheme(theme: Theme) {
		if (!browser) return;

		try {
			// Apply theme class to document element
			document.documentElement.classList.toggle('dark', theme === 'dark');

			// Store theme preference
			localStorage.setItem('theme', theme);

			// Dispatch custom event for other parts of the app that might need to react
			document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
		} catch (error) {
			console.error('Failed to apply theme:', error);
		}
	}

	// Initialize theme on first load
	if (browser) {
		applyTheme(initialTheme);
	}

	return {
		subscribe,

		/**
		 * Set a specific theme
		 */
		setTheme: (theme: Theme) => {
			set(theme);
			applyTheme(theme);
		},

		/**
		 * Toggle between light and dark themes
		 */
		toggle: () => {
			let currentTheme: Theme = defaultTheme;
			const unsubscribe = subscribe((current) => {
				currentTheme = current;
			});
			unsubscribe();

			const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
			set(newTheme);
			applyTheme(newTheme);
		},

		/**
		 * Get current theme without subscribing
		 */
		getCurrentTheme: (): Theme => {
			let currentTheme: Theme = defaultTheme;
			const unsubscribe = subscribe((theme) => {
				currentTheme = theme;
			});
			unsubscribe();
			return currentTheme;
		}
	};
}

export const theme = createThemeStore();
