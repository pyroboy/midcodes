import { writable } from 'svelte/store';
import type { Employee } from '$lib/types';

export interface AuthState {
	isLoggedIn: boolean;
	user: Employee | null;
	token: string | null;
	loading: boolean;
	error: string | null;
}

const initialState: AuthState = {
	isLoggedIn: false,
	user: null,
	token: null,
	loading: false,
	error: null
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (user: Employee, token: string) =>
			update((state) => ({
				...state,
				isLoggedIn: true,
				user,
				token
			})),
		logout: () => set(initialState),
		setLoading: (loading: boolean) =>
			update((state) => ({
				...state,
				loading
			})),
		setError: (error: string | null) =>
			update((state) => ({
				...state,
				error
			})),
		setUser: (user: Employee | null) =>
			update((state) => ({
				...state,
				user
			}))
	};
}

export const auth = createAuthStore();
