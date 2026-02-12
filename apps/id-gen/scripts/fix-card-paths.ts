/**
 * Fix all ID card asset paths — eliminate legacy/ prefix from R2.
 *
 * Category A (newer MOFI/ATM cards):
 *   DB: https://assets.kanaya.app/legacy/rendered-id-cards/cards/{orgId}/{templateId}/{cardId}/front.png
 *   R2: cards/{orgId}/{templateId}/{cardId}/front.png   ← already exists
 *   Fix: Update DB to R2 key only
 *
 * Category B (legacy timestamp cards):
 *   DB: https://assets.kanaya.app/legacy/rendered-id-cards/{orgId}/{templateId}/{timestamp}_front.png
 *   R2: legacy/rendered-id-cards/{orgId}/{templateId}/{timestamp}_front.png
 *   Fix: Copy R2 object to cards/{orgId}/{templateId}/{cardId}/front.png, update DB, delete old
 *
 * Usage:
 *   npx tsx scripts/fix-card-paths.ts              # dry run
 *   npx tsx scripts/fix-card-paths.ts --apply      # apply fixes
 *   npx tsx scripts/fix-card-paths.ts --cleanup    # delete legacy/ objects after verifying
 */

import 'dotenv/config';
import {
	S3Client,
	ListObjectsV2Command,
	CopyObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// ---- Config ----
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET_NAME || 'id-gen-assets';
const DATABASE_URL = process.env.NEON_DATABASE_URL!;
const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'assets.kanaya.app';

const APPLY = process.argv.includes('--apply');
const CLEANUP = process.argv.includes('--cleanup');

// The prefix we want to strip from full URLs stored in DB
const LEGACY_URL_PREFIX = `https://${R2_DOMAIN}/legacy/rendered-id-cards/`;

// ---- R2 Client ----
const r2 = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

// ---- DB ----
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const idcards = pgTable('idcards', {
	id: uuid('id').primaryKey(),
	frontImage: text('front_image'),
	backImage: text('back_image'),
	frontImageLowRes: text('front_image_low_res'),
	backImageLowRes: text('back_image_low_res'),
	templateId: uuid('template_id'),
	orgId: text('org_id')
});

// ---- Helpers ----

async function listAllR2Objects(prefix: string): Promise<string[]> {
	const allKeys: string[] = [];
	let token: string | undefined;
	do {
		const cmd = new ListObjectsV2Command({
			Bucket: BUCKET,
			Prefix: prefix,
			MaxKeys: 1000,
			ContinuationToken: token
		});
		const res = await r2.send(cmd);
		for (const obj of res.Contents || []) {
			if (obj.Key) allKeys.push(obj.Key);
		}
		token = res.IsTruncated ? res.NextContinuationToken : undefined;
	} while (token);
	return allKeys;
}

async function copyR2Object(sourceKey: string, destKey: string): Promise<void> {
	const cmd = new CopyObjectCommand({
		Bucket: BUCKET,
		CopySource: `${BUCKET}/${sourceKey}`,
		Key: destKey
	});
	await r2.send(cmd);
}

async function deleteR2Object(key: string): Promise<void> {
	const cmd = new DeleteObjectCommand({
		Bucket: BUCKET,
		Key: key
	});
	await r2.send(cmd);
}

/**
 * Given a DB path (full URL), extract the R2 key.
 * e.g. "https://assets.kanaya.app/legacy/rendered-id-cards/cards/org/tmpl/card/front.png"
 *   → "legacy/rendered-id-cards/cards/org/tmpl/card/front.png"
 */
function urlToR2Key(fullUrl: string): string | null {
	const prefix = `https://${R2_DOMAIN}/`;
	if (fullUrl.startsWith(prefix)) {
		return fullUrl.substring(prefix.length);
	}
	return null;
}

/**
 * For a Category A card, the DB has:
 *   https://assets.kanaya.app/legacy/rendered-id-cards/cards/{orgId}/{templateId}/{cardId}/front.png
 * The correct R2 key is:
 *   cards/{orgId}/{templateId}/{cardId}/front.png
 * We just strip the legacy/rendered-id-cards/ part from the URL.
 */
function fixCategoryAPath(fullUrl: string): string | null {
	if (fullUrl.startsWith(LEGACY_URL_PREFIX + 'cards/')) {
		return fullUrl.substring(LEGACY_URL_PREFIX.length);
	}
	return null;
}

/**
 * For a Category B card, the DB has:
 *   https://assets.kanaya.app/legacy/rendered-id-cards/{orgId}/{templateId}/{timestamp}_front.png
 * The current R2 key is:
 *   legacy/rendered-id-cards/{orgId}/{templateId}/{timestamp}_front.png
 * We want to move it to:
 *   cards/{orgId}/{templateId}/{cardId}/front.png
 */
function getCategoryBNewPath(
	cardId: string,
	orgId: string,
	templateId: string,
	side: 'front' | 'back'
): string {
	return `cards/${orgId}/${templateId}/${cardId}/${side}.png`;
}

// ---- Main ----

async function main() {
	if (CLEANUP) {
		await runCleanup();
		return;
	}

	console.log(`\n${'='.repeat(60)}`);
	console.log(APPLY ? '🔧 APPLY MODE — will modify DB and R2' : '🔍 DRY RUN — no changes will be made');
	console.log(`${'='.repeat(60)}\n`);

	// 1. Scan R2
	console.log('📦 Scanning R2 bucket...');
	const cardsKeys = await listAllR2Objects('cards/');
	const legacyKeys = await listAllR2Objects('legacy/');
	console.log(`  cards/: ${cardsKeys.length} objects`);
	console.log(`  legacy/: ${legacyKeys.length} objects\n`);

	const r2KeySet = new Set([...cardsKeys, ...legacyKeys]);

	// 2. Fetch all DB cards
	console.log('📋 Fetching all ID cards from DB...');
	const cards = await db.select().from(idcards);
	console.log(`  ${cards.length} cards found\n`);

	let catA = 0;
	let catB = 0;
	let alreadyCorrect = 0;
	let noImage = 0;
	let unfixable = 0;
	const fixes: Array<{
		id: string;
		category: 'A' | 'B';
		oldFront: string | null;
		oldBack: string | null;
		newFront: string;
		newBack: string;
		r2CopyFront?: { from: string; to: string };
		r2CopyBack?: { from: string; to: string };
	}> = [];

	for (const card of cards) {
		if (!card.frontImage) {
			noImage++;
			continue;
		}

		// Check if already a clean R2 key (no http prefix, starts with cards/)
		if (!card.frontImage.startsWith('http')) {
			if (r2KeySet.has(card.frontImage)) {
				alreadyCorrect++;
				continue;
			}
		}

		// Category A: DB has legacy URL but file exists at cards/ already
		const catAFront = fixCategoryAPath(card.frontImage);
		const catABack = card.backImage ? fixCategoryAPath(card.backImage) : null;

		if (catAFront && r2KeySet.has(catAFront)) {
			catA++;
			fixes.push({
				id: card.id,
				category: 'A',
				oldFront: card.frontImage,
				oldBack: card.backImage,
				newFront: catAFront,
				newBack: catABack || card.backImage || ''
			});
			continue;
		}

		// Category B: legacy timestamp-based files
		const currentR2Key = urlToR2Key(card.frontImage);
		if (currentR2Key && r2KeySet.has(currentR2Key)) {
			catB++;

			const newFront = getCategoryBNewPath(card.id, card.orgId || '', card.templateId || '', 'front');
			const newBack = getCategoryBNewPath(card.id, card.orgId || '', card.templateId || '', 'back');

			const backR2Key = card.backImage ? urlToR2Key(card.backImage) : null;

			fixes.push({
				id: card.id,
				category: 'B',
				oldFront: card.frontImage,
				oldBack: card.backImage,
				newFront,
				newBack,
				r2CopyFront: { from: currentR2Key, to: newFront },
				r2CopyBack: backR2Key && r2KeySet.has(backR2Key) ? { from: backR2Key, to: newBack } : undefined
			});
			continue;
		}

		// Unfixable — file doesn't exist in R2 at all
		unfixable++;
		console.log(`  ⚠️  Unfixable: ${card.id}`);
		console.log(`     DB front: ${card.frontImage}`);
		console.log(`     R2 key would be: ${currentR2Key}`);
		console.log(`     Exists in R2: ${currentR2Key ? r2KeySet.has(currentR2Key) : 'N/A'}`);
	}

	// Print summary
	console.log(`\n${'='.repeat(60)}`);
	console.log('ANALYSIS');
	console.log(`${'='.repeat(60)}`);
	console.log(`  Already correct:  ${alreadyCorrect}`);
	console.log(`  Category A (DB-only fix):   ${catA}`);
	console.log(`  Category B (R2 copy + DB):  ${catB}`);
	console.log(`  No image:         ${noImage}`);
	console.log(`  Unfixable:        ${unfixable}`);
	console.log(`  Total fixable:    ${fixes.length}`);
	console.log(`${'='.repeat(60)}\n`);

	// Print detailed fixes
	for (const fix of fixes) {
		const tag = fix.category === 'A' ? '📝 [A] DB-only' : '📦 [B] R2+DB';
		console.log(`${tag} card ${fix.id.slice(0, 8)}...`);
		console.log(`  front: ${fix.oldFront?.slice(-60)} → ${fix.newFront.slice(-60)}`);
		if (fix.r2CopyFront) {
			console.log(`  R2 copy: ${fix.r2CopyFront.from.slice(-60)} → ${fix.r2CopyFront.to.slice(-60)}`);
		}
	}

	if (!APPLY) {
		console.log(`\n🔒 DRY RUN complete. Run with --apply to execute.\n`);
		return;
	}

	// Apply fixes
	console.log(`\n🔧 Applying ${fixes.length} fixes...\n`);
	let applied = 0;
	let failed = 0;

	for (const fix of fixes) {
		try {
			// Category B: copy R2 objects first
			if (fix.category === 'B') {
				if (fix.r2CopyFront) {
					console.log(`  📦 Copying R2: ${fix.r2CopyFront.from.slice(-50)} → ${fix.r2CopyFront.to.slice(-50)}`);
					await copyR2Object(fix.r2CopyFront.from, fix.r2CopyFront.to);
				}
				if (fix.r2CopyBack) {
					console.log(`  📦 Copying R2: ${fix.r2CopyBack.from.slice(-50)} → ${fix.r2CopyBack.to.slice(-50)}`);
					await copyR2Object(fix.r2CopyBack.from, fix.r2CopyBack.to);
				}
			}

			// Update DB
			const setClause: Record<string, string> = {
				frontImage: fix.newFront,
				backImage: fix.newBack
			};

			await db.update(idcards).set(setClause as any).where(eq(idcards.id, fix.id));
			console.log(`  ✅ Fixed card ${fix.id.slice(0, 8)}... [${fix.category}]`);
			applied++;
		} catch (err) {
			console.error(`  ❌ Failed card ${fix.id.slice(0, 8)}...:`, err);
			failed++;
		}
	}

	console.log(`\n${'='.repeat(60)}`);
	console.log(`RESULTS`);
	console.log(`${'='.repeat(60)}`);
	console.log(`  Applied: ${applied}`);
	console.log(`  Failed:  ${failed}`);
	console.log(`${'='.repeat(60)}`);

	if (failed === 0 && applied > 0) {
		console.log(`\n🎉 All fixes applied! Run with --cleanup to delete legacy/ objects from R2.\n`);
	}
}

async function runCleanup() {
	console.log('\n🗑️  Cleanup: Deleting legacy/ objects from R2...\n');

	const legacyKeys = await listAllR2Objects('legacy/');
	console.log(`Found ${legacyKeys.length} legacy objects to delete.`);

	if (legacyKeys.length === 0) {
		console.log('Nothing to clean up!');
		return;
	}

	// Also check: are there any DB cards still pointing to legacy URLs?
	const cards = await db.select().from(idcards);
	const stillLegacy = cards.filter(
		(c) => c.frontImage?.includes('legacy/') || c.backImage?.includes('legacy/')
	);

	if (stillLegacy.length > 0) {
		console.error(
			`\n❌ ABORT: ${stillLegacy.length} cards still reference legacy paths! Run --apply first.\n`
		);
		stillLegacy.forEach((c) => console.log(`  ${c.id}: ${c.frontImage}`));
		return;
	}

	let deleted = 0;
	let failedDel = 0;

	for (const key of legacyKeys) {
		try {
			await deleteR2Object(key);
			deleted++;
			if (deleted % 20 === 0) console.log(`  Deleted ${deleted}/${legacyKeys.length}...`);
		} catch (err) {
			console.error(`  ❌ Failed to delete ${key}:`, err);
			failedDel++;
		}
	}

	console.log(`\n✅ Cleanup complete: ${deleted} deleted, ${failedDel} failed.\n`);
}

main().catch(console.error);
