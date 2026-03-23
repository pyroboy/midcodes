import type { User } from '$lib/types';

let user = $state<User | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const authStore = {
	get user() { return user; },
	get isLoading() { return isLoading; },
	get isAuthenticated() { return user !== null; },
	get error() { return error; },

	async login(email: string, password: string) {
		isLoading = true;
		error = null;
		try {
			// Mock login: accept any credentials
			const namePart = email.split('@')[0];
			user = {
				id: 'usr-' + Math.random().toString(36).substring(2, 10),
				email,
				name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
				role: 'player',
				skillLevel: 'intermediate',
				phone: '+63 917 123 4567',
				createdAt: new Date(),
				updatedAt: new Date()
			};
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login failed';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async logout() {
		user = null;
		error = null;
	},

	setUser(u: User | null) {
		user = u;
	}
};
