import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env as privateEnv } from '$env/dynamic/private';
import * as schema from './schema';

const sql = neon(privateEnv.NEON_DATABASE_URL!);
export const db = drizzle(sql, { schema });
