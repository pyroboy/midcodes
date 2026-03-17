import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as schema from '../src/lib/server/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// --- Config ---
// EXACT URL parts derived from your provided instructions
const SUPABASE_DOMAIN = 'wnkqlrfmtiibrqnncgqu.supabase.co';
const SUPABASE_RENDERED_CARDS_BASE = `https://${SUPABASE_DOMAIN}/storage/v1/object/public/rendered-id-cards/`;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'assets.kanaya.app';

// Toggle this to FALSE to actually write to the DB and R2
const DRY_RUN = false; 

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error('NEON_DATABASE_URL not set');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
});

const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema });

// --- Helpers ---

function extractR2Key(supabaseUrl: string): string {
  try {
    const url = new URL(supabaseUrl);
    // Parse path: /storage/v1/object/public/{bucket}/{org}/{tmpl}/{file}
    const pathParts = url.pathname.split('/');
    const publicIdx = pathParts.indexOf('public');
    
    if (publicIdx >= 0) {
      const afterPublic = pathParts.slice(publicIdx + 1);
      const bucketName = afterPublic[0]; // 'rendered-id-cards' or 'templates'
      const relativePath = afterPublic.slice(1).join('/'); 
      
      return `legacy/${bucketName}/${relativePath}`;
    }
    // Fallback if structure is unexpected
    return `legacy/misc/${pathParts.slice(-1)[0]}`;
  } catch {
    return `legacy/error/${Date.now()}`;
  }
}

async function downloadAndUpload(url: string, description: string): Promise<string | null> {
  const r2Key = extractR2Key(url);
  const r2Url = `https://${R2_PUBLIC_DOMAIN}/${r2Key}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would download ${url} \n            -> Upload to ${r2Key}`);
    return r2Url;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 404) {
             console.error(`  ⚠️ 404 Not Found: ${description} (${url})`);
             return null;
        }
        throw new Error(`Fetch failed: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'id-gen-assets',
      Key: r2Key,
      Body: Buffer.from(arrayBuffer),
      ContentType: contentType
    }));

    return r2Url;
  } catch (e: any) {
    console.error(`  ❌ Error processing ${description}: ${e.message}`);
    return null; 
  }
}

// --- Main Logic ---

async function main() {
  console.log(`=== Fix & Migrate from File Started (Dry Run: ${DRY_RUN}) ===`);

  const filePath = path.resolve(process.cwd(), 'old_data_file.txt');
  console.log(`Reading legacy data from: ${filePath}`);

  let fileContent: string;
  try {
      fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
      console.error("Failed to read old_data_file.txt");
      process.exit(1);
  }

  const data = JSON.parse(fileContent);

  // 1. Process Template Backgrounds
  console.log(`\n--- Processing Template: ${data.active_template.name} (${data.active_template.id}) ---`);
  
  const tmpl = data.active_template;
  let tmplUpdates: any = {};

  if (tmpl.front_background) {
      const newUrl = await downloadAndUpload(tmpl.front_background, "Template Front");
      if (newUrl) tmplUpdates.frontBackground = newUrl;
  }
  if (tmpl.back_background) {
      const newUrl = await downloadAndUpload(tmpl.back_background, "Template Back");
      if (newUrl) tmplUpdates.backBackground = newUrl;
  }

  if (Object.keys(tmplUpdates).length > 0 && !DRY_RUN) {
      await db.update(schema.templates)
          .set(tmplUpdates)
          .where(eq(schema.templates.id, tmpl.id));
      console.log(`  ✅ Updated Template DB Records`);
  }

  // 2. Process Cards
  console.log(`\n--- Processing ${data.cards.length} Cards ---`);
  
  let successCount = 0;
  let failCount = 0;

  for (const card of data.cards) {
      // console.log(`Processing Card ${card.id}...`);
      
      let cardUpdates: any = {};
      
      // Construct Front URL
      if (card.rendered_front) {
          const rawPath = card.rendered_front.startsWith('http') 
              ? card.rendered_front 
              : SUPABASE_RENDERED_CARDS_BASE + card.rendered_front;
          
           const newUrl = await downloadAndUpload(rawPath, `Card ${card.id} Front`);
           if (newUrl) cardUpdates.frontImage = newUrl;
      }

      // Construct Back URL
      if (card.rendered_back) {
          const rawPath = card.rendered_back.startsWith('http') 
              ? card.rendered_back 
              : SUPABASE_RENDERED_CARDS_BASE + card.rendered_back;
          
           const newUrl = await downloadAndUpload(rawPath, `Card ${card.id} Back`);
           if (newUrl) cardUpdates.backImage = newUrl;
      }

      if (Object.keys(cardUpdates).length > 0 && !DRY_RUN) {
          try {
              await db.update(schema.idcards)
                  .set(cardUpdates)
                  .where(eq(schema.idcards.id, card.id));
              successCount++;
          } catch (e) {
              console.error(`  ❌ DB Update failed for ${card.id}`);
              failCount++;
          }
      } else {
         // If no updates were made (e.g. 404s), count as skipped/failed
         if (!DRY_RUN) failCount++;
      }
      
      if ((successCount + failCount) % 10 === 0) {
          process.stdout.write('.');
      }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Cards Processed: ${data.cards.length}`);
  console.log(`Success (Updated in DB): ${successCount}`);
  console.log(`Failed/Skipped: ${failCount}`);
}

main().catch(console.error);
