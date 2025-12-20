import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as schema from './schema';

// Lazy-initialized database connection
// This prevents the connection from being created at build time when env vars aren't available
let _sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getConnectionString(): string {
	const url = env.NEON_DATABASE_URL;

	// SECURITY: Use a safe version for logging (mask passwords)
	const logUrl = (u: string | undefined) => {
		if (!u) return 'missing';
		try {
			const parsed = new URL(u);
			return `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
		} catch {
			return 'invalid-format';
		}
	};

	console.debug('[db.ts] Safe connection check:', logUrl(url));

	if (!url) {
		// This should technically be caught by env validation, but as a fallback:
		throw new Error('NEON_DATABASE_URL is missing.');
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
