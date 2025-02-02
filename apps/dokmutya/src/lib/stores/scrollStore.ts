import { writable } from 'svelte/store';

interface ScrollState {
    hasScrolled: boolean;
    isHeroVisible: boolean;
}

const initialState: ScrollState = {
    hasScrolled: false,
    isHeroVisible: true
};

export const scrollState = writable(initialState);

if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
        scrollState.update(state => ({
            hasScrolled: window.scrollY > 10,
            isHeroVisible: window.scrollY < window.innerHeight * 0.1
        }));
    });
}
