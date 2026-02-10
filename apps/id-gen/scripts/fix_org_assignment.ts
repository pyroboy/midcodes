/**
 * Fix Org Assignment Script
 * 
 * Problem: The legacy data was imported under org "March of Faith, Inc." 
 * (5362984d-5032-4361-afa3-6a7d6b56a4f4), but the user arjomagno's profile 
 * points to org "MidCodes" (a569a72d-69f1-432a-80fd-ca076f96d34d).
 * 
 * Fix: Move the imported template and cards to the user's current org (MidCodes).
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/schema';
import { eq, sql } from 'drizzle-orm';

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error('NEON_DATABASE_URL not set');
  process.exit(1);
}

const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema });

const IMPORTED_ORG_ID = '5362984d-5032-4361-afa3-6a7d6b56a4f4';
const USER_ORG_ID = 'a569a72d-69f1-432a-80fd-ca076f96d34d';
const IMPORTED_TEMPLATE_ID = '5b609b83-7053-48be-8f19-afa6f9bd6b6e';

async function main() {
  console.log('=== Fix Org Assignment ===\n');
  console.log(`Moving imported data from org ${IMPORTED_ORG_ID} to ${USER_ORG_ID}\n`);

  // 1. Update the template's orgId
  console.log('1. Updating template orgId...');
  const templateResult = await db.update(schema.templates)
    .set({ orgId: USER_ORG_ID })
    .where(eq(schema.templates.id, IMPORTED_TEMPLATE_ID));
  console.log('   Template updated ✅');

  // 2. Update all cards' orgId for this org
  console.log('2. Updating cards orgId...');
  const cardResult = await db.update(schema.idcards)
    .set({ orgId: USER_ORG_ID })
    .where(eq(schema.idcards.orgId, IMPORTED_ORG_ID));
  console.log('   Cards updated ✅');

  // 3. Verify the changes
  console.log('\n3. Verifying changes...');
  
  const tmplCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.templates)
    .where(eq(schema.templates.orgId, USER_ORG_ID));
  console.log(`   Templates under MidCodes org: ${tmplCount[0].count}`);

  const cardCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.idcards)
    .where(eq(schema.idcards.orgId, USER_ORG_ID));
  console.log(`   Cards under MidCodes org: ${cardCount[0].count}`);

  // Check nothing left under old org
  const oldCardCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.idcards)
    .where(eq(schema.idcards.orgId, IMPORTED_ORG_ID));
  console.log(`   Cards still under old org: ${oldCardCount[0].count}`);

  console.log('\n=== Fix Complete ===');
  console.log('The imported template and 77 cards should now be visible in the dashboard.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
