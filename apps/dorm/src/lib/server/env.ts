import { env as privateEnv } from '$env/dynamic/private';
import * as staticPrivate from '$env/static/private';
import { dev } from '$app/environment';
import { z } from 'zod/v3';

// Safe process.env access for Cloudflare Workers compatibility
const processEnv: Record<string, string | undefined> =
	typeof process !== 'undefined' && process.env ? process.env : {};

// Manual .env loader — only in dev with Node.js runtime (not Cloudflare Workers)
// Uses synchronous require() to avoid top-level await which breaks Cloudflare Workers.
let dotEnvParsed: Record<string, string> = {};
if (dev && typeof process !== 'undefined' && process.versions?.node) {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const fs = require('node:fs');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const path = require('node:path');
		const envPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(envPath)) {
			const buffer = fs.readFileSync(envPath);
			let content = '';

			if (buffer[0] === 0xff && buffer[1] === 0xfe) {
				content = buffer.toString('utf16le');
			} else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
				content = buffer.swap16().toString('utf16le');
			} else {
				content = buffer.toString('utf8');
			}

			content.split(/\r?\n/).forEach((line: string) => {
				const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
				if (match) {
					const key = match[1];
					let value = match[2] || '';
					if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
					if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
					dotEnvParsed[key] = value.trim();
				}
			});

			if (Object.keys(dotEnvParsed).length > 0) {
				console.log(
					`  [env] Manually parsed ${Object.keys(dotEnvParsed).length} keys from .env directly`
				);
			}
		}
	} catch (e) {
		console.warn('  [env] Direct .env read failed:', e);
	}
}

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

	const rawEnv = {
		NEON_DATABASE_URL:
			privateEnv.NEON_DATABASE_URL ||
			dotEnvParsed.NEON_DATABASE_URL ||
			processEnv.NEON_DATABASE_URL,

		BETTER_AUTH_SECRET:
			privateEnv.BETTER_AUTH_SECRET ||
			dotEnvParsed.BETTER_AUTH_SECRET ||
			processEnv.BETTER_AUTH_SECRET ||
			(dev ? 'dev_secret_only_for_local' : undefined),

		BETTER_AUTH_URL:
			privateEnv.BETTER_AUTH_URL || dotEnvParsed.BETTER_AUTH_URL || processEnv.BETTER_AUTH_URL,

		R2_ACCOUNT_ID:
			privateEnv.R2_ACCOUNT_ID || dotEnvParsed.R2_ACCOUNT_ID || processEnv.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID:
			privateEnv.R2_ACCESS_KEY_ID ||
			dotEnvParsed.R2_ACCESS_KEY_ID ||
			processEnv.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY:
			privateEnv.R2_SECRET_ACCESS_KEY ||
			dotEnvParsed.R2_SECRET_ACCESS_KEY ||
			processEnv.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME:
			privateEnv.R2_BUCKET_NAME || dotEnvParsed.R2_BUCKET_NAME || processEnv.R2_BUCKET_NAME,
		R2_PUBLIC_DOMAIN:
			privateEnv.R2_PUBLIC_DOMAIN ||
			dotEnvParsed.R2_PUBLIC_DOMAIN ||
			processEnv.R2_PUBLIC_DOMAIN,

		RECAPTCHA_SECRET_KEY:
			privateEnv.RECAPTCHA_SECRET_KEY ||
			dotEnvParsed.RECAPTCHA_SECRET_KEY ||
			processEnv.RECAPTCHA_SECRET_KEY,

		PRIVATE_CLOUDINARY_CLOUD_NAME:
			privateEnv.PRIVATE_CLOUDINARY_CLOUD_NAME ||
			dotEnvParsed.PRIVATE_CLOUDINARY_CLOUD_NAME ||
			processEnv.PRIVATE_CLOUDINARY_CLOUD_NAME,
		PRIVATE_CLOUDINARY_API_KEY:
			privateEnv.PRIVATE_CLOUDINARY_API_KEY ||
			dotEnvParsed.PRIVATE_CLOUDINARY_API_KEY ||
			processEnv.PRIVATE_CLOUDINARY_API_KEY,
		PRIVATE_CLOUDINARY_API_SECRET:
			privateEnv.PRIVATE_CLOUDINARY_API_SECRET ||
			dotEnvParsed.PRIVATE_CLOUDINARY_API_SECRET ||
			processEnv.PRIVATE_CLOUDINARY_API_SECRET,

		CRON_SECRET:
			privateEnv.CRON_SECRET || dotEnvParsed.CRON_SECRET || processEnv.CRON_SECRET,

		NODE_ENV: ['development', 'production', 'test'].includes(processEnv.NODE_ENV ?? '')
			? processEnv.NODE_ENV
			: dev
				? 'development'
				: 'production'
	};

	const logEnvStatus = (name: string, value: string | undefined) => {
		const source = (staticPrivate as any)[name]
			? 'SvelteKit-Static'
			: (privateEnv as any)[name]
				? 'SvelteKit-Dynamic'
				: dotEnvParsed[name]
					? 'Direct-FS'
					: processEnv[name]
						? 'process.env'
						: 'NONE';

		if (!value) {
			console.log(`  [env] ${name}: MISSING (Checked: ${source})`);
			return;
		}

		let displayValue = 'SET';
		if (name.includes('URL') || name.includes('DOMAIN')) {
			try {
				const url = new URL(value);
				displayValue = `${url.protocol}//${url.host}${url.pathname}`;
			} catch {
				displayValue = value.substring(0, 10) + '...';
			}
		} else if (value.length > 8) {
			displayValue = value.substring(0, 4) + '****' + value.substring(value.length - 4);
		} else {
			displayValue = '****';
		}
		console.log(`  [env] ${name}: ${displayValue} (Source: ${source})`);
	};

	console.log('Initializing Environment Variables...');
	Object.entries(rawEnv).forEach(([key, val]) => logEnvStatus(key, val as string));

	const result = envSchema.safeParse(rawEnv);

	if (!result.success) {
		{
			const errors = result.error.flatten().fieldErrors;
			const errorMessages = Object.entries(errors)
				.map(([k, v]) => `${k}: ${v?.join(', ')}`)
				.join('\n');
			console.warn('Environment validation failed (continuing with partial env):\n' + errorMessages);
		}
		{
			// During build time (static analysis), we might not have secrets.
			// We should allow the build to proceed but warn loudly.
			if (processEnv.npm_lifecycle_event === 'build' || processEnv.CI) {
				console.warn(
					'Build/CI mode: Validation failed but continuing. Ensure vars are set in deployment.'
				);
				_env = rawEnv as any;
			} else {
				console.warn('Dev mode: Validation failed but continuing (DX priority).');
				_env = rawEnv as any;
			}
		}
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
