import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { getDb } from "./db";
import * as schema from "./schema";

// Lazy-initialized auth instance
// Cloudflare Workers require database connections to be created within request handlers,
// not at module initialization time
let _auth: ReturnType<typeof createAuth> | null = null;

/**
 * Create the Better Auth instance with proper configuration.
 * Called lazily on first access.
 */
function createAuth() {
    const db = getDb();
    return betterAuth({
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
    });
}

/**
 * Get the Better Auth instance.
 * Lazily initialized on first call to avoid Cloudflare Workers global scope issues.
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
// This allows `auth.api.getSession()...` to work without changing all call sites
// The proxy ensures lazy initialization happens on first property access
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
