import { env as privateEnv } from '$env/dynamic/private';

const processEnv = typeof process !== 'undefined' && process.env ? process.env : {};

interface Env {
	NEON_DATABASE_URL: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL?: string;
	ABLY_API_KEY: string;
}

let _env: Env | null = null;

function getEnv(): Env {
	if (_env) return _env;
	_env = {
		NEON_DATABASE_URL: privateEnv?.NEON_DATABASE_URL ?? processEnv.NEON_DATABASE_URL ?? '',
		BETTER_AUTH_SECRET: privateEnv?.BETTER_AUTH_SECRET ?? processEnv.BETTER_AUTH_SECRET ?? '',
		BETTER_AUTH_URL: privateEnv?.BETTER_AUTH_URL ?? processEnv.BETTER_AUTH_URL,
		ABLY_API_KEY: privateEnv?.ABLY_API_KEY ?? processEnv.ABLY_API_KEY ?? ''
	};
	return _env;
}

/** Returns true if DB credentials are configured */
export function hasDbCredentials(): boolean {
	return !!getEnv().NEON_DATABASE_URL;
}

/** Returns true if auth credentials are configured */
export function hasAuthCredentials(): boolean {
	const e = getEnv();
	return !!(e.NEON_DATABASE_URL && e.BETTER_AUTH_SECRET);
}

export const env = new Proxy({} as Env, {
	get(_target, prop: string) {
		return getEnv()[prop as keyof Env];
	}
});
