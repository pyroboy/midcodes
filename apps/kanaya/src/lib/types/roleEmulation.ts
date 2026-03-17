export interface ProfileData {
	id: string;
	role: string;
	email: string;
	full_name: string;
	avatar_url: string;
	updated_at: string;
	org_id?: string;
}

export interface EmulatedProfile extends ProfileData {
	isEmulated: boolean;
	originalRole?: string;
}

export interface RoleEmulationState {
	active: boolean;
	originalRole: string | null;
	emulatedRole: string | null;
}

export type UserRole = 'id_gen_user' | 'id_gen_admin' | 'id_gen_superadmin';

export interface RoleConfiguration {
	name: string;
	description: string;
	allowedPaths: Array<{
		path: string;
		name: string;
		description: string;
		showInNav: boolean;
	}>;
	capabilities: string[];
}
