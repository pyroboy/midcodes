import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env as privateEnv } from '$env/dynamic/private';
import * as schema from './schema';

// Lazy-initialized database connection
// This prevents the connection from being created at build time when env vars aren't available
let _sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getConnectionString(): string {
    // Try multiple sources for the env variable
    // process.env works in Node.js/Vite dev, privateEnv works in SvelteKit runtime
    const url = process.env.NEON_DATABASE_URL || privateEnv.NEON_DATABASE_URL;
    console.log('[db.ts DEBUG] Checking Env Vars:', {
        process_env_exists: !!process.env.NEON_DATABASE_URL,
        private_env_exists: !!privateEnv.NEON_DATABASE_URL,
        node_env: process.env.NODE_ENV
    });

    if (!url) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ NEON_DATABASE_URL is missing in dev. Using dummy URL.');
            return 'postgres://dummy:dummy@localhost:5432/dummy';
        }
        throw new Error(
            'Missing NEON_DATABASE_URL environment variable. Configure it in Cloudflare Pages environment variables (and locally via .env).'
        );
    }
    return url;
}

/**
 * Get the database instance.
 * Lazily initialized on first call to avoid build-time errors.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
    if (!_db) {
        _sql = neon(getConnectionString());
        _db = drizzle(_sql, { schema });
    }
    return _db;
}

// Export as a proxy for backwards compatibility with existing code
// This allows `db.select()...` to work without changing all call sites
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
    get(_target, prop) {
        const realDb = getDb();
        const value = (realDb as any)[prop];
        if (typeof value === 'function') {
            return value.bind(realDb);
        }
        return value;
    }
});
