/**
 * Phase 5: Image Migration
 *
 * Downloads Supabase Storage images to static/uploads/ and updates
 * URL references in Neon. Leaves Cloudinary URLs unchanged.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	getNeonDb,
	log,
	logSuccess,
	logError
} from './_shared.js';
import { sql } from 'drizzle-orm';

const STATIC_DIR = path.resolve(import.meta.dirname, '../../static/uploads');

// Supabase anon key for authenticated storage downloads
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY;

interface UrlRow {
	id: string | number;
	url: string;
}

async function downloadFile(url: string, destPath: string): Promise<boolean> {
	try {
		const headers: Record<string, string> = {};

		// Add auth header for Supabase storage URLs
		if (url.includes('supabase.co') && SUPABASE_ANON_KEY) {
			headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
			headers['apikey'] = SUPABASE_ANON_KEY;
		}

		const res = await fetch(url, { headers });
		if (!res.ok) {
			logError('phase5', `HTTP ${res.status} for ${url}`);
			return false;
		}

		const buffer = Buffer.from(await res.arrayBuffer());
		const dir = path.dirname(destPath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(destPath, buffer);
		return true;
	} catch (e: any) {
		logError('phase5', `Download failed: ${url} — ${e.message}`);
		return false;
	}
}

function getExtension(url: string): string {
	try {
		const pathname = new URL(url).pathname;
		const ext = path.extname(pathname).toLowerCase();
		return ext || '.webp'; // default to webp if no extension
	} catch {
		return '.webp';
	}
}

export async function runPhase5() {
	log('phase5', '═══ Phase 5: Image Migration ═══');

	const neon = getNeonDb();

	// ── 1. Collect all image URLs from Neon ──────────────────────

	// Tenant profile pictures
	log('phase5', 'Scanning tenant profile_picture_url...');
	const tenantUrlsRaw = await neon.execute(
		sql`SELECT id::text, profile_picture_url AS url FROM tenants WHERE profile_picture_url IS NOT NULL`
	);
	const tenantUrls: UrlRow[] = ((tenantUrlsRaw as any).rows ?? tenantUrlsRaw) as UrlRow[];

	// Payment receipts
	log('phase5', 'Scanning payment receipt_url...');
	const paymentUrlsRaw = await neon.execute(
		sql`SELECT id::text, receipt_url AS url FROM payments WHERE receipt_url IS NOT NULL`
	);
	const paymentUrls: UrlRow[] = ((paymentUrlsRaw as any).rows ?? paymentUrlsRaw) as UrlRow[];

	log('phase5', `Found ${tenantUrls.length} tenant images, ${paymentUrls.length} payment receipts`);

	// ── 2. Filter for Supabase Storage URLs ──────────────────────
	const isSupabaseUrl = (url: string) => url.includes('supabase.co/storage');

	const tenantSupabase = tenantUrls.filter((r) => isSupabaseUrl(r.url));
	const paymentSupabase = paymentUrls.filter((r) => isSupabaseUrl(r.url));
	const tenantOther = tenantUrls.filter((r) => !isSupabaseUrl(r.url));
	const paymentOther = paymentUrls.filter((r) => !isSupabaseUrl(r.url));

	log('phase5', `Supabase URLs: ${tenantSupabase.length} tenants, ${paymentSupabase.length} payments`);
	log('phase5', `Other URLs (Cloudinary, etc): ${tenantOther.length} tenants, ${paymentOther.length} payments — will keep as-is`);

	// ── 3. Download & save tenant images ─────────────────────────
	log('phase5', '\n── Downloading tenant images ──');
	let downloaded = 0;
	let failed = 0;

	for (const { id, url } of tenantSupabase) {
		const ext = getExtension(url);
		const filename = `${id}${ext}`;
		const destPath = path.join(STATIC_DIR, 'tenants', filename);
		const newUrl = `/uploads/tenants/${filename}`;

		log('phase5', `  Tenant ${id}: downloading...`);
		const ok = await downloadFile(url, destPath);

		if (ok) {
			await neon.execute(
				sql`UPDATE tenants SET profile_picture_url = ${newUrl} WHERE id = ${Number(id)}`
			);
			downloaded++;
		} else {
			failed++;
		}
	}
	log('phase5', `Tenant images: ${downloaded} downloaded, ${failed} failed`);

	// ── 4. Download & save payment receipts ──────────────────────
	log('phase5', '\n── Downloading payment receipts ──');
	downloaded = 0;
	failed = 0;

	for (const { id, url } of paymentSupabase) {
		const ext = getExtension(url);
		const filename = `${id}${ext}`;
		const destPath = path.join(STATIC_DIR, 'payments', filename);
		const newUrl = `/uploads/payments/${filename}`;

		log('phase5', `  Payment ${id}: downloading...`);
		const ok = await downloadFile(url, destPath);

		if (ok) {
			await neon.execute(
				sql`UPDATE payments SET receipt_url = ${newUrl} WHERE id = ${Number(id)}`
			);
			downloaded++;
		} else {
			failed++;
		}
	}
	log('phase5', `Payment receipts: ${downloaded} downloaded, ${failed} failed`);

	// ── 5. Verify ────────────────────────────────────────────────
	log('phase5', '\n── Verification ──');

	// Check no remaining supabase URLs
	const remainingTenantRaw = await neon.execute(
		sql`SELECT COUNT(*)::int AS count FROM tenants WHERE profile_picture_url LIKE '%supabase.co/storage%'`
	);
	const remainingPaymentRaw = await neon.execute(
		sql`SELECT COUNT(*)::int AS count FROM payments WHERE receipt_url LIKE '%supabase.co/storage%'`
	);

	const remainT = ((remainingTenantRaw as any).rows ?? remainingTenantRaw)?.[0]?.count ?? 0;
	const remainP = ((remainingPaymentRaw as any).rows ?? remainingPaymentRaw)?.[0]?.count ?? 0;

	if (remainT === 0 && remainP === 0) {
		logSuccess('phase5', 'No remaining Supabase Storage URLs in database');
	} else {
		logError('phase5', `Remaining Supabase URLs: ${remainT} tenants, ${remainP} payments`);
	}

	// Spot-check local files exist
	const uploadsDir = path.join(STATIC_DIR, 'tenants');
	if (fs.existsSync(uploadsDir)) {
		const files = fs.readdirSync(uploadsDir);
		log('phase5', `Files in static/uploads/tenants/: ${files.length}`);
	}

	logSuccess('phase5', 'Phase 5 complete. Verify images display correctly in the app.');
}
