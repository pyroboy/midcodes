import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from './db';
import { env } from './env';

type Auth = ReturnType<typeof betterAuth>;
let _auth: Auth | null = null;

export const auth = new Proxy({} as Auth, {
	get(_target, prop: string) {
		if (!_auth) {
			_auth = betterAuth({
				database: drizzleAdapter(db, { provider: 'pg' }),
				secret: env.BETTER_AUTH_SECRET,
				baseURL: env.BETTER_AUTH_URL,
				emailAndPassword: { enabled: true },
				plugins: [admin()]
			});
		}
		return (_auth as any)[prop];
	}
});
