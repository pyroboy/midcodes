import { env as privateEnv } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { z } from 'zod';

const envSchema = z.object({
	NEON_DATABASE_URL: z.string().url().or(z.string().includes('localhost')),
	ADMIN_PIN: z.string().min(4).default('1234'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function initializeEnv(): Env {
	if (_env) return _env;

	const rawEnv = {
		NEON_DATABASE_URL:
			privateEnv.NEON_DATABASE_URL || process?.env?.NEON_DATABASE_URL,
		ADMIN_PIN:
			privateEnv.ADMIN_PIN || process?.env?.ADMIN_PIN || (dev ? '1234' : undefined),
		NODE_ENV: ['development', 'production', 'test'].includes(process?.env?.NODE_ENV ?? '')
			? process.env.NODE_ENV
			: dev
				? 'development'
				: 'production'
	};

	const result = envSchema.safeParse(rawEnv);

	if (!result.success) {
		const isBuild = process?.env?.npm_lifecycle_event === 'build' || process?.env?.CI;
		if (!dev && !isBuild) {
			const errors = result.error.flatten().fieldErrors;
			const errorMessages = Object.entries(errors)
				.map(([k, v]) => `${k}: ${v?.join(', ')}`)
				.join('\n');
			console.error('Environment validation failed:\n' + errorMessages);
			throw new Error('Environment validation failed. App cannot start in production.');
		}
		console.warn('Env validation failed but continuing (dev/build mode).');
		_env = rawEnv as Env;
	} else {
		_env = result.data;
	}

	return _env;
}

export function getEnv(): Env {
	if (!_env) return initializeEnv();
	return _env;
}

export const env = new Proxy({} as Env, {
	get(_target, prop) {
		const e = getEnv();
		return (e as any)[prop];
	}
});
