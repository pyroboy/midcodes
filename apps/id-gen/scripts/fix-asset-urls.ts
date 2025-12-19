
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/schema';
import { eq, like, sql } from 'drizzle-orm';

const PROD_URI = "postgresql://neondb_owner:npg_UIVYCN2w8Thm@ep-long-mouse-a1qfln3s-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const OLD_DOMAIN = 'https://pub-cc60c97dd7214d569a15030136899501.r2.dev';
const NEW_DOMAIN = 'https://assets.kanaya.app';

async function main() {
    console.log(`Fixing Asset URLs: ${OLD_DOMAIN} -> ${NEW_DOMAIN}`);

    const db = drizzle(neon(PROD_URI), { schema });

    console.log('--- DEBUG: Listing first 5 Templates ---');
    const debugTemplates = await db.select({
        id: schema.templates.id,
        sampleFront: schema.templates.sampleFrontUrl,
        sampleBack: schema.templates.sampleBackUrl
    }).from(schema.templates).limit(5);
    console.log(JSON.stringify(debugTemplates, null, 2));
    console.log('---------------------------------------');

    // 1. Template Assets
    console.log('Updating template_assets...');
    const assets = await db.select().from(schema.templateAssets).where(like(schema.templateAssets.imageUrl, `${OLD_DOMAIN}%`));
    console.log(`Found ${assets.length} assets to fix.`);

    for (const a of assets) {
        const newUrl = a.imageUrl.replace(OLD_DOMAIN, NEW_DOMAIN);
        await db.update(schema.templateAssets)
            .set({ imageUrl: newUrl })
            .where(eq(schema.templateAssets.id, a.id));
    }

    // 2. ID Cards (frontImage, backImage)
    console.log('Updating idcards...');
    // Drizzle doesn't support complex "update from" easily in one go for multiple cols, iterate.
    const cards = await db.select().from(schema.idcards).where(
        sql`${schema.idcards.frontImage} LIKE ${OLD_DOMAIN + '%'} OR ${schema.idcards.backImage} LIKE ${OLD_DOMAIN + '%'}`
    );
    console.log(`Found ${cards.length} cards to fix.`);

    for (const c of cards) {
        let update = {};
        if (c.frontImage?.startsWith(OLD_DOMAIN)) {
            update = { ...update, frontImage: c.frontImage.replace(OLD_DOMAIN, NEW_DOMAIN) };
        }
        if (c.backImage?.startsWith(OLD_DOMAIN)) {
            update = { ...update, backImage: c.backImage.replace(OLD_DOMAIN, NEW_DOMAIN) };
        }
        
        if (Object.keys(update).length > 0) {
            await db.update(schema.idcards)
                .set(update)
                .where(eq(schema.idcards.id, c.id));
        }
    }
    
    // 3. Templates (sample URLs, etc)
    console.log('Updating templates...');
    const templates = await db.select().from(schema.templates).where(
        sql`${schema.templates.sampleFrontUrl} LIKE ${OLD_DOMAIN + '%'} OR ${schema.templates.previewFrontUrl} LIKE ${OLD_DOMAIN + '%'}`
    );
     console.log(`Found ${templates.length} templates to fix.`);
     
     for (const t of templates) {
         let update = {};
         // Check all URL fields (sample, blank, thumb, preview)
         const fields = [
             'sampleFrontUrl', 'sampleBackUrl', 
             'blankFrontUrl', 'blankBackUrl',
             'thumbFrontUrl', 'thumbBackUrl',
             'previewFrontUrl', 'previewBackUrl'
         ] as const;
         
         for (const f of fields) {
             const val = t[f];
             if (val && val.startsWith(OLD_DOMAIN)) {
                 update = { ...update, [f]: val.replace(OLD_DOMAIN, NEW_DOMAIN) };
             }
         }
         
         if (Object.keys(update).length > 0) {
            await db.update(schema.templates).set(update).where(eq(schema.templates.id, t.id));
         }
     }

    console.log('✅ URL Fix Complete!');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
