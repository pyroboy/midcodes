import { env as privateEnv } from '$env/dynamic/private';
import * as staticPrivate from '$env/static/private';
import { dev } from '$app/environment';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

// Manual UTF-16 / UTF-8 robust .env loader
let dotEnvParsed: Record<string, string> = {};
if (dev) {
	try {
		const envPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(envPath)) {
			const buffer = fs.readFileSync(envPath);
			let content = '';
			
			// Detect UTF-16 LE (FF FE) or UTF-16 BE (FE FF)
			if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
				content = buffer.toString('utf16le');
				console.log('  [env] Detected UTF-16 LE encoding for .env');
			} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
				// Handle BE if needed, though rare on Windows
				content = buffer.swap16().toString('utf16le');
				console.log('  [env] Detected UTF-16 BE encoding for .env');
			} else {
				content = buffer.toString('utf8');
			}

			// Simple custom parser to bypass dotenv encoding quirks
			content.split(/\r?\n/).forEach(line => {
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
				console.log(`  [env] Manually parsed ${Object.keys(dotEnvParsed).length} keys from .env directly`);
			}
		}
	} catch (e) {
		console.warn('  [env] Direct .env read failed:', e);
	}
}

/**
 * Environment Variable Schema
 */
const envSchema = z.object({
	NEON_DATABASE_URL: z.string().url().or(z.string().includes('localhost')),
	BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
	BETTER_AUTH_URL: z.string().url().optional(),
	R2_ACCOUNT_ID: z.string().optional(),
	R2_ACCESS_KEY_ID: z.string().optional(),
	R2_SECRET_ACCESS_KEY: z.string().optional(),
	R2_BUCKET_NAME: z.string().optional(),
	R2_PUBLIC_DOMAIN: z.string().optional(),
	PAYMONGO_SECRET_KEY: z.string().startsWith('sk_').optional(),
	PAYMONGO_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
	PAYMONGO_CHECKOUT_SUCCESS_PATH: z.string().default('/account/billing/success'),
	PAYMONGO_CHECKOUT_CANCEL_PATH: z.string().default('/pricing?canceled=1'),
	RUNWARE_API_KEY: z.string().optional(),
	CSRF_SECRET: z.string().optional(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;
let _isValidated = false;

export function initializeEnv() {
	if (_isValidated && _env) return _env;

	const rawEnv = {
		NEON_DATABASE_URL: 
			(staticPrivate as any).NEON_DATABASE_URL || 
			(staticPrivate as any).DATABASE_URL || 
			privateEnv.NEON_DATABASE_URL || 
			dotEnvParsed.NEON_DATABASE_URL ||
			dotEnvParsed.DATABASE_URL ||
			process?.env?.NEON_DATABASE_URL || 
			process?.env?.DATABASE_URL,
		
		BETTER_AUTH_SECRET: 
			(staticPrivate as any).BETTER_AUTH_SECRET || 
			privateEnv.BETTER_AUTH_SECRET || 
			dotEnvParsed.BETTER_AUTH_SECRET ||
			process?.env?.BETTER_AUTH_SECRET || 
			(dev ? 'dev_secret_only_for_local' : undefined),
		
		BETTER_AUTH_URL: 
			(staticPrivate as any).BETTER_AUTH_URL || 
			privateEnv.BETTER_AUTH_URL || 
			dotEnvParsed.BETTER_AUTH_URL ||
			process?.env?.BETTER_AUTH_URL,
		
		R2_ACCOUNT_ID: (staticPrivate as any).R2_ACCOUNT_ID || privateEnv.R2_ACCOUNT_ID || dotEnvParsed.R2_ACCOUNT_ID || process?.env?.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID: (staticPrivate as any).R2_ACCESS_KEY_ID || privateEnv.R2_ACCESS_KEY_ID || dotEnvParsed.R2_ACCESS_KEY_ID || process?.env?.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: (staticPrivate as any).R2_SECRET_ACCESS_KEY || privateEnv.R2_SECRET_ACCESS_KEY || dotEnvParsed.R2_SECRET_ACCESS_KEY || process?.env?.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME: (staticPrivate as any).R2_BUCKET_NAME || privateEnv.R2_BUCKET_NAME || dotEnvParsed.R2_BUCKET_NAME || process?.env?.R2_BUCKET_NAME,
		R2_PUBLIC_DOMAIN: (staticPrivate as any).R2_PUBLIC_DOMAIN || privateEnv.R2_PUBLIC_DOMAIN || dotEnvParsed.R2_PUBLIC_DOMAIN || process?.env?.R2_PUBLIC_DOMAIN,
		PAYMONGO_SECRET_KEY: (staticPrivate as any).PAYMONGO_SECRET_KEY || privateEnv.PAYMONGO_SECRET_KEY || dotEnvParsed.PAYMONGO_SECRET_KEY || process?.env?.PAYMONGO_SECRET_KEY,
		PAYMONGO_WEBHOOK_SECRET: (staticPrivate as any).PAYMONGO_WEBHOOK_SECRET || privateEnv.PAYMONGO_WEBHOOK_SECRET || dotEnvParsed.PAYMONGO_WEBHOOK_SECRET || process?.env?.PAYMONGO_WEBHOOK_SECRET,
		PAYMONGO_CHECKOUT_SUCCESS_PATH: (staticPrivate as any).PAYMONGO_CHECKOUT_SUCCESS_PATH || privateEnv.PAYMONGO_CHECKOUT_SUCCESS_PATH || dotEnvParsed.PAYMONGO_CHECKOUT_SUCCESS_PATH || process?.env?.PAYMONGO_CHECKOUT_SUCCESS_PATH,
		PAYMONGO_CHECKOUT_CANCEL_PATH: (staticPrivate as any).PAYMONGO_CHECKOUT_CANCEL_PATH || privateEnv.PAYMONGO_CHECKOUT_CANCEL_PATH || dotEnvParsed.PAYMONGO_CHECKOUT_CANCEL_PATH || process?.env?.PAYMONGO_CHECKOUT_CANCEL_PATH,
		RUNWARE_API_KEY: (staticPrivate as any).RUNWARE_API_KEY || privateEnv.RUNWARE_API_KEY || dotEnvParsed.RUNWARE_API_KEY || process?.env?.RUNWARE_API_KEY,
		CSRF_SECRET: (staticPrivate as any).CSRF_SECRET || privateEnv.CSRF_SECRET || dotEnvParsed.CSRF_SECRET || process?.env?.CSRF_SECRET,
		NODE_ENV: (['development', 'production', 'test'].includes(process?.env?.NODE_ENV ?? '') 
			? process.env.NODE_ENV 
			: (dev ? 'development' : 'production'))
	};

	const logEnvStatus = (name: string, value: string | undefined) => {
		const source = 
			(staticPrivate as any)[name] ? 'SvelteKit-Static' : 
			(staticPrivate as any)[name === 'NEON_DATABASE_URL' ? 'DATABASE_URL' : ''] ? 'SvelteKit-Static(Alias)' :
			(privateEnv as any)[name] ? 'SvelteKit-Dynamic' : 
			(dotEnvParsed[name] || dotEnvParsed[name === 'NEON_DATABASE_URL' ? 'DATABASE_URL' : '']) ? 'Direct-FS' :
			(process?.env?.[name] || process?.env?.[name === 'NEON_DATABASE_URL' ? 'DATABASE_URL' : '']) ? 'process.env' : 'NONE';
		
		if (!value) {
			console.log(`  [env] ${name}: ❌ MISSING (Checked: ${source})`);
			return;
		}
		
		let displayValue = 'SET';
		if (name.includes('URL') || name.includes('DOMAIN')) {
			try {
				const url = new URL(value);
				displayValue = `${url.protocol}//${url.host}${url.pathname}`;
			} catch { displayValue = value.substring(0, 10) + '...'; }
		} else if (value.length > 8) {
			displayValue = value.substring(0, 4) + '****' + value.substring(value.length - 4);
		} else { displayValue = '****'; }
		console.log(`  [env] ${name}: ✅ ${displayValue} (Source: ${source})`);
	};

	console.log('🔍 Initializing Environment Variables...');
	Object.entries(rawEnv).forEach(([key, val]) => logEnvStatus(key, val as string));

	const result = envSchema.safeParse(rawEnv);

	if (!result.success) {
		if (!dev) {
			const errors = result.error.flatten().fieldErrors;
			const errorMessages = Object.entries(errors).map(([k, v]) => `${k}: ${v?.join(', ')}`).join('\n');
			console.error('❌ Environment validation failed:\n' + errorMessages);
			throw new Error('Environment validation failed. App cannot start in production.');
		} else {
			console.warn('⚠️  Dev mode: Validation failed but continuing (DX priority).');
			_env = rawEnv as any;
		}
	} else {
		console.log('✅ Environment validation passed');
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
 * Helper to get full URLs for redirects.
 * Note: Uses PUBLIC_APP_URL which might be undefined in some contexts.
 */
export function getCheckoutUrls() {
	const e = getEnv();
	// Use static public if available, otherwise dynamic or localhost
	const baseUrl = (staticPrivate as any).PUBLIC_APP_URL || 'http://localhost:5173';

	return {
		success: `${baseUrl}${e.PAYMONGO_CHECKOUT_SUCCESS_PATH}`,
		cancel: `${baseUrl}${e.PAYMONGO_CHECKOUT_CANCEL_PATH}`
	};
}

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
