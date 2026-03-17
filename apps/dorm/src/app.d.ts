// src/app.d.ts
import type { auth } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			session: (typeof auth.$Infer.Session.session) | null;
			user: (typeof auth.$Infer.Session.user) | null;
			org_id?: string;
			permissions?: string[];
			effectiveRoles?: string[];
			csrfToken?: string;
		}

		interface PageData {
			session?: (typeof auth.$Infer.Session.session) | null;
			user?: (typeof auth.$Infer.Session.user) | null;
			navigation?: NavigationState;
			special_url?: string | undefined;
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
			NEON_DATABASE_URL: string;
			BETTER_AUTH_SECRET: string;
			BETTER_AUTH_URL?: string;
		}
	}
}

export {};
