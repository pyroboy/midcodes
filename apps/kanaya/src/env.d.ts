/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly PUBLIC_SUPABASE_URL: string;
	readonly PUBLIC_SUPABASE_ANON_KEY: string;
	readonly PUBLIC_RECAPTCHA_SITE_KEY: string;
	readonly PRIVATE_SERVICE_ROLE: string;
	readonly RECAPTCHA_SECRET_KEY: string;
	readonly PRIVATE_ADMIN_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
	export const PUBLIC_RECAPTCHA_SITE_KEY: string;
}

declare module '$env/static/private' {
	export const PRIVATE_SERVICE_ROLE: string;
	export const RECAPTCHA_SECRET_KEY: string;
	export const PRIVATE_ADMIN_URL: string;
}
