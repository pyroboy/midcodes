/**
 * Dev-only mock session for rapid UI prototyping.
 * Uses Better Auth types instead of Supabase types.
 * In production, session comes from hooks.server.ts via Better Auth.
 */
import { writable } from 'svelte/store';

export type MockUser = {
	id: string;
	name: string;
	email: string;
	role: 'super_admin' | 'admin' | 'staff' | 'finance' | 'registrar' | null;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
};

const mockUser: MockUser = {
	id: 'dev-user-id',
	name: 'Dev User',
	email: 'dev@schooldocs.app',
	role: 'admin',
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date()
};

export const mockSession = writable<{ user: MockUser | null }>({ user: mockUser });

export const mockAuth = {
	signIn: () => mockSession.set({ user: mockUser }),
	signOut: () => mockSession.set({ user: null })
};
