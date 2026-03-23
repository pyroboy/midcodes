import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as authSchema from './schema-auth';

// Lazy-initialized auth instance
let _auth: ReturnType<typeof createAuth> | null = null;

function createAuth() {
	// Auth uses its own lightweight DB instance (4 tables only)
	const sql = neon(env.NEON_DATABASE_URL);
	const db = drizzle(sql, { schema: authSchema });
	const secret = env.BETTER_AUTH_SECRET;
	const baseURL = env.BETTER_AUTH_URL || 'http://localhost:5173';

	return betterAuth({
		secret,
		baseURL,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				user: authSchema.user,
				session: authSchema.session,
				account: authSchema.account,
				verification: authSchema.verification
			}
		}),
		plugins: [admin()],
		trustedOrigins: [
			'http://127.0.0.1:5173',
			'http://localhost:5173',
			'https://schooldocs.midcodes.app',
			...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [])
		],
		emailAndPassword: {
			enabled: true
		},
		// When a new user signs up, also create their profile row
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						try {
							const { getDb } = await import('./db');
							const { profiles } = await import('./schema');
							const appDb = getDb();
							await appDb.insert(profiles).values({
								id: user.id,
								email: user.email,
								full_name: user.name ?? null
							});
						} catch (e) {
							console.error('[AUTH HOOK] Failed to create profile:', e);
						}
					}
				}
			}
		}
	});
}

export function getAuth() {
	if (!_auth) _auth = createAuth();
	return _auth;
}

// Named export for use in hooks.server.ts and API routes
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
	get(_target, prop) {
		const realAuth = getAuth();
		const value = (realAuth as any)[prop];
		if (typeof value === 'function') return value.bind(realAuth);
		return value;
	}
});
