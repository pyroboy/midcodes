import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as schema from './schema';

// Lazy-initialized connection — avoids errors at build time when env vars aren't present
let _sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
	if (!_db) {
		_sql = neon(env.NEON_DATABASE_URL);
		_db = drizzle(_sql, { schema });
	}
	return _db;
}

// Proxy export for ergonomic `db.select()...` usage at call sites
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
	get(_target, prop) {
		const realDb = getDb();
		const value = (realDb as any)[prop];
		if (typeof value === 'function') return value.bind(realDb);
		return value;
	}
});
