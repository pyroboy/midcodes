import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as schema from './schema';

let _sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Get the database instance, lazily initialized on first call.
 * Lazy init prevents build-time errors when env vars aren't available.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
	if (!_db) {
		const url = env.NEON_DATABASE_URL;
		if (!url) {
			throw new Error('NEON_DATABASE_URL is missing.');
		}
		_sql = neon(url);
		_db = drizzle(_sql, { schema });
	}
	return _db;
}

/**
 * Proxy export for ergonomic usage: `db.select()...`
 * Defers actual connection until first query.
 */
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
