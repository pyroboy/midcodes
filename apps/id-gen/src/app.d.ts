// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { auth } from './lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			auth: typeof auth;
			session: typeof auth.$Infer.Session | null;
			user: typeof auth.$Infer.User | null;
			org_id?: string;
			permissions?: string[];
			effectiveRoles?: string[];
			roleEmulation?: {
				active: boolean;
				originalRole?: string | null;
				emulatedRole?: string | null;
				expiresAt?: string | null;
				startedAt?: string | null;
			} | null;
			// SECURITY: CSRF token for client-side requests
			csrfToken?: string;
		}

		interface PageData {
			user?: User | null;
			org_id?: string;
			permissions?: string[];
		}

		interface Error {
			message: string;
		}

		interface Platform {}

		interface PageState {
			[key: string]: unknown;
		}
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production' | 'test';
			PUBLIC_SUPABASE_URL: string;
			PUBLIC_SUPABASE_ANON_KEY: string;
			PUBLIC_RECAPTCHA_SITE_KEY: string;
			PRIVATE_SERVICE_ROLE: string;
			RECAPTCHA_SECRET_KEY: string;
			PRIVATE_ADMIN_URL: string;
		}
	}
}

export {};
