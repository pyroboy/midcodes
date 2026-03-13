/**
 * Server self-test: verifies replication endpoints can serve data.
 * Runs automatically after the first push populates the server store.
 * Tests each collection's pull path internally (no HTTP overhead).
 */

import { getCollectionStore, getServerStoreSummary } from './replication-store';
import { log } from './logger';

let _hasRun = false;

const TEST_COLLECTIONS = [
	'tables', 'orders', 'menu_items', 'kds_tickets', 'devices',
	'stock_items', 'deliveries', 'expenses', 'audit_logs'
];

interface TestResult {
	collection: string;
	storeCount: number;
	pullCount: number;
	pass: boolean;
	error?: string;
}

/**
 * Run the self-test. Call this after the first batch of data arrives.
 * Logs a clear PASS/FAIL banner to the server console.
 */
export function runSelfTest(): void {
	if (_hasRun) return;
	_hasRun = true;

	// Defer slightly so all push batches finish settling
	setTimeout(() => {
		const { total } = getServerStoreSummary();
		if (total < 5) {
			log.warn('SelfTest', 'Skipped — server store has < 5 docs');
			return;
		}
		executeTests();
	}, 2_000);
}

function executeTests(): void {
	const results: TestResult[] = [];
	let totalStored = 0;
	let totalPulled = 0;

	for (const name of TEST_COLLECTIONS) {
		const store = getCollectionStore(name);
		if (!store) {
			results.push({ collection: name, storeCount: 0, pullCount: 0, pass: true });
			continue;
		}

		const storeCount = store.count();
		totalStored += storeCount;

		if (storeCount === 0) {
			results.push({ collection: name, storeCount: 0, pullCount: 0, pass: true });
			continue;
		}

		try {
			// Test 1: Pull from checkpoint=null (fresh client scenario)
			const firstPull = store.pull(null, 100);
			const pullCount = firstPull.documents.length;
			totalPulled += pullCount;

			// Test 2: Verify checkpoint is returned
			const hasCheckpoint = !!firstPull.checkpoint?.id && !!firstPull.checkpoint?.updatedAt;

			// Test 3: If there are more docs, verify pagination works
			let paginationOk = true;
			if (storeCount > 100 && firstPull.checkpoint) {
				const secondPull = store.pull(firstPull.checkpoint, 100);
				paginationOk = secondPull.documents.length > 0;
			}

			const pass = pullCount > 0 && hasCheckpoint && paginationOk;
			results.push({
				collection: name,
				storeCount,
				pullCount,
				pass,
				error: !pass
					? `pulled=${pullCount} checkpoint=${hasCheckpoint} pagination=${paginationOk}`
					: undefined,
			});
		} catch (err: any) {
			results.push({
				collection: name,
				storeCount,
				pullCount: 0,
				pass: false,
				error: err.message ?? String(err),
			});
		}
	}

	// Format results
	const passed = results.filter(r => r.pass);
	const failed = results.filter(r => !r.pass);
	const withData = results.filter(r => r.storeCount > 0);

	const lines: string[] = [
		failed.length === 0
			? '✅ SERVER SELF-TEST PASSED'
			: '❌ SERVER SELF-TEST FAILED',
		`${passed.length}/${results.length} collections OK | ${totalStored} stored, ${totalPulled} pullable`,
		'',
	];

	// Show collections with data and their pull results
	for (const r of withData) {
		const icon = r.pass ? '✅' : '❌';
		const detail = r.error ? ` — ${r.error}` : '';
		lines.push(`  ${icon} ${r.collection.padEnd(16)} store:${String(r.storeCount).padStart(4)}  pull:${String(r.pullCount).padStart(4)}${detail}`);
	}

	if (failed.length > 0) {
		lines.push('');
		lines.push('⚠ Failed collections will not serve data to LAN clients!');
	} else {
		lines.push('');
		lines.push('All pull endpoints verified — LAN clients can receive this data.');
	}

	log.banner(...lines);
}

/** Allow manual re-run (e.g., from admin endpoint) */
export function resetSelfTest(): void {
	_hasRun = false;
}
