import { env as privateEnv } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { z } from 'zod/v3';

// Safe process.env access for Cloudflare Workers compatibility
const processEnv: Record<string, string | undefined> =
	typeof process !== 'undefined' && process.env ? process.env : {};

/**
 * Environment Variable Schema for Dorm app
 */
const envSchema = z.object({
	// Required
	NEON_DATABASE_URL: z.string().url().or(z.string().includes('localhost')),
	BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),

	// Optional - Auth
	BETTER_AUTH_URL: z.string().url().optional(),

	// Optional - Cloudflare R2 Storage
	R2_ACCOUNT_ID: z.string().optional(),
	R2_ACCESS_KEY_ID: z.string().optional(),
	R2_SECRET_ACCESS_KEY: z.string().optional(),
	R2_BUCKET_NAME: z.string().optional(),
	R2_PUBLIC_DOMAIN: z.string().optional(),

	// Optional - reCAPTCHA
	RECAPTCHA_SECRET_KEY: z.string().optional(),

	// Optional - Legacy Cloudinary
	PRIVATE_CLOUDINARY_CLOUD_NAME: z.string().optional(),
	PRIVATE_CLOUDINARY_API_KEY: z.string().optional(),
	PRIVATE_CLOUDINARY_API_SECRET: z.string().optional(),

	// Automation
	CRON_SECRET: z.string().optional(),

	// Runtime
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;
let _isValidated = false;

export function initializeEnv() {
	if (_isValidated && _env) return _env;

	// SvelteKit's $env/dynamic/private already loads .env and .env.local
	// processEnv is the fallback for Cloudflare Workers where $env may not be populated
	const rawEnv = {
		NEON_DATABASE_URL: privateEnv.NEON_DATABASE_URL || processEnv.NEON_DATABASE_URL,

		BETTER_AUTH_SECRET:
			privateEnv.BETTER_AUTH_SECRET ||
			processEnv.BETTER_AUTH_SECRET ||
			(dev ? 'dev_secret_only_for_local_development_use' : undefined),

		BETTER_AUTH_URL: privateEnv.BETTER_AUTH_URL || processEnv.BETTER_AUTH_URL,

		R2_ACCOUNT_ID: privateEnv.R2_ACCOUNT_ID || processEnv.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID: privateEnv.R2_ACCESS_KEY_ID || processEnv.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: privateEnv.R2_SECRET_ACCESS_KEY || processEnv.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME: privateEnv.R2_BUCKET_NAME || processEnv.R2_BUCKET_NAME,
		R2_PUBLIC_DOMAIN: privateEnv.R2_PUBLIC_DOMAIN || processEnv.R2_PUBLIC_DOMAIN,

		RECAPTCHA_SECRET_KEY: privateEnv.RECAPTCHA_SECRET_KEY || processEnv.RECAPTCHA_SECRET_KEY,

		PRIVATE_CLOUDINARY_CLOUD_NAME:
			privateEnv.PRIVATE_CLOUDINARY_CLOUD_NAME || processEnv.PRIVATE_CLOUDINARY_CLOUD_NAME,
		PRIVATE_CLOUDINARY_API_KEY:
			privateEnv.PRIVATE_CLOUDINARY_API_KEY || processEnv.PRIVATE_CLOUDINARY_API_KEY,
		PRIVATE_CLOUDINARY_API_SECRET:
			privateEnv.PRIVATE_CLOUDINARY_API_SECRET || processEnv.PRIVATE_CLOUDINARY_API_SECRET,

		CRON_SECRET: privateEnv.CRON_SECRET || processEnv.CRON_SECRET,

		NODE_ENV: ['development', 'production', 'test'].includes(processEnv.NODE_ENV ?? '')
			? processEnv.NODE_ENV
			: dev
				? 'development'
				: 'production'
	};

	// Log a single summary instead of one line per variable
	const setKeys = Object.entries(rawEnv).filter(([, v]) => v).map(([k]) => k);
	const missingKeys = Object.entries(rawEnv).filter(([, v]) => !v).map(([k]) => k);
	console.log(`[env] Initializing: ${setKeys.length} set, ${missingKeys.length} missing${missingKeys.length ? ` (${missingKeys.join(', ')})` : ''}`);

	const result = envSchema.safeParse(rawEnv);

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;
		const errorMessages = Object.entries(errors)
			.map(([k, v]) => `${k}: ${v?.join(', ')}`)
			.join('\n');
		console.warn('Environment validation failed (continuing with partial env):\n' + errorMessages);

		if (processEnv.npm_lifecycle_event === 'build' || processEnv.CI) {
			console.warn(
				'Build/CI mode: Validation failed but continuing. Ensure vars are set in deployment.'
			);
		} else {
			console.warn('Dev mode: Validation failed but continuing (DX priority).');
		}
		_env = rawEnv as any;
	} else {
		console.log('Environment validation passed');
		_env = result.data;
	}

	_isValidated = true;
	return _env;
}

export function getEnv(): Env {
	if (!_env) return initializeEnv() as Env;
	return _env;
}

export const env = new Proxy({} as Env, {
	get(_target, prop) {
		const e = getEnv();
		return (e as any)[prop];
	}
});

/**
 * Type guards to prevent accidental client-side usage of server variables.
 */
export function assertServerContext(context: string) {
	if (typeof window !== 'undefined') {
		throw new Error(
			`${context} can only be used on the server. Do not call this from client-side code.`
		);
	}
}
