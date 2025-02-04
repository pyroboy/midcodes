import { writable } from 'svelte/store';

export const isMobileMenuOpen = writable(false);

export function toggleMobileMenu() {
    isMobileMenuOpen.update(value => !value);
}

export function closeMobileMenu() {
    isMobileMenuOpen.set(false);
}