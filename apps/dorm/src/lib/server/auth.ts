import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { getAuthDb } from './db-auth';
import * as authSchema from './schema-auth';
import { env } from './env';

// Lazy-initialized auth instance
let _auth: ReturnType<typeof createAuth> | null = null;

/**
 * Create the Better Auth instance with proper configuration.
 * Uses the lightweight auth-only DB (schema-auth.ts = 4 tables)
 * instead of the full schema (schema.ts = 32 tables + 25 enums)
 * to stay under CF Workers' 10ms CPU limit.
 */
function createAuth() {
	const db = getAuthDb();
	const secret = env.BETTER_AUTH_SECRET;
	const baseURL = env.BETTER_AUTH_URL || 'https://dorm-brz.pages.dev';

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
			'https://dorm.midcodes.app',
			'https://www.dorm.midcodes.app',
			'https://dorm-brz.pages.dev',
			...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [])
		],
		emailAndPassword: {
			enabled: true
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						console.log('[AUTH HOOK] Creating profile for user:', user.id);
						try {
							// Lazy-import full schema only when creating a profile
							// (happens once per user signup, not on every request)
							const { getDb } = await import('./db');
							const { profiles } = await import('./schema');
							const db = getDb();
							await db.insert(profiles).values({
								id: user.id,
								email: user.email
							});
							console.log('[AUTH HOOK] Profile created successfully');
						} catch (e) {
							console.error('[AUTH HOOK] FAILED to create profile:', e);
						}
					}
				}
			}
		}
	});
}

/**
 * Get the Better Auth instance.
 * Lazily initialized on first call.
 */
export function getAuth() {
	if (!_auth) {
		_auth = createAuth();
	}
	return _auth;
}

// Type of the lazy-initialized auth instance
export type Auth = ReturnType<typeof createAuth>;

// Export a getter object for backwards compatibility with existing code
export const auth: Auth = new Proxy({} as Auth, {
	get(_target, prop) {
		const realAuth = getAuth();
		const value = realAuth[prop as keyof typeof realAuth];
		if (typeof value === 'function') {
			return (value as Function).bind(realAuth);
		}
		return value;
	}
});
