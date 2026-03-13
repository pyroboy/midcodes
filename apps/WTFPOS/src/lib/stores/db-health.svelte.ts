/**
 * Database Health Store — detects schema mismatches and stale data.
 * Surfaces errors as reactive state consumed by DbHealthBanner in the root layout.
 */
import { browser } from '$app/environment';
import { getDb, resetDatabase } from '$lib/db';
import { needsRxDb } from '$lib/stores/data-mode.svelte';

export type DbHealthStatus = 'ok' | 'checking' | 'error';

export interface DbHealthState {
	status: DbHealthStatus;
	errorCode: string | null;
	errorMessage: string | null;
}

const KNOWN_LOCATION_IDS = new Set(['tag', 'pgl', 'wh-tag', 'all']);
const STALE_LOCATION_IDS = new Set(['qc', 'mkti', 'wh-qc']);

export const dbHealth = $state<DbHealthState>({
	status: 'checking',
	errorCode: null,
	errorMessage: null,
});

function setError(code: string, message: string) {
	dbHealth.status = 'error';
	dbHealth.errorCode = code;
	dbHealth.errorMessage = message;
}

/**
 * Runs after DB initialization to detect data-level incompatibilities
 * that pass schema validation but break app logic.
 */
async function checkDataIntegrity(db: any) {
	const collections = ['tables', 'orders', 'stock_items', 'deliveries', 'waste', 'expenses'];

	for (const col of collections) {
		if (!db[col]) continue;
		const docs = await db[col].find().exec();
		for (const doc of docs) {
			const locId = doc.locationId ?? doc.get?.('locationId');
			if (locId && STALE_LOCATION_IDS.has(locId)) {
				setError(
					'STALE_DATA',
					`Found documents with outdated location "${locId}" in "${col}". The database needs to be reset to match the current app version.`
				);
				return;
			}
		}
	}

	dbHealth.status = 'ok';
}

/** Call once from root layout onMount */
export async function initDbHealthCheck() {
	if (!browser) return;
	if (!needsRxDb()) return; // No DB to check on thin clients

	try {
		const db = await getDb();
		await checkDataIntegrity(db);
	} catch (err: any) {
		const code = err?.code || 'UNKNOWN';
		const msg = err?.message || 'Database failed to initialize.';
		setError(code, `Database error (${code}): ${msg}`);
	}
}

export { resetDatabase };
