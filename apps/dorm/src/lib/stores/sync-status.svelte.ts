/**
 * Reactive sync status store for RxDB replication.
 * Tracks per-collection sync state (syncing, synced, error, doc counts).
 * Also tracks service health (Neon reachability, RxDB readiness) and a status log.
 */

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

export type ServiceHealth = 'unknown' | 'checking' | 'ok' | 'error';

export type StatusLogEntry = {
	time: string;
	message: string;
	level: 'info' | 'success' | 'error' | 'warn';
};

const COLLECTIONS = [
	'tenants', 'leases', 'lease_tenants', 'rental_units', 'properties',
	'floors', 'meters', 'readings', 'billings', 'payments',
	'payment_allocations', 'expenses', 'budgets', 'penalty_configs'
];

const MAX_LOG_ENTRIES = 50;

// Known RxDB error code descriptions (common ones)
const RXDB_CODE_LABELS: Record<string, string> = {
	DB6: 'Schema changed — clear IndexedDB or bump version',
	DB9: 'Database already exists',
	DB11: 'Database destroyed',
	SC34: 'Schema key compression failed',
	SC36: 'Schema version mismatch',
	SC38: 'Schema field type mismatch',
	VD1: 'Validation: required field missing',
	VD2: 'Validation: document data invalid',
	COL12: 'Collection already exists',
	COL17: 'Collection name invalid',
	DXE1: 'Dexie/IndexedDB storage error',
	RC_PULL: 'Replication pull handler failed',
	RC_PUSH: 'Replication push handler failed',
	RC_STREAM: 'Replication stream error'
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
	if (seconds < 60) return 'just now';
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

	// Status log (newest first)
	let logs = $state<StatusLogEntry[]>([]);

	function addLog(message: string, level: StatusLogEntry['level'] = 'info') {
		const entry: StatusLogEntry = {
			time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
			message,
			level
		};
		logs = [entry, ...logs].slice(0, MAX_LOG_ENTRIES);
	}

	function setPhase(p: SyncPhase) {
		phase = p;
		if (p === 'syncing' && !startedAt) {
			startedAt = Date.now();
			addLog('Sync started', 'info');
		} else if (p === 'initializing') {
			addLog('Initializing...', 'info');
		}
	}

	function updateCollection(name: string, update: Partial<CollectionSyncState>) {
		collections = collections.map((c) =>
			c.name === name ? { ...c, ...update } : c
		);
	}

	function markSyncing(name: string) {
		updateCollection(name, { status: 'syncing', error: null });
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
		addLog(`${name} synced`, 'success');
		// Check if all are synced — only log once
		const allSynced = collections.every((c) => c.status === 'synced');
		if (allSynced && phase !== 'complete') {
			phase = 'complete';
			addLog('All collections synced', 'success');
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
		setPhase,
		markSyncing,
		markSynced,
		markError,
		updateCollection,
		checkNeonHealth,
		setNeonHealthDirect,
		setRxdbHealth,
		addLog
	};
}

export const syncStatus = createSyncStatusStore();
