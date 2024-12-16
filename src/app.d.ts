/* eslint-disable @typescript-eslint/no-explicit-any */
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Session as SupabaseSession, SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile, RoleEmulationClaim } from '$lib/types/roleEmulation';

interface ImportMetaEnv {
	VITE_PUBLIC_SUPABASE_URL: string
	VITE_PUBLIC_SUPABASE_ANON_KEY: string
	ADMIN_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{
				session: Session | null;
				user: User | null;
				profile: ProfileData | EmulatedProfile | null;
				roleEmulation: RoleEmulationClaim | null;
			}>;
			getSession: () => Promise<Session | null>;
			session?: Session | null;
			user?: User | null;
			profile?: ProfileData | EmulatedProfile | null;
		}
		interface PageData {
			session: Session | null;
		}
		interface Error {
			message: string
		}
		interface Platform {
		}
	}
}

// Extend the Supabase Session type to include roleEmulation
interface Session extends SupabaseSession {
	roleEmulation?: RoleEmulationClaim;
}

export { Session };
