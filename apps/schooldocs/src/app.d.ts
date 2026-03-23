// src/app.d.ts
import type { auth } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			session: (typeof auth.$Infer.Session.session) | null;
			user: (typeof auth.$Infer.Session.user) | null;
			org_id?: string;
			permissions?: string[];
		}

		interface PageData {
			session?: (typeof auth.$Infer.Session.session) | null;
			user?: (typeof auth.$Infer.Session.user) | null;
			documentType?: any;
		}

		interface Error {
			message: string;
		}

		interface Platform {}
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production' | 'test';
			NEON_DATABASE_URL: string;
			BETTER_AUTH_SECRET: string;
			BETTER_AUTH_URL?: string;
			ABLY_API_KEY: string;
		}
	}
}

export {};
