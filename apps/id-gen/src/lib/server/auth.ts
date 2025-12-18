import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { getDb } from "./db";
import * as schema from "./schema";

// Lazy-initialized auth instance
// Cloudflare Workers require database connections to be created within request handlers,
// not at module initialization time
let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuthConfig(): BetterAuthOptions {
    const db = getDb();
    return {
        database: drizzleAdapter(db, {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            }
        }),
        plugins: [
            admin()
        ],
        emailAndPassword: {
            enabled: true
        },
        databaseHooks: {
            user: {
                create: {
                    after: async (user) => {
                        const db = getDb();
                        await db.insert(schema.profiles).values({
                            id: user.id,
                            email: user.email,
                        });
                    },
                },
            },
        },
    };
}

/**
 * Get the Better Auth instance.
 * Lazily initialized on first call to avoid Cloudflare Workers global scope issues.
 */
export function getAuth() {
    if (!_auth) {
        _auth = betterAuth(getAuthConfig());
    }
    return _auth;
}

// Export as a proxy for backwards compatibility with existing code
// This allows `auth.api.getSession()...` to work without changing all call sites
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
    get(_target, prop) {
        const realAuth = getAuth();
        const value = (realAuth as any)[prop];
        if (typeof value === 'function') {
            return value.bind(realAuth);
        }
        return value;
    }
});
