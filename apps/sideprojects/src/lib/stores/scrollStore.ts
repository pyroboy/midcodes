import { writable } from 'svelte/store';

interface ScrollState {
    hasScrolled: boolean;
    hadReachedMiddle: boolean;
}

const initialState: ScrollState = {
    hasScrolled: false,
    hadReachedMiddle: true
};

export const scrollState = writable(initialState);

if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
        scrollState.update(state => ({
            hasScrolled: window.scrollY > 10,
            hadReachedMiddle: window.scrollY < (window.innerHeight / 3.6)
        }));
    });
}
