import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/schema';

async function main() {
    if (!process.env.NEON_DATABASE_URL) {
        console.error('NEON_DATABASE_URL not found in environment');
        process.exit(1);
    }
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    const db = drizzle(sql, { schema });
    
    try {
        const users = await db.select().from(schema.user);
        console.log('Found users:', users);
        
        const profiles = await db.select().from(schema.profiles);
        console.log('Found profiles:', profiles);
    } catch (e) {
        console.error('Error listing users:', e);
    }
}

main();
