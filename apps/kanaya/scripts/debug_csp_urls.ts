import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error('NEON_DATABASE_URL not set');

const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema });

async function main() {
    const templateId = '5b609b83-7053-48be-8f19-afa6f9bd6b6e';
    console.log(`Checking cards for template: ${templateId}`);

    const cards = await db.select({
        id: schema.idcards.id,
        frontImage: schema.idcards.frontImage,
        backImage: schema.idcards.backImage
    })
    .from(schema.idcards)
    .where(eq(schema.idcards.templateId, templateId))
    .limit(5);

    console.log("Sample Cards:");
    cards.forEach(c => {
        console.log(`Card ${c.id}:`);
        console.log(`  Front: ${c.frontImage}`);
        console.log(`  Back:  ${c.backImage}`);
    });
}

main().catch(console.error);
