/**
 * Shared utilities for Supabase → Neon data migration.
 *
 * - Supabase: read-only via `pg` (TCP connection)
 * - Neon: write via Drizzle (HTTP driver)
 */

import pg from 'pg';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../src/lib/server/schema.js';
import { sql } from 'drizzle-orm';
import * as fs from 'node:fs';
import * as path from 'node:path';
import 'dotenv/config';

// ── Supabase (source, read-only) ──────────────────────────────────

let _supabaseClient: pg.Client | null = null;

export async function getSupabaseClient(): Promise<pg.Client> {
	if (_supabaseClient) return _supabaseClient;

	const url = process.env.SUPABASE_DB_URL;
	if (!url) {
		throw new Error(
			'SUPABASE_DB_URL is not set. Add it to apps/dorm/.env.local\n' +
				'Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)'
		);
	}

	// Supavisor pooler has intermittent SCRAM auth issues — retry up to 5 times
	for (let attempt = 1; attempt <= 5; attempt++) {
		try {
			const client = new pg.Client({
				connectionString: url,
				ssl: { rejectUnauthorized: false }
			});
			await client.connect();
			_supabaseClient = client;
			return _supabaseClient;
		} catch (e: any) {
			if (e.message?.includes('SCRAM') && attempt < 5) {
				log('shared', `SCRAM auth failed (attempt ${attempt}/5), retrying in 2s...`);
				await new Promise((r) => setTimeout(r, 2000));
				continue;
			}
			throw e;
		}
	}
	throw new Error('Failed to connect to Supabase after 5 attempts');
}

export async function closeSupabase(): Promise<void> {
	if (_supabaseClient) {
		await _supabaseClient.end();
		_supabaseClient = null;
	}
}

// ── Neon (target, write) ──────────────────────────────────────────

export function getNeonDb() {
	const url = process.env.NEON_DATABASE_URL;
	if (!url) {
		throw new Error('NEON_DATABASE_URL is not set in .env or .env.local');
	}
	const client = neon(url);
	return drizzle(client, { schema });
}

export { schema };

// ── Helpers ───────────────────────────────────────────────────────

export async function countRows(client: pg.Client, table: string, schemaName = 'public'): Promise<number> {
	const res = await client.query(`SELECT COUNT(*)::int AS count FROM "${schemaName}"."${table}"`);
	return res.rows[0].count;
}

export async function countNeonRows(db: ReturnType<typeof getNeonDb>, tableName: string): Promise<number> {
	const query = sql`SELECT COUNT(*)::int AS count FROM ${sql.identifier(tableName)}`;
	const res = await db.execute(query);
	return (res as any).rows?.[0]?.count ?? (res as any)[0]?.count ?? 0;
}

/**
 * Reset a serial/bigserial sequence to MAX(id) so new inserts don't collide.
 */
export async function resetSequence(db: ReturnType<typeof getNeonDb>, tableName: string, pkColumn = 'id'): Promise<void> {
	await db.execute(
		sql`SELECT setval(pg_get_serial_sequence(${tableName}, ${pkColumn}), COALESCE((SELECT MAX(${sql.identifier(pkColumn)}) FROM ${sql.identifier(tableName)}), 1))`
	);
}

// ── ID Mapping ────────────────────────────────────────────────────

const MAPPING_PATH = path.join(import.meta.dirname, 'id-mapping.json');

export type IdMapping = Record<string, string>; // oldUUID → newUUID

export function loadIdMapping(): IdMapping {
	if (fs.existsSync(MAPPING_PATH)) {
		return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
	}
	return {};
}

export function saveIdMapping(mapping: IdMapping): void {
	fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2));
	log('mapping', `Saved ${Object.keys(mapping).length} entries to id-mapping.json`);
}

// ── Logging ───────────────────────────────────────────────────────

export function log(phase: string, msg: string): void {
	const ts = new Date().toISOString().slice(11, 19);
	console.log(`[${ts}] [${phase}] ${msg}`);
}

export function logError(phase: string, msg: string): void {
	const ts = new Date().toISOString().slice(11, 19);
	console.error(`[${ts}] [${phase}] ❌ ${msg}`);
}

export function logSuccess(phase: string, msg: string): void {
	const ts = new Date().toISOString().slice(11, 19);
	console.log(`[${ts}] [${phase}] ✅ ${msg}`);
}
