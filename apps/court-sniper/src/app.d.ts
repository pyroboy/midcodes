/// <reference types="@sveltejs/adapter-cloudflare" />

declare global {
	namespace App {
		interface Platform {
			env?: {
				DATABASE_URL?: string;
				BETTER_AUTH_SECRET?: string;
				CRON_SECRET?: string;
				PAYMONGO_SECRET_KEY?: string;
			};
		}
	}
}

export {};
