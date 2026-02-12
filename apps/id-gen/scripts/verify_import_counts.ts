
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/lib/server/schema';
import { eq, sql } from 'drizzle-orm';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) process.exit(1);

const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema });

async function main() {
  const orgCount = await db.select({ count: sql<number>`count(*)` }).from(schema.organizations).where(eq(schema.organizations.id, '5362984d-5032-4361-afa3-6a7d6b56a4f4'));
  const tmplCount = await db.select({ count: sql<number>`count(*)` }).from(schema.templates).where(eq(schema.templates.id, '5b609b83-7053-48be-8f19-afa6f9bd6b6e'));
  const cardCount = await db.select({ count: sql<number>`count(*)` }).from(schema.idcards).where(eq(schema.idcards.orgId, '5362984d-5032-4361-afa3-6a7d6b56a4f4'));

  console.log(`Organization Count: ${orgCount[0].count}`);
  console.log(`Template Count: ${tmplCount[0].count}`);
  console.log(`Card Count (for this org): ${cardCount[0].count}`);
}

main();
