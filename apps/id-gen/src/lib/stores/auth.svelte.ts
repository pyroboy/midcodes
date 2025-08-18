import { getContext, setContext } from 'svelte';
import type { AuthUser } from '$lib/types/auth.schema';

// Auth Store using Svelte 5 runes
class AuthStore {
	private _user = $state<AuthUser | null>(null);
	private _isLoading = $state(true);
	private _isStaff = $state(false);
	private _isStaffMode = $state(false);
	private _loginWithPinStatus = $state<'idle' | 'pending' | 'success' | 'error'>('idle');
	private _permissions = $state<string[]>([]);

	get user() {
		return this._user;
	}

	get isLoading() {
		return this._isLoading;
	}

	get isStaff() {
		return this._isStaff;
	}

	get isAuthenticated() {
		return this._user !== null;
	}

	get isStaffMode() {
		return this._isStaffMode;
	}

	get loginWithPinStatus() {
		return this._loginWithPinStatus;
	}

	get userName() {
		return this._user?.name || this._user?.email || 'Unknown User';
	}

	setUser(user: AuthUser | null) {
		this._user = user;
		this._isStaff = user?.role === 'super_admin' || user?.role === 'id_gen_admin' || false;
		this._isLoading = false;
	}

	setLoading(loading: boolean) {
		this._isLoading = loading;
	}

	logout() {
		this._user = null;
		this._isStaff = false;
		this._isLoading = false;
		this._isStaffMode = false;
		this._permissions = [];
	}

	toggleStaffMode() {
		if (this._isStaff) {
			this._isStaffMode = !this._isStaffMode;
		}
	}

	async loginWithPin(pin: string): Promise<{ success: boolean; error?: string }> {
		this._loginWithPinStatus = 'pending';
		try {
			// Simulate pin verification - replace with actual API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Mock verification - replace with real logic
			if (pin === '1234') {
				this._isStaffMode = true;
				this._loginWithPinStatus = 'success';
				return { success: true };
			} else {
				this._loginWithPinStatus = 'error';
				return { success: false, error: 'Invalid PIN' };
			}
		} catch (error) {
			this._loginWithPinStatus = 'error';
			return { success: false, error: 'Login failed' };
		}
	}

	hasPermission(permission: string): boolean {
		return this._permissions.includes(permission) || this._isStaff;
	}

	setPermissions(permissions: string[]) {
		this._permissions = permissions;
	}
}

const AUTH_STORE_KEY = 'auth-store';

export function createAuthStore() {
	return new AuthStore();
}

export function setAuthStore(store: AuthStore) {
	return setContext(AUTH_STORE_KEY, store);
}

export function getAuthStore(): AuthStore {
	return getContext(AUTH_STORE_KEY);
}

// Export a default store instance
export const authStore = createAuthStore();
