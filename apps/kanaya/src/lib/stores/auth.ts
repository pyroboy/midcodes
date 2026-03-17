import { writable } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile, RoleEmulationState } from '$lib/types/roleEmulation';

export interface UserProfile extends ProfileData {
	isEmulated?: boolean;
	originalRole?: string;
}

export const auth = writable<{
	user: User | null;
	session: Session | null;
	profile: UserProfile | null;
	roleEmulation: RoleEmulationState;
}>({
	user: null,
	session: null,
	profile: null,
	roleEmulation: {
		active: false,
		originalRole: null,
		emulatedRole: null
	}
});

export const { subscribe: subscribeToAuth } = auth;

export const session = {
	subscribe: (fn: (session: Session | null) => void) => {
		return auth.subscribe(({ session }) => fn(session));
	}
};

export const user = {
	subscribe: (fn: (user: User | null) => void) => {
		return auth.subscribe(({ user }) => fn(user));
	}
};

export const profile = {
	subscribe: (fn: (profile: UserProfile | null) => void) => {
		return auth.subscribe(({ profile }) => fn(profile));
	}
};
