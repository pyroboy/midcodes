import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/schema';
import { like, not, and, sql } from 'drizzle-orm';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error('NEON_DATABASE_URL not set');

const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema });

async function main() {
    console.log("=== Verification Started ===");
    
    // Check if any Supabase URLs remain
    const remainingSupabase = await db.select({ count: sql<number>`count(*)` })
        .from(schema.idcards)
        .where(like(schema.idcards.frontImage, '%supabase.co%'));

    console.log(`Cards with Supabase URLs: ${remainingSupabase[0].count}`);

    // Check if any R2 URLs exist
    const correctR2 = await db.select({ count: sql<number>`count(*)` })
        .from(schema.idcards)
        .where(like(schema.idcards.frontImage, '%assets.kanaya.app%'));

    console.log(`Cards with R2 URLs: ${correctR2[0].count}`);

    // Sample one
    const sample = await db.query.idcards.findFirst({
        where: like(schema.idcards.frontImage, '%assets.kanaya.app%')
    });
    
    if (sample) {
        console.log("\nSample Card:");
        console.log(`ID: ${sample.id}`);
        console.log(`Front: ${sample.frontImage}`);
        console.log(`Back: ${sample.backImage}`);
    } else {
        console.log("\nNo cards found with R2 URLs.");
    }
}

main().catch(console.error);
