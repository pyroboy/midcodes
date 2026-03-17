
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import * as schema from '../src/lib/server/schema';
import { eq } from 'drizzle-orm';

const TARGET_USER_ID = 'Gpg3Cw9YXJbxxn8aMdss8r54j0ugtDjF';
const SUPABASE_TEMPLATES_URL = 'https://wnkqlrfmtiibrqnncgqu.supabase.co/storage/v1/object/public/templates/';
const SUPABASE_RENDERED_CARDS_URL = 'https://wnkqlrfmtiibrqnncgqu.supabase.co/storage/v1/object/public/rendered-id-cards/';

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('Error: NEON_DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

// --- Types tailored to the import file ---

interface LegacyElement {
  id: string;
  type: string;
  variableName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font?: string;
  size?: number;
  color?: string;
  alignment?: string;
  [key: string]: any;
}

interface LegacyTemplate {
  id: string;
  name: string;
  orientation: 'portrait' | 'landscape';
  width_pixels: number;
  height_pixels: number;
  front_background: string; // Full URL
  back_background: string; // Full URL
  elements: LegacyElement[];
}

interface LegacyCardData {
  [key: string]: string;
}

interface LegacyCard {
  id: string;
  data: LegacyCardData;
  rendered_front: string; // Relative path
  rendered_back: string; // Relative path
}

interface LegacyData {
  org_id: string;
  org_name: string;
  created_at: string; // Unused, we let PG set defaults or use it? Schema has createdAt defaultNow()
  active_template: LegacyTemplate;
  cards: LegacyCard[];
}

// --- Helper Functions ---

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

async function main() {
  const filePath = 'old_data_file.txt';
  
  console.log(`Reading ${filePath}...`);
  let rawData: string;
  try {
    rawData = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Failed to read file: ${filePath}`, err);
    process.exit(1);
  }

  let data: LegacyData;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    console.error('Failed to parse JSON data', err);
    process.exit(1);
  }

  console.log(`Processing Organization: ${data.org_name} (${data.org_id})`);

  // 1. Upsert Organization
  const orgSlug = slugify(data.org_name);
  
  // Check if org exists
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, data.org_id)
  });

  if (existingOrg) {
    console.log(`Organization ${data.org_id} exists. Updating...`);
    await db.update(schema.organizations)
      .set({
        name: data.org_name,
        // Don't update slug if it exists to avoid breaking links, or update it? 
        // Instruction: "Insert or Update... Map org_id -> id, org_name -> name. Generate urlSlug from name"
        // We'll update it to match the legacy name.
        urlSlug: orgSlug,
      })
      .where(eq(schema.organizations.id, data.org_id));
  } else {
    console.log(`Creating Organization ${data.org_id}...`);
    await db.insert(schema.organizations).values({
      id: data.org_id,
      name: data.org_name,
      urlSlug: orgSlug,
    });
  }

  // 2. Upsert Template
  const tmpl = data.active_template;
  console.log(`Processing Template: ${tmpl.name} (${tmpl.id})`);

  const templateValues = {
    id: tmpl.id,
    userId: TARGET_USER_ID,
    orgId: data.org_id,
    name: tmpl.name,
    orientation: tmpl.orientation,
    widthPixels: tmpl.width_pixels,
    heightPixels: tmpl.height_pixels,
    frontBackground: tmpl.front_background,
    backBackground: tmpl.back_background,
    // JSONB: ensure it's passed as an object/array, drizzle handles stringification
    templateElements: tmpl.elements, 
    dpi: 300, // Default
  };

  const existingTemplate = await db.query.templates.findFirst({
    where: eq(schema.templates.id, tmpl.id)
  });

  if (existingTemplate) {
     console.log(`Template ${tmpl.id} exists. Updating...`);
     await db.update(schema.templates)
       .set(templateValues)
       .where(eq(schema.templates.id, tmpl.id));
  } else {
    console.log(`Creating Template ${tmpl.id}...`);
    await db.insert(schema.templates).values(templateValues);
  }

  // 3. Upsert Cards
  console.log(`Processing ${data.cards.length} cards...`);
  
  let successCount = 0;
  
  // We can do bulk insert if we don't need to check each one, but upsert "on conflict" is better.
  // Neon/Postgres supports ON CONFLICT. Drizzle supports it.
  
  for (const card of data.cards) {
    // Construct full URLs
    // card.rendered_front is like "orgId/tmplId/file.png"
    // We append it to SUPABASE_BASE_URL
    const frontUrl = card.rendered_front ? (card.rendered_front.startsWith('http') ? card.rendered_front : SUPABASE_RENDERED_CARDS_URL + card.rendered_front) : null;
    const backUrl = card.rendered_back ? (card.rendered_back.startsWith('http') ? card.rendered_back : SUPABASE_RENDERED_CARDS_URL + card.rendered_back) : null;

    const cardValues = {
      id: card.id,
      templateId: tmpl.id,
      orgId: data.org_id,
      data: card.data, // JSONB
      frontImage: frontUrl,
      backImage: backUrl,
    };

    try {
      // Using proper ON CONFLICT DO UPDATE
      await db.insert(schema.idcards)
        .values(cardValues)
        .onConflictDoUpdate({
          target: schema.idcards.id,
          set: cardValues
        });
      successCount++;
    } catch (err) {
      console.error(`Failed to upsert card ${card.id}`, err);
    }
  }

  console.log(`Successfully imported ${successCount} cards.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
