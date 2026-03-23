import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { env } from './env';
import { db } from './db';

function createAuth() {
	return betterAuth({
		database: drizzleAdapter(db, { provider: 'pg' }),
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		emailAndPassword: { enabled: true },
		plugins: [admin()]
	});
}

let _auth: ReturnType<typeof createAuth> | null = null;

function getAuth() {
	if (!_auth) _auth = createAuth();
	return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
	get(_target, prop) {
		const instance = getAuth();
		const value = (instance as any)[prop];
		return typeof value === 'function' ? value.bind(instance) : value;
	}
});
