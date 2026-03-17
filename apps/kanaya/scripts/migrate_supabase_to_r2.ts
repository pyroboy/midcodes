import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as schema from '../src/lib/server/schema';
import { eq, or, like, sql } from 'drizzle-orm';

// --- Config ---
// EXACT URL parts derived from your provided working URL
const SUPABASE_DOMAIN = 'wnkqlrfmtiibrqnncgqu.supabase.co';
const SUPABASE_RENDERED_CARDS_BASE = `https://${SUPABASE_DOMAIN}/storage/v1/object/public/rendered-id-cards/`;
const SUPABASE_TEMPLATES_BASE = `https://${SUPABASE_DOMAIN}/storage/v1/object/public/templates/`;
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

function isSupabaseUrl(url: string | null): boolean {
  return !!url && url.includes(SUPABASE_DOMAIN);
}

function isRelativePath(path: string | null): boolean {
  if (!path) return false;
  return !path.startsWith('http') && !path.startsWith('blob:') && path.length > 0;
}

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
      
      // Result: "legacy/rendered-id-cards/5362.../5b60.../file.png"
      return `legacy/${bucketName}/${relativePath}`;
    }
    return `legacy/misc/${pathParts.slice(-1)[0]}`;
  } catch {
    return `legacy/error/${Date.now()}`;
  }
}

async function downloadAndUpload(url: string): Promise<string> {
  const r2Key = extractR2Key(url);
  const r2Url = `https://${R2_PUBLIC_DOMAIN}/${r2Key}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would download ${url} \n            -> Upload to ${r2Key}`);
    return r2Url;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    
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
    console.error(`  ❌ Error processing ${url}: ${e.message}`);
    throw e;
  }
}

// --- Main Migration Logic ---

async function main() {
  console.log(`=== Migration Started (Dry Run: ${DRY_RUN}) ===`);

  // 1. Process Templates (Front/Back)
  console.log('\n--- Processing Templates ---');
  const templates = await db.select().from(schema.templates);
  
  for (const t of templates) {
    let updates: any = {};
    

    // Check Front Background
    try {
        if (isRelativePath(t.frontBackground)) {
            // Fix relative path first
            t.frontBackground = SUPABASE_TEMPLATES_BASE + t.frontBackground;
        }
        if (isSupabaseUrl(t.frontBackground)) {
            updates.frontBackground = await downloadAndUpload(t.frontBackground!);
        }
    } catch (e: any) {
        console.error(`  ❌ Failed to process template front background for ${t.name}: ${e.message}`);
    }

    // Check Back Background
    try {
        if (isRelativePath(t.backBackground)) {
            t.backBackground = SUPABASE_TEMPLATES_BASE + t.backBackground;
        }
        if (isSupabaseUrl(t.backBackground)) {
            updates.backBackground = await downloadAndUpload(t.backBackground!);
        }
    } catch (e: any) {
        console.error(`  ❌ Failed to process template back background for ${t.name}: ${e.message}`);
    }

    // Add logic here for template thumbnails if your schema has them (e.g. front_background_low_res)

    if (Object.keys(updates).length > 0 && !DRY_RUN) {
        await db.update(schema.templates).set(updates).where(eq(schema.templates.id, t.id));
        console.log(`  ✅ Updated Template: ${t.name}`);
    }
  }

  // 2. Process ID Cards (Front/Back AND Low Res)
  console.log('\n--- Processing ID Cards ---');
  
  // Note: Ensure your schema.ts maps snake_case correctly. 
  // e.g. frontImage: text('front_image')
  const cards = await db.select().from(schema.idcards);

  let successCount = 0;

  for (const card of cards) {
    let updates: any = {};
    const processField = async (val: string | null, baseUrl: string) => {
        if (!val) return null;
        let urlToProcess = val;
        
        // 1. Fix broken/relative paths
        if (isRelativePath(val)) {
            urlToProcess = baseUrl + val;
        }
        // 2. Fix "Wrong Bucket" error (templates -> rendered-id-cards)
        if (urlToProcess.includes('/templates/') && baseUrl.includes('rendered-id-cards')) {
            urlToProcess = urlToProcess.replace('/templates/', '/rendered-id-cards/');
        }

        // 3. Migrate if it's a Supabase URL
        if (isSupabaseUrl(urlToProcess)) {
            return await downloadAndUpload(urlToProcess);
        }
        return null;
    };


    // --- Main Images ---
    try {
        const newFront = await processField(card.frontImage, SUPABASE_RENDERED_CARDS_BASE);
        if (newFront) updates.frontImage = newFront;
    } catch (e: any) {
        console.error(`  ❌ Failed to process front image for card ${card.id}: ${e.message}`);
    }

    try {
        const newBack = await processField(card.backImage, SUPABASE_RENDERED_CARDS_BASE);
        if (newBack) updates.backImage = newBack;
    } catch (e: any) {
        console.error(`  ❌ Failed to process back image for card ${card.id}: ${e.message}`);
    }

    // --- CRITICAL FIX: Low Res / Thumbnails ---
    // Make sure these property names match your Drizzle Schema keys exactly!
    try {
        const newFrontLow = await processField(card.frontImageLowRes, SUPABASE_RENDERED_CARDS_BASE);
        if (newFrontLow) updates.frontImageLowRes = newFrontLow;
    } catch (e: any) {
        console.error(`  ❌ Failed to process front low res image for card ${card.id}: ${e.message}`);
    }

    try {
        const newBackLow = await processField(card.backImageLowRes, SUPABASE_RENDERED_CARDS_BASE);
        if (newBackLow) updates.backImageLowRes = newBackLow;
    } catch (e: any) {
        console.error(`  ❌ Failed to process back low res image for card ${card.id}: ${e.message}`);
    }

    if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
            await db.update(schema.idcards).set(updates).where(eq(schema.idcards.id, card.id));
        }
        successCount++;
    }
  }

  console.log(`\n=== Complete. Processed ${successCount} cards. ===`);
}

main().catch(console.error);
