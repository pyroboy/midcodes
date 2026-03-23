import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
	if (!_db) {
		const sql = neon(env.DATABASE_URL!);
		_db = drizzle(sql, { schema });
	}
	return _db;
}

// For backwards compatibility
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_target, prop) {
		return (getDb() as any)[prop];
	}
});
