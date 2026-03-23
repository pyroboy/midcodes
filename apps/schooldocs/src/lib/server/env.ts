/**
 * Environment variable validation for schooldocs.
 * Cloudflare Workers compatible — uses $env/dynamic/private as the primary source,
 * with process.env as a fallback for local dev.
 *
 * Add secrets to Cloudflare Pages via:
 *   Dashboard → schooldocs → Settings → Environment Variables → Add secret
 * Or via CLI:
 *   wrangler pages secret put NEON_DATABASE_URL --project-name schooldocs
 */

import { env as privateEnv } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { z } from 'zod/v3';

// Safe process.env access — undefined in Cloudflare Workers
const processEnv: Record<string, string | undefined> =
	typeof process !== 'undefined' && process.env ? process.env : {};

const envSchema = z.object({
	NEON_DATABASE_URL: z.string().min(1, 'NEON_DATABASE_URL is required'),
	BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
	BETTER_AUTH_URL: z.string().url().optional(),
	ABLY_API_KEY: z.string().min(1, 'ABLY_API_KEY is required'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

function initializeEnv(): Env {
	if (_env) return _env;

	const rawEnv = {
		NEON_DATABASE_URL: privateEnv.NEON_DATABASE_URL || processEnv.NEON_DATABASE_URL,
		BETTER_AUTH_SECRET:
			privateEnv.BETTER_AUTH_SECRET ||
			processEnv.BETTER_AUTH_SECRET ||
			(dev ? 'dev_secret_schooldocs_local_only' : undefined),
		BETTER_AUTH_URL: privateEnv.BETTER_AUTH_URL || processEnv.BETTER_AUTH_URL,
		ABLY_API_KEY: privateEnv.ABLY_API_KEY || processEnv.ABLY_API_KEY,
		NODE_ENV: ['development', 'production', 'test'].includes(processEnv.NODE_ENV ?? '')
			? processEnv.NODE_ENV
			: dev
				? 'development'
				: 'production'
	};

	const result = envSchema.safeParse(rawEnv);

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;
		const msg = Object.entries(errors)
			.map(([k, v]) => `  ${k}: ${v?.join(', ')}`)
			.join('\n');
		console.warn(`[env] Validation warnings:\n${msg}`);
		_env = rawEnv as Env;
	} else {
		_env = result.data;
	}

	return _env;
}

// Lazy proxy — only validates when first accessed (safe at build time)
export const env = new Proxy({} as Env, {
	get(_target, prop) {
		const e = initializeEnv();
		return (e as any)[prop];
	}
});
