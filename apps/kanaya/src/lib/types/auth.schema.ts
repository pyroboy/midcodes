export type UserRole = 'id_gen_user' | 'id_gen_admin' | 'super_admin' | 'org_admin';

export interface AuthUser {
	id: string;
	email: string;
	role: UserRole;
	name?: string;
	avatar_url?: string;
	created_at: string;
	updated_at: string;
	org_id?: string;
	credits?: number;
}

export interface AuthSession {
	user: AuthUser;
	access_token: string;
	refresh_token: string;
	expires_at: string;
}

export interface AuthState {
	user: AuthUser | null;
	session: AuthSession | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}
