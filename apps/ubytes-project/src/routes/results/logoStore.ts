import { writable } from 'svelte/store';

// Create a writable store for the logo toggle state
export const useMascotLogo = writable(false);
