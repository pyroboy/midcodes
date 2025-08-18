import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createDarkModeStore() {
	const defaultValue = browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
	const storedValue = browser ? localStorage.getItem('darkMode') : null;
	const initialValue = storedValue ? JSON.parse(storedValue) : defaultValue;

	const { subscribe, set } = writable(initialValue);

	return {
		subscribe,
		toggle: () => {
			subscribe((current) => {
				const newValue = !current;
				set(newValue);
				if (browser) {
					localStorage.setItem('darkMode', JSON.stringify(newValue));
					document.documentElement.classList.toggle('dark', newValue);
				}
			})();
		},
		set: (value: boolean) => {
			set(value);
			if (browser) {
				localStorage.setItem('darkMode', JSON.stringify(value));
				document.documentElement.classList.toggle('dark', value);
			}
		}
	};
}

export const darkMode = createDarkModeStore();
