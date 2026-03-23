import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { env } from './env';

type DB = ReturnType<typeof drizzle<typeof schema>>;
let _db: DB | null = null;

export const db = new Proxy({} as DB, {
	get(_target, prop: string) {
		if (!_db) {
			const sql = neon(env.NEON_DATABASE_URL);
			_db = drizzle(sql, { schema });
		}
		return (_db as any)[prop];
	}
});
