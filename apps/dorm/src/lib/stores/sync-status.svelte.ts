/**
 * Reactive sync status store for RxDB replication.
 * Tracks per-collection sync state (syncing, synced, error, doc counts).
 * Also tracks service health (Neon reachability, RxDB readiness) and a status log.
 */

import { mutationQueue, type PendingMutation } from '$lib/stores/mutation-queue.svelte';

/** Clock-skew-safe age checks: treat negative ages (future timestamps) as invalid. */
export function isFresh(ageMs: number, maxMs: number): boolean {
	return ageMs >= 0 && ageMs < maxMs;
}
export function isStale(ageMs: number, thresholdMs: number): boolean {
	return ageMs >= 0 && ageMs > thresholdMs;
}

export type ParsedError = {
	code: string | null;       // e.g. 'VD2', 'SC34', 'DB9', 'HTTP 401'
	summary: string;           // short human-readable summary
	isRxdb: boolean;           // true if it came from RxDB
	url: string | null;        // rxdb docs url for the error code
};

export type CollectionSyncState = {
	name: string;
	status: 'idle' | 'syncing' | 'synced' | 'error';
	docCount: number;
	lastSyncedAt: string | null;
	error: string | null;
	parsedError: ParsedError | null;
};

export type SyncPhase = 'idle' | 'initializing' | 'syncing' | 'complete' | 'error';

/**
 * Data flow direction between IndexedDB and Neon.
 * - 'pull': Neon → IndexedDB (downloading data during sync/resync)
 * - 'push': IndexedDB → Neon (form action writing to server)
 * - 'idle': No active data flow
 * - 'error': Flow broken (disconnected)
 */
export type FlowDirection = 'pull' | 'push' | 'idle' | 'error';

export type ServiceHealth = 'unknown' | 'checking' | 'ok' | 'error';

export type StatusLogEntry = {
	time: string;
	message: string;
	level: 'info' | 'success' | 'error' | 'warn';
};

export type NeonInteraction = {
	type: 'pull' | 'push' | 'health';
	collection: string | null; // null for health checks
	timestamp: number;
	latencyMs: number;
	bytesReceived: number;
	docCount: number;
};

export type NeonUsageStats = {
	sessionStartedAt: number;
	lastInteraction: NeonInteraction | null;
	pullCount: number;
	pushCount: number;
	healthCheckCount: number;
	totalBytesReceived: number;
	totalLatencyMs: number;
	totalDocsReceived: number;
};

export type NeonBillingData = {
	compute: { used: number; limit: number; unit: string };
	storage: { used: number; limit: number; unit: string };
	transfer: { used: number; limit: number; unit: string };
	periodStart: string;
	periodEnd: string;
	fetchedAt: number;
};

const COLLECTIONS = [
	// Structural (sync first — needed for client-side joins/enrichment)
	'properties', 'floors', 'rental_units',
	// Core entities
	'tenants', 'leases', 'lease_tenants', 'meters',
	// Transactional
	'readings', 'billings', 'payments', 'payment_allocations',
	// Auxiliary
	'expenses', 'budgets', 'penalty_configs',
	// Floor plan
	'floor_layout_items'
];

const MAX_LOG_ENTRIES = 100;
const NEON_USAGE_KEY = '__dorm_neon_usage';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const LOG_STORAGE_KEY = '__dorm_sync_logs';

/**
 * Persistent log storage using localStorage.
 * Synchronous read/write — no race conditions, no debounce, no async gaps.
 * 100 entries × ~100 bytes = ~10KB, well within localStorage's 5MB limit.
 * IndexedDB was tried but its async nature made it impossible to reliably
 * persist during page unload (beforeunload can't await async writes).
 */
function persistLogs(entries: StatusLogEntry[]) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES)));
	} catch { /* quota exceeded — non-critical */ }
}

function loadPersistedLogs(): StatusLogEntry[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
	} catch { return []; }
}

function clearPersistedLogs() {
	if (typeof localStorage === 'undefined') return;
	try { localStorage.removeItem(LOG_STORAGE_KEY); } catch {}
}

function hydrateNeonUsage(): NeonUsageStats | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(NEON_USAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as NeonUsageStats;
		// Reset if session is >24h old or clock-skewed (future timestamp).
		if (!isFresh(Date.now() - data.sessionStartedAt, SESSION_MAX_AGE_MS)) return null;
		return data;
	} catch {
		return null;
	}
}

function persistNeonUsage(stats: NeonUsageStats) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(NEON_USAGE_KEY, JSON.stringify(stats));
	} catch { /* quota exceeded — non-critical */ }
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Complete RxDB error code labels (v16).
 * Source: node_modules/rxdb/dist/esm/plugins/dev-mode/error-messages.js
 * 128 codes across 23 categories.
 */
const RXDB_CODE_LABELS: Record<string, string> = {
	// ── util / config ──
	UT1: 'Given name is not a string or is empty',
	UT2: 'Database/collection name does not match CouchDB-compatible regex',
	UT3: 'Replication direction must be push, pull, or both',
	UT4: 'Given leveldown is not a valid adapter',
	UT5: 'keyCompression enabled but no key-compression handler in storage',
	UT6: 'Schema has encrypted fields but no encryption handler in storage',
	UT7: 'attachments.compression enabled but no attachment-compression plugin',
	UT8: 'crypto.subtle.digest is not available in this runtime',

	// ── plugins ──
	PL1: 'Given plugin is not a valid RxDB plugin',
	PL3: 'Plugin with same name already added but different JS object',

	// ── bulk operations ──
	P2: 'bulkWrite() cannot be called with an empty array',

	// ── rx-query ──
	QU1: 'RxQuery._execOverDatabase(): unknown op',
	QU4: 'Cannot use .regex() on the primary field',
	QU5: 'sort() key is not defined in the schema',
	QU6: 'limit() cannot be called on .findOne()',
	QU9: 'throwIfMissing can only be used in findOne queries',
	QU10: 'Result empty and throwIfMissing: true',
	QU11: 'No valid query params given',
	QU12: 'Given index is not in schema',
	QU13: 'Top-level query field not in schema',
	QU14: 'count() in slow mode not allowed — use index or set allowSlowCount',
	QU15: 'count() queries cannot use skip or limit',
	QU16: '$regex must be a string, not a RegExp instance',
	QU17: 'Chained queries cannot be used on findByIds() instances',
	QU18: 'Malformed query result — OPFS storage in worker needs usesRxDatabaseInWorker',
	QU19: 'Query must not contain fields with value undefined',

	// ── mquery ──
	MQ1: 'Path must be a string or object',
	MQ2: 'Invalid argument',
	MQ3: 'Invalid sort() argument — must be string, object, or array',
	MQ4: 'Invalid argument — expected mquery instance or plain object',
	MQ5: 'Method must be used after where() with these arguments',
	MQ6: "Can't mix sort syntaxes — use array or object, not both",
	MQ7: 'Invalid sort value',
	MQ8: "Can't mix sort syntaxes — use array or object, not both",

	// ── rx-database ──
	DB1: 'Another instance on this adapter has a different password',
	DB2: 'Collection names cannot start with underscore _',
	DB3: 'Collection already exists — use myDatabase[name] to get it',
	DB4: 'Schema is missing in addCollections()',
	DB5: 'Collection name not allowed',
	DB6: 'Schema changed — clear IndexedDB or bump schema version',
	DB8: 'Database with same name+adapter already exists (set ignoreDuplicate or closeDuplicates)',
	DB9: 'ignoreDuplicate is only allowed in dev-mode',
	DB11: 'Invalid db-name — folder paths must not have trailing slash',
	DB12: 'Could not write to internal store in addCollections()',
	DB13: 'Invalid name — contains dollar sign $',
	DB14: 'No custom reactivity factory added on database creation',

	// ── rx-collection ──
	COL1: 'Cannot insert — document already exists',
	COL2: '._id can only be used as primaryKey',
	COL3: 'upsert() does not work without primary key',
	COL4: 'incrementalUpsert() does not work without primary key',
	COL5: 'To search by _id, use .findOne(_id)',
	COL6: 'findOne() needs a query object or string (primary keys must be strings)',
	COL7: 'Hook must be a function',
	COL8: 'hooks-when not known',
	COL9: 'Hook name not known in addHook()',
	COL10: 'postCreate hooks cannot be async',
	COL11: 'migrationStrategies must be an object',
	COL12: 'A migration strategy is missing or too many provided',
	COL13: 'Migration strategy must be a function',
	COL14: 'Static method name is not a string',
	COL15: 'Static method names cannot start with underscore _',
	COL16: 'Given static method is not a function',
	COL17: 'Static/ORM name not allowed (reserved)',
	COL18: 'Method name conflicts with schema field name',
	COL20: 'Storage write error',
	COL21: 'Collection is closed or removed (possibly from another tab)',
	COL22: 'bulkInsert/bulkUpsert has duplicate primary keys',
	COL23: 'Open-source RxDB limits parallel collections (premium removes limit)',
	CONFLICT: 'Document update conflict — must work on previous revision',

	// ── rx-document ──
	DOC1: 'Cannot get observable of in-array fields (order unknown)',
	DOC2: 'Cannot observe primary path',
	DOC3: 'Final fields cannot be observed',
	DOC4: 'Cannot observe non-existent field',
	DOC5: 'Cannot populate non-existent field',
	DOC6: 'Cannot populate — path has no ref',
	DOC7: 'populate() ref-collection not in database',
	DOC8: 'Primary key cannot be modified',
	DOC9: 'Final fields cannot be modified',
	DOC10: 'Cannot set child path when root path not selected',
	DOC11: "Cannot save deleted document",
	DOC13: 'Document is already deleted',
	DOC14: 'RxDocument.close() does not exist',
	DOC15: 'Query cannot be an array',
	DOC16: 'set() can only be called on temporary documents (since v8)',
	DOC17: 'save() can only be called on non-temporary documents (since v8)',
	DOC18: 'Composed primary key property is missing',
	DOC19: 'Primary key value cannot be changed',
	DOC20: 'Primary key is missing',
	DOC21: 'Primary key cannot start or end with whitespace',
	DOC22: 'Primary key must not contain a linebreak',
	DOC23: 'Primary key must not contain double-quote "',
	DOC24: 'Document data could not be structured-cloned (non-plain JSON like Date/Function)',

	// ── data-migrator ──
	DM1: 'Migration has already run',
	DM2: 'Migrated document does not match final schema',
	DM3: 'Migration already running',
	DM4: 'Migration errored',
	DM5: 'Cannot open database with newer RxDB version — migrate first',

	// ── attachments ──
	AT1: 'Attachments not defined in schema',

	// ── encryption ──
	EN1: 'Password is not valid',
	EN2: 'Password does not meet minimum length',
	EN3: 'Schema has encrypted properties but no password given',
	EN4: 'Password not valid',

	// ── json-dump ──
	JD1: 'Must create collections before importing data',
	JD2: 'Imported JSON relies on a different schema',
	JD3: 'Imported JSON passwordHash does not match',

	// ── local-documents ──
	LD1: 'Cannot use allAttachments$ on local documents',
	LD2: 'get() objPath must be a string',
	LD3: 'Cannot get observable of in-array fields on local doc',
	LD4: 'Cannot observe primary path on local doc',
	LD5: 'Local document _id cannot be modified',
	LD6: 'Function not usable on local documents',
	LD7: 'Local document already exists',
	LD8: 'localDocuments not activated — set localDocuments=true on creation',

	// ── replication ──
	RC1: 'Replication already added',
	RC2: 'replicateCouchDB() query must be from the same collection',
	RC4: 'Cannot awaitInitialReplication when live: true',
	RC5: 'Cannot awaitInitialReplication in multiInstance (may run on another instance)',
	RC6: 'syncFirestore() serverTimestampField must not be in schema or nested',
	RC7: 'SimplePeer requires process.nextTick() polyfill',
	RC_PULL: 'Replication pull handler threw an error',
	RC_STREAM: 'Replication pull stream$ threw an error',
	RC_PUSH: 'Replication push handler threw an error',
	RC_PUSH_NO_AR: 'Push handler did not return conflicts array',
	RC_WEBRTC_PEER: 'WebRTC peer error',
	RC_COUCHDB_1: "replicateCouchDB() url must end with a slash '/'",
	RC_COUCHDB_2: 'replicateCouchDB() did not get valid result with rows',
	RC_OUTDATED: 'Outdated client — update required, replication canceled',
	RC_UNAUTHORIZED: 'Unauthorized — update replicationState.headers with correct auth',
	RC_FORBIDDEN: 'Client forbidden — replication canceled (invalid write attempt)',

	// ── schema validation (dev-mode) ──
	SC1: 'Field name does not match the regex',
	SC2: "Name 'item' is reserved for array fields",
	SC3: 'Field has ref-array but items-type is not string',
	SC4: 'Field has ref but is not type string, [string,null], or array<string>',
	SC6: 'Primary can only be defined at top-level',
	SC7: 'Default values can only be defined at top-level',
	SC8: 'First-level fields cannot start with underscore _',
	SC10: 'Schema defines ._rev — this is done automatically',
	SC11: 'Schema version must be a number >= 0',
	SC13: 'Primary is always indexed — do not declare it as index',
	SC14: 'Primary is always unique — do not declare it as index',
	SC15: 'Primary cannot be encrypted',
	SC16: 'Primary must have type: string',
	SC17: 'Top-level field name not allowed',
	SC18: 'Indexes must be an array',
	SC19: 'Indexes must contain strings or arrays of strings',
	SC20: 'Index array must contain strings',
	SC21: 'Given index field is not defined in schema',
	SC22: 'Given index key is not type: string',
	SC23: 'Field name is not allowed',
	SC24: 'Required fields must be set via array',
	SC25: 'compoundIndexes must be specified in the indexes field',
	SC26: 'Indexes must be specified at collection schema level',
	SC28: 'Encrypted field is not defined in the schema',
	SC29: "Missing object key 'properties'",
	SC30: 'primaryKey is required',
	SC32: 'Primary field must be type string/number/integer',
	SC33: 'Primary key not found as schema property',
	SC34: 'Indexed string fields must have maxLength set',
	SC35: 'Indexed number/integer fields must have multipleOf set',
	SC36: 'This field type cannot be used as index',
	SC37: 'Indexed number fields must have minimum and maximum set',
	SC38: 'Indexed boolean fields must be required in the schema',
	SC39: 'Primary key must have maxLength set (enable dev-mode)',
	SC40: '$ref fields not allowed — RxDB cannot resolve related schemas (performance)',
	SC41: 'Index min/max/maxLength must be real numbers, not Infinity',

	// ── dev-mode ──
	DVM1: 'Dev-mode requires a schema validator at the top-level storage',

	// ── validate ──
	VD1: 'Sub-schema not found — schemaPath may not exist',
	VD2: 'Document does not match schema',

	// ── server ──
	S1: 'Cannot create collections after calling RxDatabase.server()',

	// ── graphql replication ──
	GQL1: 'GraphQL replication: sub-schema not found by key',
	GQL3: 'GraphQL replication: pull returns more documents than batchSize',

	// ── CRDT ──
	CRDT1: 'CRDT operations require crdt options set in schema',
	CRDT2: 'incrementalModify() cannot be used when CRDTs are active',
	CRDT3: 'CRDTs require the default CRDT conflict handler — do not set custom',

	// ── storage-dexie ──
	DXE1: 'Non-required index fields not possible with Dexie.js storage',

	// ── storage-sqlite-trial ──
	SQL1: 'Trial SQLite storage does not support attachments',
	SQL2: 'Trial SQLite storage limited to 300 documents',
	SQL3: 'Trial SQLite storage limited to 110 operations',

	// ── storage-remote ──
	RM1: 'Cannot communicate with remote built on different RxDB version',

	// ── replication-mongodb ──
	MG1: 'If _id is primaryKey, all MongoDB documents must have string _id',

	// ── internal ──
	SNH: 'Internal error — this should never happen'
};

/**
 * Extract the first line / short summary from a potentially huge RxDB message.
 */
function extractFirstLine(msg: string): string {
	// RxDB messages have "Error message: <text>\n" — grab just that
	const emMatch = msg.match(/Error message:\s*(.+?)(?:\n|$)/);
	if (emMatch) return emMatch[1].trim();
	// Otherwise take the first meaningful line
	const first = msg.split('\n').find((l) => l.trim().length > 0);
	return first?.trim().slice(0, 120) || msg.slice(0, 120);
}

/**
 * Parse any error (RxDB, HTTP, generic) into a summarized form.
 */
export function parseError(err: any): ParsedError {
	// RxDB errors have .rxdb === true, .code, .url
	if (err?.rxdb === true) {
		const code = err.code || null;

		// RC_PULL / RC_PUSH wrap the real error — unwrap it
		if ((code === 'RC_PULL' || code === 'RC_PUSH') && err.parameters) {
			// Try to extract the inner errors array
			const innerErrors = err.parameters.errors;
			if (Array.isArray(innerErrors) && innerErrors.length > 0) {
				const inner = innerErrors[0];
				const innerParsed = parseError(inner);
				return {
					code: innerParsed.code || code,
					summary: innerParsed.summary,
					isRxdb: true,
					url: innerParsed.url || err.url
				};
			}
			// Try the single inner error
			if (err.parameters.error) {
				const innerParsed = parseError(err.parameters.error);
				return {
					code: innerParsed.code || code,
					summary: innerParsed.summary,
					isRxdb: true,
					url: innerParsed.url || err.url
				};
			}
		}

		return {
			code,
			summary: RXDB_CODE_LABELS[code] || extractFirstLine(err.message || ''),
			isRxdb: true,
			url: err.url || (code ? `https://rxdb.info/errors.html#${code}` : null)
		};
	}

	// RxDB replication wraps errors — inner error may have .rxdb
	if (err?.inner?.rxdb === true) {
		return parseError(err.inner);
	}

	// Error message contains "Error code: XX" (RxDB string format)
	const msgCodeMatch = (err?.message || '').match(/Error code:\s*([A-Z_]+\d*)/);
	if (msgCodeMatch) {
		const code = msgCodeMatch[1];
		return {
			code,
			summary: RXDB_CODE_LABELS[code] || extractFirstLine(err.message),
			isRxdb: true,
			url: `https://rxdb.info/errors.html#${code}`
		};
	}

	// HTTP-style errors from fetch (e.g. "Pull tenants failed: 500 — detail here")
	const httpMatch = err?.message?.match(/failed:\s*(\d{3})(?:\s*—\s*(.+))?/);
	if (httpMatch) {
		const status = httpMatch[1];
		const detail = httpMatch[2]?.trim();
		const fallbackLabels: Record<string, string> = {
			'401': 'Unauthorized — session expired?',
			'403': 'Forbidden — missing permissions',
			'404': 'Endpoint not found',
			'500': 'Server error',
			'502': 'Bad gateway',
			'503': 'Service unavailable',
			'504': 'Gateway timeout'
		};
		return {
			code: `HTTP ${status}`,
			summary: detail || fallbackLabels[status] || `Server returned ${status}`,
			isRxdb: false,
			url: null
		};
	}

	// Timeout / network errors
	if (err?.name === 'AbortError' || /timeout/i.test(err?.message || '')) {
		return { code: 'TIMEOUT', summary: 'Request timed out', isRxdb: false, url: null };
	}
	if (/network|fetch|ECONNREFUSED/i.test(err?.message || '')) {
		return { code: 'NETWORK', summary: 'Network unreachable', isRxdb: false, url: null };
	}

	// Fallback: extract any uppercase code-like pattern from message
	const codeMatch = (err?.message || '').match(/\b([A-Z]{2,}[\d_]*\d+)\b/);
	return {
		code: codeMatch?.[1] || null,
		summary: err?.message || String(err) || 'Unknown error',
		isRxdb: false,
		url: null
	};
}

function formatAge(date: Date | null): string | null {
	if (!date) return null;
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return 'just now'; // also covers negative (clock skew)
	if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	return `${Math.floor(seconds / 86400)}d ago`;
}

function createSyncStatusStore() {
	let collections = $state<CollectionSyncState[]>(
		COLLECTIONS.map((name) => ({
			name,
			status: 'idle',
			docCount: 0,
			lastSyncedAt: null,
			error: null,
			parsedError: null
		}))
	);

	let phase = $state<SyncPhase>('idle');
	let startedAt = $state<number | null>(null);
	let lastSuccessfulSyncAt = $state<Date | null>(null);

	// Service health
	let neonHealth = $state<ServiceHealth>('unknown');
	let neonLatency = $state<number | null>(null);
	let neonError = $state<string | null>(null);
	let rxdbHealth = $state<ServiceHealth>('unknown');
	let rxdbError = $state<string | null>(null);

	// Neon billing (from Management API)
	let neonBilling = $state<NeonBillingData | null>(null);
	let neonBillingError = $state<string | null>(null);
	let neonBillingLoading = $state(false);

	// Data flow direction
	let flowDirection = $state<FlowDirection>('idle');
	let pushTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// A1: Pending mutations — reads from the central mutation queue

	// A2: Version info
	let rxdbVersion = $state<string | null>(null);
	let appVersion = $state('0.0.1');

	// C1: Sync pause/resume
	let paused = $state(false);

	// Deferred save: tracks unsaved local edits (e.g., floor plan changes awaiting Save)
	let unsavedEdits = $state(0);

	// Neon row counts (from /api/rxdb/counts) — persisted to localStorage
	const NEON_COUNTS_KEY = '__dorm_neon_counts';
	function hydrateNeonCounts(): { counts: Record<string, number>; fetchedAt: number } | null {
		if (typeof localStorage === 'undefined') return null;
		try {
			const raw = localStorage.getItem(NEON_COUNTS_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch { return null; }
	}
	const cachedCounts = hydrateNeonCounts();
	let neonCounts = $state<Record<string, number> | null>(cachedCounts?.counts ?? null);
	let neonCountsLoading = $state(false);
	let neonCountsError = $state<string | null>(null);
	let neonCountsFetchedAt = $state<number | null>(cachedCounts?.fetchedAt ?? null);

	// Neon interaction tracking
	let neonUsage = $state<NeonUsageStats>(
		hydrateNeonUsage() ?? {
			sessionStartedAt: Date.now(),
			lastInteraction: null,
			pullCount: 0, pushCount: 0, healthCheckCount: 0,
			totalBytesReceived: 0, totalLatencyMs: 0, totalDocsReceived: 0
		}
	);

	// Status log (newest first) — persisted to localStorage (synchronous)
	let logs = $state<StatusLogEntry[]>(loadPersistedLogs());

	function addLog(message: string, level: StatusLogEntry['level'] = 'info') {
		const entry: StatusLogEntry = {
			time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
			message,
			level
		};
		logs = [entry, ...logs].slice(0, MAX_LOG_ENTRIES);
		persistLogs(logs);
	}

	function clearLogs() {
		logs = [];
		clearPersistedLogs();
	}

	function setPhase(p: SyncPhase) {
		const wasComplete = phase === 'complete';
		phase = p;
		if (p === 'syncing' && !startedAt) {
			startedAt = Date.now();
			flowDirection = 'pull';
		} else if (p === 'initializing') {
			flowDirection = 'idle';
		} else if (p === 'complete') {
			flowDirection = 'idle';
			lastSuccessfulSyncAt = new Date();
			// Only log summary once per sync cycle (guard against double setPhase('complete'))
			if (!wasComplete) {
				const syncedCount = collections.filter((c) => c.status === 'synced').length;
				const totalDocs = collections.reduce((sum, c) => sum + c.docCount, 0);
				addLog(`Synced ${syncedCount}/${collections.length} collections (${totalDocs.toLocaleString()} docs)`, 'success');
			}
		} else if (p === 'error') {
			flowDirection = 'error';
		}
	}

	function updateCollection(name: string, update: Partial<CollectionSyncState>) {
		collections = collections.map((c) =>
			c.name === name ? { ...c, ...update } : c
		);
	}

	// W12: Track cumulative docs pulled per collection during current sync cycle
	let pulledDocs = $state<Record<string, number>>({});

	function markSyncing(name: string) {
		updateCollection(name, { status: 'syncing', error: null });
		pulledDocs[name] = 0; // W12: Reset pulled count on new sync
		flowDirection = 'pull';
	}

	/** W12: Increment pulled doc count for a collection (called after each batch) */
	function markPulled(name: string, count: number) {
		pulledDocs[name] = (pulledDocs[name] || 0) + count;
	}

	function markSynced(name: string, docCount: number) {
		const now = new Date();
		updateCollection(name, {
			status: 'synced',
			docCount,
			lastSyncedAt: now.toISOString(),
			error: null,
			parsedError: null
		});
		lastSuccessfulSyncAt = now;
		// Check if all collections are done — set phase to 'complete' which logs the summary.
		// idle = lazy collection not yet accessed, counts as done.
		const allDone = collections.every((c) => c.status === 'synced' || c.status === 'idle');
		const anySynced = collections.some((c) => c.status === 'synced');
		if (allDone && anySynced && phase !== 'complete') {
			setPhase('complete');
		}
	}

	/**
	 * Mark a collection as errored.
	 * Pass the raw error object (or string) — we'll parse out the code.
	 */
	function markError(name: string, error: string | any) {
		const parsed = typeof error === 'string'
			? parseError({ message: error })
			: parseError(error);
		const errorStr = typeof error === 'string' ? error : (error?.message || String(error));
		updateCollection(name, { status: 'error', error: errorStr, parsedError: parsed });
		phase = 'error';
		// Only reset flow if no other collection is still actively syncing
		const stillSyncing = collections.some((c) => c.status === 'syncing');
		if (!stillSyncing) flowDirection = 'error';
		const logMsg = parsed.code
			? `${name}: [${parsed.code}] ${parsed.summary}`
			: `${name}: ${parsed.summary}`;
		addLog(logMsg, 'error');
	}

	// Health check: ping Neon via the health endpoint
	async function checkNeonHealth() {
		neonHealth = 'checking';
		neonError = null;
		addLog('Checking Neon connection...', 'info');
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);
			const res = await fetch('/api/rxdb/health', { signal: controller.signal });
			clearTimeout(timeout);
			const data = await res.json();
			if (res.ok && data.neon === 'reachable') {
				neonHealth = 'ok';
				neonLatency = data.latencyMs ?? null;
				addLog(`Neon reachable (${data.latencyMs}ms)`, 'success');
			} else {
				neonHealth = 'error';
				neonError = data.error || `HTTP ${res.status}`;
				addLog(`Neon unreachable: ${neonError}`, 'error');
			}
		} catch (err: any) {
			neonHealth = 'error';
			neonError = err?.name === 'AbortError' ? 'Timeout (8s)' : (err?.message || 'Network error');
			addLog(`Neon check failed: ${neonError}`, 'error');
		}
	}

	/**
	 * D4: Set Neon health state directly from replication.ts without making an
	 * additional fetch call. Called immediately after the preflight health check
	 * so the UI reflects the real reachability result with actual latency data.
	 */
	function setNeonHealthDirect(status: 'ok' | 'error', latencyMs?: number) {
		neonHealth = status;
		neonLatency = latencyMs ?? null;
		if (status === 'ok') {
			neonError = null;
			const latencyStr = latencyMs !== undefined ? ` (${latencyMs}ms)` : '';
			addLog(`Neon reachable${latencyStr}`, 'success');
		} else {
			neonError = 'Unreachable';
			addLog('Neon unreachable — using cached data', 'error');
		}
	}

	function setRxdbHealth(status: ServiceHealth, message?: string, rawError?: any) {
		rxdbHealth = status;
		if (status === 'error' && rawError) {
			const parsed = parseError(rawError);
			const summary = parsed.code
				? `[${parsed.code}] ${parsed.summary}`
				: parsed.summary;
			rxdbError = summary;
			addLog(`RxDB: ${summary}`, 'error');
		} else if (status === 'error' && message) {
			rxdbError = message;
			addLog(message, 'error');
		} else if (status === 'ok') {
			rxdbError = null;
			if (message) addLog(message, 'success');
		} else {
			if (message) addLog(message, 'info');
		}
	}

	/**
	 * Mark that a form action is writing to Neon.
	 * Auto-resets to 'idle' after 3s (or when a pull starts).
	 */
	function markPushing() {
		flowDirection = 'push';
		if (pushTimeoutId) clearTimeout(pushTimeoutId);
		pushTimeoutId = setTimeout(() => {
			if (flowDirection === 'push') flowDirection = 'idle';
			pushTimeoutId = null;
		}, 3000);
	}

	/** A1: Kept for backward compat — now a no-op since queue manages lifecycle */
	function markMutationResolved() {
		// no-op: mutation queue handles status transitions
	}

	/** A2: Set version info after RxDB init */
	function setVersionInfo(rxdb: string) {
		rxdbVersion = rxdb;
	}

	/** C1: Pause/resume sync */
	function setPaused(value: boolean) {
		paused = value;
		addLog(value ? 'Sync paused by user' : 'Sync resumed by user', 'info');
	}

	/**
	 * B2: Get collections that haven't synced in longer than maxAgeMs.
	 * Returns collection names that are stale and should be auto-resynced.
	 */
	function getStaleCollections(maxAgeMs: number): string[] {
		const now = Date.now();
		return collections
			.filter((c) => {
				if (!c.lastSyncedAt) return false;
				const ageMs = now - new Date(c.lastSyncedAt).getTime();
				return isStale(ageMs, maxAgeMs);
			})
			.map((c) => c.name);
	}

	function recordPull(collection: string, latencyMs: number, bytesReceived: number, docCount: number) {
		const interaction: NeonInteraction = {
			type: 'pull', collection, timestamp: Date.now(),
			latencyMs, bytesReceived, docCount
		};
		neonUsage = {
			...neonUsage,
			lastInteraction: interaction,
			pullCount: neonUsage.pullCount + 1,
			totalBytesReceived: neonUsage.totalBytesReceived + bytesReceived,
			totalLatencyMs: neonUsage.totalLatencyMs + latencyMs,
			totalDocsReceived: neonUsage.totalDocsReceived + docCount
		};
		persistNeonUsage(neonUsage);
		if (docCount > 0) {
			addLog(`Pull: ${collection} ← ${docCount} doc(s) (${formatBytes(bytesReceived)}, ${latencyMs}ms)`, 'info');
		}
	}

	function recordPush(collection: string) {
		const interaction: NeonInteraction = {
			type: 'push', collection, timestamp: Date.now(),
			latencyMs: 0, bytesReceived: 0, docCount: 0
		};
		neonUsage = {
			...neonUsage,
			lastInteraction: interaction,
			pushCount: neonUsage.pushCount + 1
		};
		persistNeonUsage(neonUsage);
		markPushing();
		// Invalidate sync cache so next page load does a full pull
		// (otherwise "Serving from cache" skips replication and misses the mutation)
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('__dorm_last_server_ts');
		}
	}

	function recordHealthCheck(latencyMs: number, bytesReceived: number) {
		const interaction: NeonInteraction = {
			type: 'health', collection: null, timestamp: Date.now(),
			latencyMs, bytesReceived, docCount: 0
		};
		neonUsage = {
			...neonUsage,
			lastInteraction: interaction,
			healthCheckCount: neonUsage.healthCheckCount + 1,
			totalBytesReceived: neonUsage.totalBytesReceived + bytesReceived,
			totalLatencyMs: neonUsage.totalLatencyMs + latencyMs
		};
		persistNeonUsage(neonUsage);
	}

	/**
	 * Fetch real billing data from Neon Management API (control plane — zero compute cost).
	 * Cached server-side for 5 min. Called when modal opens on System tab.
	 */
	async function fetchNeonBilling() {
		// Skip if already loaded and fresh (< 5 min).
		if (neonBilling && isFresh(Date.now() - (neonBilling.fetchedAt ?? 0), 5 * 60 * 1000)) return;
		neonBillingLoading = true;
		neonBillingError = null;
		try {
			const res = await fetch('/api/neon/usage');
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || `HTTP ${res.status}`);
			}
			neonBilling = await res.json();
		} catch (err: any) {
			neonBillingError = err?.message || 'Failed to fetch billing data';
		} finally {
			neonBillingLoading = false;
		}
	}

	/**
	 * Fetch total row counts from Neon for all synced tables.
	 * Also refreshes local RxDB counts (via callback) so the comparison is fresh-to-fresh.
	 * Cached for 30s to prevent rapid re-clicks. Pass force=true to bypass cache.
	 * @param refreshLocal Optional callback to refresh local RxDB doc counts before comparing.
	 */
	async function fetchNeonCounts(force?: boolean, refreshLocal?: () => Promise<Record<string, number>>) {
		// Skip if cached and fresh (< 30s) unless forced.
		if (!force && neonCounts && neonCountsFetchedAt && isFresh(Date.now() - neonCountsFetchedAt, 30_000)) return;
		neonCountsLoading = true;
		neonCountsError = null;
		try {
			// Refresh local counts first so comparison is fresh-to-fresh
			if (refreshLocal) {
				await refreshLocal();
				addLog('Local RxDB counts refreshed', 'info');
			}

			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);
			const res = await fetch('/api/rxdb/counts', { signal: controller.signal });
			clearTimeout(timeout);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || `HTTP ${res.status}`);
			}
			const data = await res.json();
			neonCounts = data.counts;
			neonCountsFetchedAt = data.fetchedAt;

			// Persist to localStorage so counts survive refresh
			try {
				localStorage.setItem(NEON_COUNTS_KEY, JSON.stringify({ counts: neonCounts, fetchedAt: neonCountsFetchedAt }));
			} catch { /* quota exceeded — non-critical */ }

			// Log per-collection match/mismatch
			let matched = 0;
			let mismatched = 0;
			for (const col of collections) {
				const neon = data.counts[col.name];
				if (neon === undefined) continue;
				if (col.docCount === neon) {
					matched++;
				} else {
					mismatched++;
				}
			}
			if (mismatched === 0) {
				addLog(`Neon counts fetched (${data.latencyMs}ms) — all ${matched} collections match ✓`, 'success');
			} else {
				addLog(`Neon counts fetched (${data.latencyMs}ms) — ${mismatched} mismatch(es), ${matched} match`, 'warn');
			}
		} catch (err: any) {
			neonCountsError = err?.name === 'AbortError' ? 'Timeout (8s)' : (err?.message || 'Failed to fetch counts');
			addLog(`Neon counts failed: ${neonCountsError}`, 'error');
		} finally {
			neonCountsLoading = false;
		}
	}

	/**
	 * W9: Get the age of the oldest lastSyncedAt across given collection names.
	 * Returns { age: string, stale: boolean } or null if none have synced.
	 */
	function getCollectionAge(names: string[]): { age: string; stale: boolean; oldestMs: number } | null {
		let oldestTs: number | null = null;
		for (const col of collections) {
			if (!names.includes(col.name) || !col.lastSyncedAt) continue;
			const ts = new Date(col.lastSyncedAt).getTime();
			if (oldestTs === null || ts < oldestTs) oldestTs = ts;
		}
		if (oldestTs === null) return null;
		const ageMs = Date.now() - oldestTs;
		const stale = isStale(ageMs, 5 * 60 * 1000);
		const age = formatAge(new Date(oldestTs)) || 'just now';
		return { age, stale, oldestMs: ageMs };
	}

	return {
		get collections() { return collections; },
		get phase() { return phase; },
		get startedAt() { return startedAt; },
		get syncedCount() { return collections.filter((c) => c.status === 'synced').length; },
		get totalCount() { return collections.length; },
		get totalDocs() { return collections.reduce((sum, c) => sum + c.docCount, 0); },
		get hasErrors() { return collections.some((c) => c.status === 'error'); },
		get errorCollections() { return collections.filter((c) => c.status === 'error'); },
		get neonHealth() { return neonHealth; },
		get neonLatency() { return neonLatency; },
		get neonError() { return neonError; },
		get rxdbHealth() { return rxdbHealth; },
		get rxdbError() { return rxdbError; },
		get logs() { return logs; },
		get lastSuccessfulSyncAt() { return lastSuccessfulSyncAt; },
		get dataAge() { return formatAge(lastSuccessfulSyncAt); },
		get flowDirection() { return mutationQueue.pending > 0 ? 'push' : flowDirection; },
		get neonUsage() { return neonUsage; },
		get lastNeonInteractionAge() {
			if (!neonUsage.lastInteraction) return null;
			return formatAge(new Date(neonUsage.lastInteraction.timestamp));
		},
		get estimatedComputeSeconds() { return neonUsage.totalLatencyMs * 0.3 / 1000; },
		get estimatedTransferKB() { return neonUsage.totalBytesReceived / 1024; },
		get totalNeonQueries() { return neonUsage.pullCount + neonUsage.pushCount + neonUsage.healthCheckCount; },
		get neonCounts() { return neonCounts; },
		get neonCountsLoading() { return neonCountsLoading; },
		get neonCountsError() { return neonCountsError; },
		get neonCountsFetchedAt() { return neonCountsFetchedAt; },
		get neonBilling() { return neonBilling; },
		get neonBillingError() { return neonBillingError; },
		get neonBillingLoading() { return neonBillingLoading; },
		get pulledDocs() { return pulledDocs; },
		get pendingMutations() { return mutationQueue.pending; },
		get pendingMutationList(): PendingMutation[] { return mutationQueue.items; },
		get rxdbVersion() { return rxdbVersion; },
		get appVersion() { return appVersion; },
		get paused() { return paused; },
		get unsavedEdits() { return unsavedEdits; },
		setUnsavedEdits(n: number) { unsavedEdits = n; },
		/** Single source of truth for sync status — used by both SyncIndicator and SyncDetailModal */
		get statusLabel(): { label: string; detail: string | null; state: 'in-sync' | 'syncing' | 'saving' | 'paused' | 'error' | 'errors' | 'unsaved' | 'idle' } {
			const pending = mutationQueue.pending;
			const dir = pending > 0 ? 'push' : flowDirection;
			const ph = phase;
			const hasErr = collections.some((c) => c.status === 'error');
			const synced = collections.filter((c) => c.status === 'synced').length;
			const total = collections.length;

			if (paused) return { label: 'Paused', detail: null, state: 'paused' };
			if (pending > 0) return { label: pending > 1 ? `Saving (${pending})` : 'Saving', detail: `${pending} pending`, state: 'saving' };
			if (ph === 'initializing') return { label: 'Loading...', detail: `${synced}/${total}`, state: 'syncing' };
			if (ph === 'syncing' || dir === 'pull') return { label: 'Syncing', detail: `${synced}/${total}`, state: 'syncing' };
			if (ph === 'error' || dir === 'error') return { label: 'Offline', detail: null, state: 'error' };
			if (ph === 'complete' && hasErr) {
				const n = collections.filter((c) => c.status === 'error').length;
				return { label: `${n} error${n !== 1 ? 's' : ''}`, detail: null, state: 'errors' };
			}
			if (unsavedEdits > 0) return { label: 'Unsaved', detail: `${unsavedEdits} edit${unsavedEdits !== 1 ? 's' : ''}`, state: 'unsaved' };
			if (ph === 'complete' && !hasErr) return { label: 'In sync', detail: `${synced}/${total}`, state: 'in-sync' };
			return { label: 'Idle', detail: null, state: 'idle' };
		},
		setPhase,
		markSyncing,
		markSynced,
		markError,
		markPushing,
		markPulled,
		updateCollection,
		checkNeonHealth,
		setNeonHealthDirect,
		setRxdbHealth,
		addLog,
		clearLogs,
		recordPull,
		recordPush,
		recordHealthCheck,
		fetchNeonBilling,
		fetchNeonCounts,
		getCollectionAge,
		markMutationResolved,
		setVersionInfo,
		setPaused,
		getStaleCollections
	};
}

export const syncStatus = createSyncStatusStore();
