<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { getDb } from '$lib/db';
    import { createRxStore } from '$lib/stores/sync.svelte';
    import { getWritableCollection } from '$lib/db/write-proxy';
    import { nanoid } from 'nanoid';
    import { cn } from '$lib/utils';
    import { Wifi, WifiOff, Server, Smartphone, RefreshCw, CheckCircle, XCircle, Clock, Loader2, ArrowUpCircle, ArrowDownCircle, Zap, Database, Activity, RotateCcw, MessageCircle, Send, Trash2, Plus } from 'lucide-svelte';
    import { browser } from '$app/environment';
    import type { PingMessage } from '$lib/server/ping-chat';

    // ─── RxDB table test (existing) ─────────────────────────────────────────────
    const { value: tables, initialized } = $derived(createRxStore('tables', db => db.tables.find()));

    let dbInstance: any;
    let newTableName = $state('');
    let resettingAll = $state(false);

    async function resetAllDevices() {
        if (!confirm('This will clear the database on ALL connected devices and re-seed. Continue?')) return;
        resettingAll = true;
        try {
            await fetch('/api/replication/reset', { method: 'POST' });
            window.indexedDB.deleteDatabase('wtfpos_db');
            window.location.reload();
        } catch (e) {
            console.error('Reset failed:', e);
            resettingAll = false;
        }
    }

    // ─── Network Diagnostics State ──────────────────────────────────────────────

    let pingResult = $state<{
        status: 'idle' | 'testing' | 'success' | 'error';
        roundTripMs: number | null;
        serverTime: string | null;
        storeCount: number | null;
        writeOk: boolean | null;
        writeError: string | null;
        deviceLabel: string | null;
        error: string | null;
    }>({
        status: 'idle', roundTripMs: null, serverTime: null, storeCount: null,
        writeOk: null, writeError: null, deviceLabel: null, error: null
    });

    let serverStatus = $state<{
        status: 'idle' | 'loading' | 'ok' | 'error';
        total: number;
        epoch: number;
        counts: Record<string, number>;
        error: string | null;
    }>({ status: 'idle', total: 0, epoch: 0, counts: {}, error: null });

    let pushTest = $state<{
        status: 'idle' | 'testing' | 'success' | 'error';
        roundTripMs: number | null;
        pushed: number;
        error: string | null;
    }>({ status: 'idle', roundTripMs: null, pushed: 0, error: null });

    let pullTest = $state<{
        status: 'idle' | 'testing' | 'success' | 'error';
        docCount: number;
        roundTripMs: number | null;
        error: string | null;
    }>({ status: 'idle', docCount: 0, roundTripMs: null, error: null });

    // ─── Replication Round-Trip Test ────────────────────────────────────────────
    let replicationTest = $state<{
        status: 'idle' | 'testing' | 'success' | 'error';
        pushMs: number | null;
        pullMs: number | null;
        pullFound: boolean;
        cleanupMs: number | null;
        error: string | null;
    }>({ status: 'idle', pushMs: null, pullMs: null, pullFound: false, cleanupMs: null, error: null });

    let deviceId = $state<{
        status: 'idle' | 'loading' | 'ok' | 'error';
        ipAddress: string;
        isServer: boolean;
        serverLanIp: string;
        serverHostname: string;
        serverEpoch: number;
        error: string | null;
    }>({ status: 'idle', ipAddress: '', isServer: false, serverLanIp: '', serverHostname: '', serverEpoch: 0, error: null });

    let writeProxyTest = $state<{
        status: 'idle' | 'testing' | 'success' | 'error';
        insertMs: number | null;
        readMs: number | null;
        deleteMs: number | null;
        error: string | null;
    }>({ status: 'idle', insertMs: null, readMs: null, deleteMs: null, error: null });

    // ─── Route Health Check (RxDB Collection Sync) ─────────────────────────────

    interface CollectionSyncResult {
        name: string;
        localCount: number | null;
        serverCount: number | null;
        /** 'match' = exact count match, 'subset' = local < server (expected for location-filtered collections), 'mismatch' = local > server (unexpected) */
        syncStatus: 'match' | 'subset' | 'mismatch' | 'empty' | 'unavailable';
    }

    interface RouteCheck {
        path: string;
        label: string;
        group: string;
        collections: string[];
        status: 'idle' | 'testing' | 'synced' | 'partial' | 'empty' | 'error';
        collectionResults: CollectionSyncResult[];
        ms: number | null;
        error: string | null;
    }

    const ROUTE_DEFINITIONS: { path: string; label: string; group: string; collections: string[] }[] = [
        // POS
        { path: '/pos', label: 'POS Floor Plan', group: 'POS', collections: ['tables', 'orders', 'menu_items', 'kds_tickets'] },
        { path: '/expenses', label: 'Expenses', group: 'POS', collections: ['expenses'] },
        // Kitchen
        { path: '/kitchen/dispatch', label: 'Kitchen Dispatch', group: 'Kitchen', collections: ['kds_tickets', 'orders'] },
        { path: '/kitchen/stove', label: 'Stove Station', group: 'Kitchen', collections: ['kds_tickets', 'orders'] },
        { path: '/kitchen/all-orders', label: 'All Orders', group: 'Kitchen', collections: ['orders', 'tables'] },
        { path: '/kitchen/weigh-station', label: 'Weigh Station', group: 'Kitchen', collections: ['stock_items', 'deliveries'] },
        // Stock
        { path: '/stock/inventory', label: 'Inventory', group: 'Stock', collections: ['stock_items'] },
        { path: '/stock/deliveries', label: 'Deliveries', group: 'Stock', collections: ['deliveries', 'stock_items'] },
        { path: '/stock/counts', label: 'Stock Counts', group: 'Stock', collections: ['stock_counts', 'stock_items'] },
        { path: '/stock/waste', label: 'Waste Log', group: 'Stock', collections: ['stock_events', 'stock_items'] },
        // Reports
        { path: '/reports/x-read', label: 'X-Read', group: 'Reports', collections: ['orders', 'expenses'] },
        { path: '/reports/eod', label: 'Z-Read / EOD', group: 'Reports', collections: ['orders', 'expenses', 'readings'] },
        { path: '/reports/sales-summary', label: 'Sales Summary', group: 'Reports', collections: ['orders'] },
        // Admin
        { path: '/admin/users', label: 'User Mgmt', group: 'Admin', collections: ['audit_logs'] },
        { path: '/admin/floor-editor', label: 'Floor Editor', group: 'Admin', collections: ['tables', 'floor_elements'] },
        { path: '/admin/devices', label: 'Devices', group: 'Admin', collections: ['devices'] },
    ];

    let routeChecks = $state<RouteCheck[]>(
        ROUTE_DEFINITIONS.map(r => ({
            ...r,
            status: 'idle' as const,
            collectionResults: [],
            ms: null,
            error: null,
        }))
    );
    let routeCheckRunning = $state(false);
    let routeCheckDone = $state(false);

    const routeGroups = $derived(() => {
        const groups: Record<string, RouteCheck[]> = {};
        for (const r of routeChecks) {
            if (!groups[r.group]) groups[r.group] = [];
            groups[r.group].push(r);
        }
        return groups;
    });

    const routeHealthSummary = $derived(() => {
        const total = routeChecks.length;
        const synced = routeChecks.filter(r => r.status === 'synced').length;
        const partial = routeChecks.filter(r => r.status === 'partial').length;
        const empty = routeChecks.filter(r => r.status === 'empty').length;
        const failed = routeChecks.filter(r => r.status === 'error').length;
        return { total, synced, partial, empty, failed };
    });

    async function runRouteHealthCheck() {
        routeCheckRunning = true;
        routeCheckDone = false;

        // Reset all
        for (const route of routeChecks) {
            route.status = 'testing';
            route.collectionResults = [];
            route.ms = null;
            route.error = null;
        }

        const start = performance.now();

        try {
            // 1. Fetch server store counts (single call)
            let serverCounts: Record<string, number> = {};
            try {
                const res = await fetch('/api/replication/status', { signal: AbortSignal.timeout(5_000) });
                if (res.ok) {
                    const data = await res.json();
                    serverCounts = data.counts ?? {};
                }
            } catch { /* server unreachable — all server counts will be 0 */ }

            // 2. Get local RxDB counts for all unique collections
            const allCollections = new Set(ROUTE_DEFINITIONS.flatMap(r => r.collections));
            const localCounts: Record<string, number> = {};
            const db = await getDb();
            for (const col of allCollections) {
                try {
                    const rxCol = (db as any)[col];
                    if (rxCol) {
                        const docs = await rxCol.find().exec();
                        localCounts[col] = docs.length;
                    } else {
                        localCounts[col] = -1; // collection not registered
                    }
                } catch {
                    localCounts[col] = -1;
                }
            }

            // 3. On CLIENT devices, location-scoped collections will have fewer local docs
            //    than the server store (server holds all locations). On SERVER, counts should match.
            const LOCATION_SCOPED = new Set(['tables', 'floor_elements', 'devices', 'orders', 'kds_tickets', 'stock_items', 'deliveries', 'stock_events', 'deductions', 'expenses', 'stock_counts', 'readings', 'audit_logs']);
            const onServer = isServerDevice;

            // 4. Evaluate each route
            for (const route of routeChecks) {
                const results: CollectionSyncResult[] = route.collections.map(col => {
                    const local = localCounts[col] ?? -1;
                    const server = serverCounts[col] ?? 0;

                    let syncStatus: CollectionSyncResult['syncStatus'];
                    if (local < 0 && server === 0) {
                        syncStatus = 'empty'; // collection not initialized, but server has nothing either
                    } else if (local < 0) {
                        syncStatus = 'unavailable'; // can't access locally but server has data
                    } else if (local === 0 && server === 0) {
                        syncStatus = 'empty';
                    } else if (local === server) {
                        syncStatus = 'match';
                    } else if (!onServer && local < server && LOCATION_SCOPED.has(col)) {
                        syncStatus = 'subset'; // expected on clients — local only has this location's data
                    } else {
                        syncStatus = 'mismatch'; // on server, any difference is a real mismatch
                    }

                    return { name: col, localCount: local >= 0 ? local : null, serverCount: server, syncStatus };
                });
                route.collectionResults = results;

                const hasUnavailable = results.some(r => r.syncStatus === 'unavailable');
                const allEmpty = results.every(r => r.syncStatus === 'empty');
                const allOk = results.every(r => r.syncStatus === 'match' || r.syncStatus === 'subset' || r.syncStatus === 'empty');

                if (hasUnavailable) {
                    route.status = 'error';
                    route.error = 'RxDB collection not accessible but server has data';
                } else if (allEmpty) {
                    route.status = 'empty';
                } else if (allOk) {
                    route.status = 'synced';
                } else {
                    route.status = 'partial';
                }
            }
        } catch (err: any) {
            for (const route of routeChecks) {
                route.status = 'error';
                route.error = err.message || 'Test failed';
            }
        }

        const elapsed = Math.round(performance.now() - start);
        for (const route of routeChecks) {
            route.ms = elapsed;
        }

        routeCheckRunning = false;
        routeCheckDone = true;
    }

    // ─── Remote Sync Check (Client Reports) ──────────────────────────────────

    interface CollectionTestResult {
        localCount: number;
        readOk: boolean;
        readMs: number | null;
        writeOk: boolean;
        writeMs: number | null;
        error: string | null;
    }

    interface ClientSyncReport {
        clientIp: string;
        deviceHint: string;
        isServer: boolean;
        collections: Record<string, CollectionTestResult>;
        checkedAt: string;
    }

    interface RemoteSyncState {
        status: 'idle' | 'requesting' | 'done' | 'error';
        serverCounts: Record<string, number>;
        clientReports: ClientSyncReport[];
        error: string | null;
    }

    let remoteSyncState = $state<RemoteSyncState>({
        status: 'idle', serverCounts: {}, clientReports: [], error: null,
    });

    /** Test read/write for a single collection from the server's perspective */
    async function testCollectionReadWrite(col: string, db: any): Promise<CollectionTestResult> {
        let localCount = -1;
        let readOk = false;
        let readMs: number | null = null;
        let writeOk = false;
        let writeMs: number | null = null;
        let error: string | null = null;

        // Count local docs
        try {
            const rxCol = (db as any)[col];
            if (rxCol) {
                const docs = await rxCol.find().exec();
                localCount = docs.length;
            }
        } catch { /* not accessible */ }

        // Test READ
        try {
            const start = performance.now();
            const res = await fetch(`/api/replication/${col}/pull?limit=1`, {
                signal: AbortSignal.timeout(5_000),
            });
            readMs = Math.round(performance.now() - start);
            readOk = res.ok;
        } catch (err: any) {
            error = `read: ${err.message || 'failed'}`;
        }

        // Test WRITE
        try {
            const testId = `__syncprobe_${col}_${Date.now()}`;
            const writeStart = performance.now();
            const probeDoc: any = {
                id: testId,
                updatedAt: new Date().toISOString(),
                locationId: 'test',
            };
            if (col === 'stock_counts') probeDoc.stockItemId = testId;

            const pushRes = await fetch(`/api/replication/${col}/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    newDocumentState: probeDoc,
                    assumedMasterState: null,
                }]),
                signal: AbortSignal.timeout(5_000),
            });

            if (pushRes.ok) {
                const verifyRes = await fetch(`/api/replication/${col}/pull?limit=1000`, {
                    signal: AbortSignal.timeout(5_000),
                });
                if (verifyRes.ok) {
                    const data = await verifyRes.json();
                    const docs = data.documents ?? [];
                    const pkField = col === 'stock_counts' ? 'stockItemId' : 'id';
                    writeOk = docs.some((d: any) => d[pkField] === testId);
                }

                // Cleanup
                await fetch(`/api/replication/${col}/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify([{
                        newDocumentState: { ...probeDoc, _deleted: true, updatedAt: new Date().toISOString() },
                        assumedMasterState: probeDoc,
                    }]),
                    signal: AbortSignal.timeout(3_000),
                }).catch(() => {});
            }

            writeMs = Math.round(performance.now() - writeStart);
        } catch (err: any) {
            error = (error ? error + '; ' : '') + `write: ${err.message || 'failed'}`;
        }

        return { localCount, readOk, readMs, writeOk, writeMs, error };
    }

    /** Trigger all clients to run sync check, then poll for results */
    async function triggerRemoteSyncCheck() {
        remoteSyncState = { status: 'requesting', serverCounts: {}, clientReports: [], error: null };

        try {
            // 1. Server self-test: read/write each collection
            const allCollections = [...new Set(ROUTE_DEFINITIONS.flatMap(r => r.collections))];
            const db = await getDb();
            const collections: Record<string, CollectionTestResult> = {};
            for (const col of allCollections) {
                collections[col] = await testCollectionReadWrite(col, db);
            }
            // Submit server's own results
            await fetch('/api/replication/sync-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collections }),
                signal: AbortSignal.timeout(5_000),
            });

            // 2. Broadcast SYNC_CHECK to all connected clients
            await fetch('/api/replication/sync-check', {
                method: 'PUT',
                signal: AbortSignal.timeout(5_000),
            });

            // 3. Wait for clients to respond (they also test read/write), then fetch
            await new Promise(r => setTimeout(r, 8_000));

            const res = await fetch('/api/replication/sync-check', {
                signal: AbortSignal.timeout(5_000),
            });
            if (!res.ok) {
                remoteSyncState = { ...remoteSyncState, status: 'error', error: `HTTP ${res.status}` };
                return;
            }
            const data = await res.json();
            remoteSyncState = {
                status: 'done',
                serverCounts: data.serverCounts ?? {},
                clientReports: data.clientReports ?? [],
                error: null,
            };
        } catch (err: any) {
            remoteSyncState = { ...remoteSyncState, status: 'error', error: err.message || 'Failed' };
        }
    }

    /** All collections used across all routes */
    const ALL_ROUTE_COLLECTIONS = $derived(
        [...new Set(ROUTE_DEFINITIONS.flatMap(r => r.collections))].sort()
    );

    let runningAll = $state(false);

    const isServerDevice = $derived(
        browser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    );

    const allPassed = $derived(
        pingResult.status === 'success' &&
        serverStatus.status === 'ok' &&
        pushTest.status === 'success' &&
        pullTest.status === 'success' &&
        replicationTest.status === 'success' &&
        deviceId.status === 'ok'
    );

    const anyFailed = $derived(
        pingResult.status === 'error' ||
        serverStatus.status === 'error' ||
        pushTest.status === 'error' ||
        pullTest.status === 'error' ||
        replicationTest.status === 'error' ||
        deviceId.status === 'error'
    );

    // ─── Ping Chat State ────────────────────────────────────────────────────────

    let chatMessages = $state<PingMessage[]>([]);
    let chatInput = $state('');
    let chatSending = $state(false);
    let chatConnected = $state(false);
    let chatError = $state<string | null>(null);
    let chatEventSource: EventSource | null = null;
    let chatContainerEl: HTMLDivElement | undefined = $state();

    function connectChat() {
        if (chatEventSource) {
            chatEventSource.close();
            chatEventSource = null;
        }
        chatConnected = false;
        chatError = null;

        const es = new EventSource('/api/replication/ping-chat');

        es.addEventListener('history', (e) => {
            try {
                const history: PingMessage[] = JSON.parse(e.data);
                chatMessages = history;
                chatConnected = true;
                scrollChatToBottom();
            } catch { /* ignore parse errors */ }
        });

        es.addEventListener('message', (e) => {
            try {
                const msg: PingMessage = JSON.parse(e.data);
                chatMessages = [...chatMessages, msg];
                scrollChatToBottom();
            } catch { /* ignore */ }
        });

        es.onerror = () => {
            chatConnected = false;
            chatError = 'SSE disconnected — retrying...';
        };

        es.onopen = () => {
            chatConnected = true;
            chatError = null;
        };

        chatEventSource = es;
    }

    function scrollChatToBottom() {
        requestAnimationFrame(() => {
            if (chatContainerEl) {
                chatContainerEl.scrollTop = chatContainerEl.scrollHeight;
            }
        });
    }

    async function sendChatMessage() {
        const text = chatInput.trim();
        if (!text) return;
        chatSending = true;
        const fromLabel = isServerDevice
            ? `💻 Server`
            : `📱 Client (${deviceId.ipAddress || 'unknown'})`;
        try {
            await fetch('/api/replication/ping-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, from: fromLabel }),
                signal: AbortSignal.timeout(5_000)
            });
            chatInput = '';
        } catch (err: any) {
            chatError = err.message || 'Send failed';
        } finally {
            chatSending = false;
        }
    }

    function sendQuickPing() {
        const fromLabel = isServerDevice
            ? `💻 Server`
            : `📱 Client (${deviceId.ipAddress || 'unknown'})`;
        fetch('/api/replication/ping-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '🏓 PING!', from: fromLabel }),
            signal: AbortSignal.timeout(5_000)
        }).catch(() => {});
    }

    // ─── Test Functions ─────────────────────────────────────────────────────────

    async function pingServer() {
        pingResult = { ...pingResult, status: 'testing', error: null };
        const token = `ping-${Date.now()}`;
        const start = performance.now();

        try {
            const res = await fetch('/api/replication/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, collection: 'tables', testWrite: true }),
                signal: AbortSignal.timeout(10_000)
            });
            const elapsed = Math.round(performance.now() - start);

            if (!res.ok) {
                pingResult = { ...pingResult, status: 'error', roundTripMs: elapsed, error: `HTTP ${res.status}: ${res.statusText}` };
                return;
            }
            const data = await res.json();
            pingResult = {
                status: data.echo === token ? 'success' : 'error',
                roundTripMs: elapsed,
                serverTime: data.serverTime,
                storeCount: data.storeCount,
                writeOk: data.writeOk,
                writeError: data.writeError,
                deviceLabel: data.deviceLabel,
                error: data.echo !== token ? `Token mismatch: sent "${token}", got "${data.echo}"` : null
            };
        } catch (err: any) {
            const elapsed = Math.round(performance.now() - start);
            pingResult = { ...pingResult, status: 'error', roundTripMs: elapsed, error: err.message || 'Request failed' };
        }
    }

    async function checkServerStatus() {
        serverStatus = { ...serverStatus, status: 'loading', error: null };
        try {
            const res = await fetch('/api/replication/status', { signal: AbortSignal.timeout(5_000) });
            if (!res.ok) {
                serverStatus = { ...serverStatus, status: 'error', error: `HTTP ${res.status}` };
                return;
            }
            const data = await res.json();
            serverStatus = { status: 'ok', total: data.total ?? 0, epoch: data.epoch ?? 0, counts: data.counts ?? {}, error: null };
        } catch (err: any) {
            serverStatus = { ...serverStatus, status: 'error', error: err.message || 'Unreachable' };
        }
    }

    async function testPush() {
        pushTest = { status: 'testing', roundTripMs: null, pushed: 0, error: null };
        const start = performance.now();

        try {
            // Read local RxDB tables and push as proper change rows
            const db = await getDb();
            const localDocs = await db.tables.find().exec();
            const docs = localDocs.map((d: any) => d.toJSON());

            if (docs.length === 0) {
                pushTest = { status: 'error', roundTripMs: 0, pushed: 0, error: 'No local tables to push — add some data first' };
                return;
            }

            // Format as change rows: { newDocumentState, assumedMasterState }
            const changeRows = docs.map((doc: any) => ({
                newDocumentState: doc,
                assumedMasterState: null   // null = client thinks this is a new doc (or doesn't know server state)
            }));

            const res = await fetch('/api/replication/tables/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(changeRows),
                signal: AbortSignal.timeout(10_000)
            });
            const elapsed = Math.round(performance.now() - start);
            if (!res.ok) {
                pushTest = { status: 'error', roundTripMs: elapsed, pushed: 0, error: `HTTP ${res.status}: ${res.statusText}` };
                return;
            }
            const conflicts = await res.json();
            pushTest = { status: 'success', roundTripMs: elapsed, pushed: docs.length - (conflicts?.length ?? 0), error: null };
        } catch (err: any) {
            pushTest = { status: 'error', roundTripMs: Math.round(performance.now() - start), pushed: 0, error: err.message || 'Push failed' };
        }
    }

    async function testPull() {
        pullTest = { status: 'testing', docCount: 0, roundTripMs: null, error: null };
        const start = performance.now();
        try {
            const res = await fetch('/api/replication/tables/pull?limit=100', { signal: AbortSignal.timeout(10_000) });
            const elapsed = Math.round(performance.now() - start);
            if (!res.ok) {
                pullTest = { status: 'error', docCount: 0, roundTripMs: elapsed, error: `HTTP ${res.status}: ${res.statusText}` };
                return;
            }
            const data = await res.json();
            pullTest = { status: 'success', docCount: data.documents?.length ?? 0, roundTripMs: elapsed, error: null };
        } catch (err: any) {
            pullTest = { status: 'error', docCount: 0, roundTripMs: Math.round(performance.now() - start), error: err.message || 'Pull failed' };
        }
    }

    /** Full round-trip: push a test doc → pull it back → verify → cleanup */
    async function testReplicationRoundTrip() {
        replicationTest = { status: 'testing', pushMs: null, pullMs: null, pullFound: false, cleanupMs: null, error: null };
        const testId = `__repltest_${nanoid(8)}`;
        const testDoc = {
            id: testId,
            locationId: 'test',
            number: 999,
            label: `NetTest ${new Date().toLocaleTimeString()}`,
            zone: 'main' as const,
            capacity: 1,
            x: 0,
            y: 0,
            status: 'available' as const,
            updatedAt: new Date().toISOString(),
        };

        try {
            // Step 1: Push a test document
            const pushStart = performance.now();
            const pushRes = await fetch('/api/replication/tables/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    newDocumentState: testDoc,
                    assumedMasterState: null,
                }]),
                signal: AbortSignal.timeout(10_000)
            });
            const pushMs = Math.round(performance.now() - pushStart);
            if (!pushRes.ok) {
                replicationTest = { status: 'error', pushMs, pullMs: null, pullFound: false, cleanupMs: null, error: `Push failed: HTTP ${pushRes.status}` };
                return;
            }

            // Step 2: Pull and search for our test doc
            const pullStart = performance.now();
            const pullRes = await fetch('/api/replication/tables/pull?limit=500', { signal: AbortSignal.timeout(10_000) });
            const pullMs = Math.round(performance.now() - pullStart);
            if (!pullRes.ok) {
                replicationTest = { status: 'error', pushMs, pullMs, pullFound: false, cleanupMs: null, error: `Pull failed: HTTP ${pullRes.status}` };
                return;
            }
            const pullData = await pullRes.json();
            const found = (pullData.documents ?? []).some((d: any) => d.id === testId);

            // Step 3: Cleanup — push a _deleted version
            const cleanupStart = performance.now();
            await fetch('/api/replication/tables/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    newDocumentState: { ...testDoc, _deleted: true, updatedAt: new Date().toISOString() },
                    assumedMasterState: testDoc,
                }]),
                signal: AbortSignal.timeout(5_000)
            }).catch(() => {});
            const cleanupMs = Math.round(performance.now() - cleanupStart);

            replicationTest = {
                status: found ? 'success' : 'error',
                pushMs,
                pullMs,
                pullFound: found,
                cleanupMs,
                error: found ? null : 'Push accepted but document not found in pull — server store issue',
            };
        } catch (err: any) {
            replicationTest = { ...replicationTest, status: 'error', error: err.message || 'Round-trip test failed' };
        }
    }

    async function detectDevice() {
        deviceId = { ...deviceId, status: 'loading', error: null };
        try {
            const res = await fetch('/api/device/identify', { signal: AbortSignal.timeout(5_000) });
            if (!res.ok) {
                deviceId = { ...deviceId, status: 'error', error: `HTTP ${res.status}` };
                return;
            }
            const data = await res.json();
            deviceId = {
                status: 'ok',
                ipAddress: data.ipAddress || '',
                isServer: !!data.isServer,
                serverLanIp: data.serverLanIp || '',
                serverHostname: data.serverHostname || '',
                serverEpoch: data.serverEpoch ?? 0,
                error: null
            };
        } catch (err: any) {
            deviceId = { ...deviceId, status: 'error', error: err.message || 'Identify failed' };
        }
    }

    async function runWriteProxyTest() {
        writeProxyTest = { status: 'testing', insertMs: null, readMs: null, deleteMs: null, error: null };
        const testId = `__nettest_${Date.now()}`;
        const baseUrl = '/api/collections/devices';

        try {
            const insertStart = performance.now();
            const insertRes = await fetch(`${baseUrl}/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'insert',
                    data: {
                        id: testId, name: '__network_test__', locationId: 'test', role: 'test',
                        userName: 'test', appVersion: '0.0.0', buildDate: '', lastSeenAt: new Date().toISOString(),
                        isOnline: false, syncStatus: 'local-only', deviceType: 'test', screenWidth: 0,
                        userAgent: '', dbLastUpdated: '', dbDocCount: 0, isServer: false, ipAddress: '',
                        dataMode: 'full-rxdb', updatedAt: new Date().toISOString()
                    }
                }),
                signal: AbortSignal.timeout(10_000)
            });
            const insertMs = Math.round(performance.now() - insertStart);
            if (!insertRes.ok) {
                writeProxyTest = { status: 'error', insertMs, readMs: null, deleteMs: null, error: `Insert failed: HTTP ${insertRes.status}` };
                return;
            }

            const readStart = performance.now();
            const readRes = await fetch(`${baseUrl}/read`, { signal: AbortSignal.timeout(5_000) });
            const readMs = Math.round(performance.now() - readStart);
            if (!readRes.ok) {
                writeProxyTest = { status: 'error', insertMs, readMs, deleteMs: null, error: `Read-back failed: HTTP ${readRes.status}` };
                return;
            }
            const readData = await readRes.json();
            const docs = Array.isArray(readData) ? readData : (readData.documents ?? []);
            const found = docs.find((d: any) => d.id === testId);

            const deleteStart = performance.now();
            await fetch(`${baseUrl}/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operation: 'remove', id: testId }),
                signal: AbortSignal.timeout(5_000)
            }).catch(() => {});
            const deleteMs = Math.round(performance.now() - deleteStart);

            if (found) {
                writeProxyTest = { status: 'success', insertMs, readMs, deleteMs, error: null };
            } else {
                writeProxyTest = { status: 'error', insertMs, readMs, deleteMs, error: 'Insert succeeded but document not found in read-back' };
            }
        } catch (err: any) {
            writeProxyTest = { ...writeProxyTest, status: 'error', error: err.message || 'Write proxy test failed' };
        }
    }

    async function runAllDiagnostics() {
        runningAll = true;
        await detectDevice();
        await pingServer();
        await checkServerStatus();
        await testPull();
        await testPush();
        await testReplicationRoundTrip();
        runningAll = false;
    }

    function statusIcon(status: string): string {
        if (status === 'success' || status === 'ok') return '✅';
        if (status === 'error') return '❌';
        if (status === 'testing' || status === 'loading') return '⏳';
        return '⚪';
    }

    // ─── Lifecycle ──────────────────────────────────────────────────────────────

    onMount(async () => {
        dbInstance = await getDb();
        runAllDiagnostics();
        connectChat();
        startServerPoll();
    });

    onDestroy(() => {
        if (chatEventSource) {
            chatEventSource.close();
            chatEventSource = null;
        }
        stopServerPoll();
    });

    // ─── Sync Test: Add / Delete via correct write path ────────────────────────

    let syncTestAdding = $state(false);
    let syncTestError = $state<string | null>(null);
    let serverTables = $state<any[]>([]);
    let serverTablesLoading = $state(false);
    let serverTablesError = $state<string | null>(null);
    let serverPollTimer: ReturnType<typeof setInterval> | null = null;

    async function addTestTable() {
        if (!newTableName.trim()) return;
        syncTestAdding = true;
        syncTestError = null;
        try {
            const proxy = getWritableCollection('tables');
            await proxy.insert({
                id: nanoid(),
                locationId: 'test-loc',
                number: tables.length + 1,
                label: newTableName.trim(),
                zone: 'main',
                capacity: 4,
                x: 0,
                y: 0,
                status: 'available',
                updatedAt: new Date().toISOString(),
            });
            newTableName = '';
            // Refresh server view after a brief delay for propagation
            setTimeout(fetchServerTables, 500);
        } catch (err: any) {
            syncTestError = err.message || 'Add failed';
        } finally {
            syncTestAdding = false;
        }
    }

    async function deleteTestTable(id: string) {
        syncTestError = null;
        try {
            const proxy = getWritableCollection('tables');
            await proxy.remove(id);
            // Refresh server view after a brief delay
            setTimeout(fetchServerTables, 500);
        } catch (err: any) {
            syncTestError = err.message || 'Delete failed';
        }
    }

    async function fetchServerTables() {
        serverTablesLoading = true;
        serverTablesError = null;
        try {
            const res = await fetch('/api/replication/tables/pull?limit=500', {
                signal: AbortSignal.timeout(5_000)
            });
            if (!res.ok) {
                serverTablesError = `HTTP ${res.status}`;
                return;
            }
            const data = await res.json();
            const docs = (data.documents ?? []) as any[];
            // Filter out _deleted docs and sort by label
            serverTables = docs.filter((d: any) => !d._deleted).sort((a: any, b: any) =>
                (a.label || '').localeCompare(b.label || '')
            );
        } catch (err: any) {
            serverTablesError = err.message || 'Fetch failed';
        } finally {
            serverTablesLoading = false;
        }
    }

    // ─── Automated Sync Test ────────────────────────────────────────────────────

    interface SyncTestResult {
        status: 'idle' | 'running' | 'pass' | 'fail';
        step: string;
        steps: {
            label: string;
            status: 'pending' | 'running' | 'pass' | 'fail';
            ms: number | null;
            detail: string;
        }[];
        error: string | null;
    }

    const SYNC_STEPS = [
        'Write via proxy',
        'Server store has it',
        'Local RxDB has it',
        'Delete via proxy',
        'Server store removed',
        'Local RxDB removed',
    ];

    let autoSyncTest = $state<SyncTestResult>({
        status: 'idle', step: '', error: null,
        steps: SYNC_STEPS.map(label => ({ label, status: 'pending' as const, ms: null, detail: '' })),
    });

    function resetSyncSteps(): SyncTestResult {
        return {
            status: 'running', step: '', error: null,
            steps: SYNC_STEPS.map(label => ({ label, status: 'pending' as const, ms: null, detail: '' })),
        };
    }

    async function pollServerForDoc(testId: string, shouldExist: boolean, timeoutMs = 6000): Promise<{ found: boolean; elapsed: number }> {
        const start = performance.now();
        const deadline = start + timeoutMs;
        while (performance.now() < deadline) {
            const res = await fetch('/api/replication/tables/pull?limit=500', { signal: AbortSignal.timeout(3_000) });
            if (res.ok) {
                const data = await res.json();
                const docs = (data.documents ?? []) as any[];
                const found = docs.some((d: any) => d.id === testId && !d._deleted);
                if (found === shouldExist) {
                    return { found, elapsed: Math.round(performance.now() - start) };
                }
            }
            await new Promise(r => setTimeout(r, 300));
        }
        return { found: !shouldExist, elapsed: Math.round(performance.now() - start) };
    }

    async function pollLocalRxDb(testId: string, shouldExist: boolean, timeoutMs = 8000): Promise<{ found: boolean; elapsed: number }> {
        const start = performance.now();
        const deadline = start + timeoutMs;
        const db = await getDb();
        while (performance.now() < deadline) {
            try {
                const doc = await db.tables.findOne(testId).exec();
                const exists = doc !== null && !doc.deleted;
                if (exists === shouldExist) {
                    return { found: exists, elapsed: Math.round(performance.now() - start) };
                }
            } catch { /* retry */ }
            await new Promise(r => setTimeout(r, 300));
        }
        return { found: !shouldExist, elapsed: Math.round(performance.now() - start) };
    }

    async function runAutoSyncTest() {
        const testId = `__synctest_${nanoid(6)}`;
        autoSyncTest = resetSyncSteps();
        const proxy = getWritableCollection('tables');

        async function runStep(index: number, fn: () => Promise<{ ms: number; detail: string; pass: boolean }>) {
            autoSyncTest.steps[index].status = 'running';
            autoSyncTest.step = autoSyncTest.steps[index].label;
            try {
                const result = await fn();
                autoSyncTest.steps[index].ms = result.ms;
                autoSyncTest.steps[index].detail = result.detail;
                autoSyncTest.steps[index].status = result.pass ? 'pass' : 'fail';
                return result.pass;
            } catch (err: any) {
                autoSyncTest.steps[index].status = 'fail';
                autoSyncTest.steps[index].detail = err.message || 'Failed';
                return false;
            }
        }

        // Step 0: Write via proxy
        let ok = await runStep(0, async () => {
            const start = performance.now();
            await proxy.insert({
                id: testId, locationId: 'test', number: 0,
                label: `SyncTest ${new Date().toLocaleTimeString()}`,
                zone: 'main', capacity: 1, x: 0, y: 0,
                status: 'available', updatedAt: new Date().toISOString(),
            });
            const ms = Math.round(performance.now() - start);
            return { ms, detail: `Wrote "${testId.substring(0, 12)}" via ${isServerDevice ? 'local RxDB' : 'HTTP API'}`, pass: true };
        });
        if (!ok) { autoSyncTest.status = 'fail'; autoSyncTest.step = ''; autoSyncTest.error = 'Write failed'; fetchServerTables(); return; }

        // Step 1: Verify in server store
        ok = await runStep(1, async () => {
            const check = await pollServerForDoc(testId, true);
            return { ms: check.elapsed, detail: check.found ? 'Found in server replication store' : 'NOT found after timeout', pass: check.found };
        });
        if (!ok) { autoSyncTest.status = 'fail'; autoSyncTest.step = ''; autoSyncTest.error = 'Add never reached server store'; fetchServerTables(); return; }

        // Step 2: Verify in local RxDB (this is the critical client test — proves SSE/pull loop works)
        ok = await runStep(2, async () => {
            const check = await pollLocalRxDb(testId, true);
            return { ms: check.elapsed, detail: check.found ? 'Found in local RxDB (replication pull worked)' : 'NOT in local RxDB — replication pull broken', pass: check.found };
        });
        if (!ok) { autoSyncTest.status = 'fail'; autoSyncTest.step = ''; autoSyncTest.error = 'Doc reached server but never appeared in local RxDB — replication pull/SSE issue'; fetchServerTables(); return; }

        // Step 3: Delete via proxy
        ok = await runStep(3, async () => {
            const start = performance.now();
            await proxy.remove(testId);
            const ms = Math.round(performance.now() - start);
            return { ms, detail: `Deleted via ${isServerDevice ? 'local RxDB' : 'HTTP API'}`, pass: true };
        });
        if (!ok) { autoSyncTest.status = 'fail'; autoSyncTest.step = ''; autoSyncTest.error = 'Delete call failed'; fetchServerTables(); return; }

        // Step 4: Verify removed from server store
        ok = await runStep(4, async () => {
            const check = await pollServerForDoc(testId, false);
            return { ms: check.elapsed, detail: !check.found ? 'Confirmed removed from server store' : 'Still in server store after timeout', pass: !check.found };
        });
        if (!ok) { autoSyncTest.status = 'fail'; autoSyncTest.step = ''; autoSyncTest.error = 'Delete never reached server store'; fetchServerTables(); return; }

        // Step 5: Verify removed from local RxDB
        ok = await runStep(5, async () => {
            const check = await pollLocalRxDb(testId, false);
            return { ms: check.elapsed, detail: !check.found ? 'Confirmed removed from local RxDB' : 'Still in local RxDB — delete not replicated back', pass: !check.found };
        });
        if (!ok) { autoSyncTest.status = 'fail'; autoSyncTest.step = ''; autoSyncTest.error = 'Delete reached server but local RxDB still has it — replication pull issue'; fetchServerTables(); return; }

        autoSyncTest.status = 'pass';
        autoSyncTest.step = '';
        fetchServerTables();
    }

    function startServerPoll() {
        if (serverPollTimer) clearInterval(serverPollTimer);
        fetchServerTables();
        serverPollTimer = setInterval(fetchServerTables, 3_000);
    }

    function stopServerPoll() {
        if (serverPollTimer) {
            clearInterval(serverPollTimer);
            serverPollTimer = null;
        }
    }
</script>

<!-- Scroll fix: full-height scrollable container -->
<div class="h-full overflow-y-auto">
<div class="mx-auto max-w-3xl p-4 sm:p-8 space-y-6 pb-24">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Network Diagnostics</h1>
            <p class="text-sm text-gray-500 mt-1">Test server connectivity, push/pull, and device identity</p>
        </div>
        <button
            onclick={runAllDiagnostics}
            disabled={runningAll}
            class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-50"
        >
            {#if runningAll}
                <Loader2 class="h-4 w-4 animate-spin" />
                Running...
            {:else}
                <RefreshCw class="h-4 w-4" />
                Run All Tests
            {/if}
        </button>
    </div>

    <!-- Overall Status -->
    {#if allPassed || anyFailed}
        <div class={cn(
            'flex items-center gap-3 rounded-xl border-2 px-4 py-3',
            allPassed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
        )}>
            {#if allPassed}
                <CheckCircle class="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                    <p class="text-sm font-bold text-emerald-900">All network tests passed</p>
                    <p class="text-xs text-emerald-600">
                        Server reachable, push/pull working, device identified as
                        {deviceId.isServer ? 'SERVER' : 'CLIENT'}
                    </p>
                </div>
            {:else}
                <XCircle class="h-6 w-6 text-red-600 shrink-0" />
                <div>
                    <p class="text-sm font-bold text-red-900">Some network tests failed</p>
                    <p class="text-xs text-red-600">Check the results below for details</p>
                </div>
            {/if}
        </div>
    {/if}

    <!-- ═══ PING CHAT BOX ═══ -->
    <div class="rounded-xl border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-blue-50 px-4 py-3 border-b border-blue-200">
            <div class="flex items-center gap-2">
                <MessageCircle class="h-4 w-4 text-blue-600" />
                <h2 class="text-sm font-bold text-blue-900">Ping Chat</h2>
                <span class={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    chatConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                )}>
                    <span class={cn('inline-block h-1.5 w-1.5 rounded-full', chatConnected ? 'bg-emerald-500' : 'bg-red-500')}></span>
                    {chatConnected ? 'LIVE' : 'DISCONNECTED'}
                </span>
            </div>
            <button onclick={sendQuickPing} class="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700" style="min-height: unset">
                Quick Ping
            </button>
        </div>
        <div class="px-4 py-2">
            <p class="text-[10px] text-gray-400 mb-2">
                Send a message from {isServerDevice ? 'SERVER' : 'CLIENT'} — it appears on ALL devices in real-time via SSE.
            </p>
            <!-- Chat messages -->
            <div
                bind:this={chatContainerEl}
                class="h-48 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 space-y-1.5 mb-2"
            >
                {#if chatMessages.length === 0}
                    <p class="text-xs text-gray-400 text-center py-8">No messages yet. Send a ping!</p>
                {:else}
                    {#each chatMessages as msg (msg.id)}
                        {@const isMine = isServerDevice ? msg.isServer : (msg.fromIp === deviceId.ipAddress)}
                        <div class={cn(
                            'flex flex-col max-w-[80%] rounded-lg px-2.5 py-1.5',
                            isMine ? 'ml-auto bg-blue-100 text-blue-900' : 'mr-auto bg-white border border-gray-200 text-gray-900'
                        )}>
                            <div class="flex items-center gap-1.5">
                                <span class="text-[10px] font-bold">
                                    {msg.from}
                                </span>
                                <span class="text-[9px] text-gray-400">
                                    {new Date(msg.sentAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <p class="text-xs">{msg.text}</p>
                        </div>
                    {/each}
                {/if}
            </div>
            <!-- Chat input -->
            <form
                onsubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
                class="flex gap-2"
            >
                <input
                    type="text"
                    bind:value={chatInput}
                    placeholder="Type a message..."
                    class="pos-input flex-1 text-sm"
                    disabled={chatSending}
                />
                <button
                    type="submit"
                    disabled={chatSending || !chatInput.trim()}
                    class="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {#if chatSending}
                        <Loader2 class="h-3 w-3 animate-spin" />
                    {:else}
                        <Send class="h-3 w-3" />
                    {/if}
                    Send
                </button>
            </form>
            {#if chatError}
                <p class="text-[10px] text-red-500 mt-1">{chatError}</p>
            {/if}
        </div>
    </div>

    <!-- ═══ ROUTE HEALTH CHECK (RxDB Collection Sync) ═══ -->
    <div class="rounded-xl border-2 border-emerald-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-emerald-50 px-4 py-3 border-b border-emerald-200">
            <div class="flex items-center gap-2">
                <Database class="h-4 w-4 text-emerald-600" />
                <h2 class="text-sm font-bold text-emerald-900">Route Data Sync Check</h2>
                {#if routeCheckDone}
                    {@const summary = routeHealthSummary()}
                    <span class={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        summary.failed === 0 && summary.partial === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : summary.failed > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    )}>
                        {summary.synced}/{summary.total} synced
                    </span>
                {/if}
            </div>
            <button
                onclick={runRouteHealthCheck}
                disabled={routeCheckRunning}
                class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                style="min-height: unset"
            >
                {#if routeCheckRunning}
                    <Loader2 class="h-3 w-3 animate-spin" />
                    Checking...
                {:else}
                    <RefreshCw class="h-3 w-3" />
                    Check All Routes
                {/if}
            </button>
        </div>
        <div class="px-0 py-0">
            <p class="text-[10px] text-gray-400 px-4 pt-2 pb-1">
                Verifies each route's <span class="font-bold">RxDB collection dependencies</span> are synced between local IndexedDB and server replication store.
                Compares doc counts per collection.
            </p>
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="border-b border-gray-200 bg-gray-50">
                            <th class="px-3 py-2 text-left font-bold text-gray-500 uppercase w-8">Group</th>
                            <th class="px-3 py-2 text-left font-bold text-gray-500 uppercase">Route</th>
                            <th class="px-3 py-2 text-left font-bold text-gray-500 uppercase">Collections</th>
                            <th class="px-3 py-2 text-center font-bold text-gray-500 uppercase w-20">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each Object.entries(routeGroups()) as [group, routes]}
                            {#each routes as route, ri (route.path)}
                                <tr class={cn(
                                    'border-b border-gray-50 last:border-0',
                                    route.status === 'error' ? 'bg-red-50/50' :
                                    route.status === 'partial' ? 'bg-amber-50/50' : ''
                                )}>
                                    <td class="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase align-top">
                                        {#if ri === 0}{group}{/if}
                                    </td>
                                    <td class="px-3 py-1.5">
                                        <div class="flex flex-col">
                                            <span class="font-medium text-gray-900">{route.label}</span>
                                            <span class="font-mono text-[10px] text-gray-400">{route.path}</span>
                                        </div>
                                    </td>
                                    <td class="px-3 py-1.5">
                                        {#if route.collectionResults.length > 0}
                                            <div class="flex flex-wrap gap-1">
                                                {#each route.collectionResults as col}
                                                    <span class={cn(
                                                        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold',
                                                        col.syncStatus === 'match' ? 'bg-emerald-100 text-emerald-700' :
                                                        col.syncStatus === 'subset' ? 'bg-blue-100 text-blue-700' :
                                                        col.syncStatus === 'empty' ? 'bg-gray-100 text-gray-400' :
                                                        col.syncStatus === 'unavailable' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    )} title="{col.name}: local={col.localCount ?? '?'} server={col.serverCount} ({col.syncStatus})">
                                                        {col.name}
                                                        <span class="text-[8px] opacity-75">
                                                            {col.localCount ?? '?'}/{col.serverCount}
                                                        </span>
                                                    </span>
                                                {/each}
                                            </div>
                                        {:else if route.status === 'testing'}
                                            <Loader2 class="h-3 w-3 animate-spin text-gray-400" />
                                        {:else}
                                            <span class="text-gray-300 text-[10px]">not checked</span>
                                        {/if}
                                    </td>
                                    <td class="px-3 py-1.5 text-center">
                                        {#if route.status === 'synced'}
                                            <span class="text-emerald-600 font-bold">✅</span>
                                        {:else if route.status === 'partial'}
                                            <span class="text-amber-600 font-bold" title="Some collections out of sync">⚠️</span>
                                        {:else if route.status === 'empty'}
                                            <span class="text-gray-400" title="No data yet">📭</span>
                                        {:else if route.status === 'error'}
                                            <span class="text-red-600 font-bold" title={route.error || ''}>❌</span>
                                        {:else if route.status === 'testing'}
                                            <Loader2 class="h-3 w-3 animate-spin text-gray-400 mx-auto" />
                                        {:else}
                                            <span class="text-gray-300">⚪</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        {/each}
                    </tbody>
                </table>
            </div>
            {#if routeCheckDone}
                {@const summary = routeHealthSummary()}
                <div class={cn(
                    'mx-4 my-3 rounded-lg px-3 py-2',
                    summary.failed === 0 && summary.partial === 0
                        ? 'bg-emerald-50'
                        : summary.failed > 0 ? 'bg-red-50' : 'bg-amber-50'
                )}>
                    {#if summary.failed === 0 && summary.partial === 0 && summary.empty === 0}
                        <p class="text-xs font-bold text-emerald-700">All {summary.synced} routes fully synced</p>
                    {:else}
                        <p class="text-xs font-bold text-gray-700">
                            ✅ {summary.synced} synced
                            {#if summary.partial > 0} · ⚠️ {summary.partial} partial{/if}
                            {#if summary.empty > 0} · 📭 {summary.empty} empty{/if}
                            {#if summary.failed > 0} · ❌ {summary.failed} error{/if}
                        </p>
                        {#if summary.partial > 0}
                            <p class="text-[10px] text-amber-600 mt-0.5">
                                Partial = local has more docs than server (unexpected). Blue badges = local &lt; server (normal for location-scoped data).
                            </p>
                        {/if}
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- ═══ REMOTE SYNC CHECK (Client Reports) ═══ -->
    {#if isServerDevice}
    <div class="rounded-xl border-2 border-violet-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-violet-50 px-4 py-3 border-b border-violet-200">
            <div class="flex items-center gap-2">
                <Smartphone class="h-4 w-4 text-violet-600" />
                <h2 class="text-sm font-bold text-violet-900">Remote Client Sync Check</h2>
                {#if remoteSyncState.status === 'done' && remoteSyncState.clientReports.length > 0}
                    {@const clients = remoteSyncState.clientReports.filter(r => !r.isServer)}
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700">
                        {clients.length} client{clients.length !== 1 ? 's' : ''}
                    </span>
                {/if}
            </div>
            <button
                onclick={triggerRemoteSyncCheck}
                disabled={remoteSyncState.status === 'requesting'}
                class="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                style="min-height: unset"
            >
                {#if remoteSyncState.status === 'requesting'}
                    <Loader2 class="h-3 w-3 animate-spin" />
                    Testing (~8s)...
                {:else}
                    <RefreshCw class="h-3 w-3" />
                    Test All Devices
                {/if}
            </button>
        </div>
        <div class="px-4 py-3">
            <p class="text-[10px] text-gray-400 mb-3">
                Tests every device's ability to <span class="font-bold">read</span> (pull) and <span class="font-bold">write</span> (push + verify + cleanup) each RxDB collection
                through the replication pipeline. Broadcasts via SSE to all connected clients.
            </p>

            {#if remoteSyncState.status === 'error'}
                <div class="rounded-lg bg-red-50 px-3 py-2">
                    <p class="text-xs font-bold text-red-700">Error: {remoteSyncState.error}</p>
                </div>
            {:else if remoteSyncState.status === 'done'}
                {#if remoteSyncState.clientReports.length === 0}
                    <div class="rounded-lg bg-amber-50 px-3 py-2">
                        <p class="text-xs font-bold text-amber-700">No client reports received</p>
                        <p class="text-[10px] text-amber-600 mt-0.5">Are any client devices connected? They need an active SSE stream to receive the signal.</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each remoteSyncState.clientReports as report (report.clientIp)}
                            <div class="rounded-lg border border-gray-200 overflow-hidden">
                                <!-- Client header -->
                                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                                    {#if report.isServer}
                                        <Server class="h-3.5 w-3.5 text-accent" />
                                        <span class="text-xs font-bold text-gray-900">Server (this device)</span>
                                    {:else}
                                        <Smartphone class="h-3.5 w-3.5 text-blue-500" />
                                        <span class="text-xs font-bold text-gray-900">{report.deviceHint}</span>
                                    {/if}
                                    <span class="text-[10px] font-mono text-gray-400">{report.clientIp}</span>
                                    <span class="ml-auto text-[10px] text-gray-400">
                                        {new Date(report.checkedAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <!-- Collection read/write test table -->
                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs">
                                        <thead>
                                            <tr class="border-b border-gray-100 bg-gray-50/50">
                                                <th class="px-3 py-1 text-left font-bold text-gray-500 uppercase">Collection</th>
                                                <th class="px-3 py-1 text-right font-bold text-gray-500 uppercase w-14">Local</th>
                                                <th class="px-3 py-1 text-right font-bold text-gray-500 uppercase w-14">Server</th>
                                                <th class="px-3 py-1 text-center font-bold text-gray-500 uppercase w-14">Read</th>
                                                <th class="px-3 py-1 text-center font-bold text-gray-500 uppercase w-14">Write</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each ALL_ROUTE_COLLECTIONS as col}
                                                {@const result = report.collections[col]}
                                                {@const server = remoteSyncState.serverCounts[col] ?? 0}
                                                {@const hasResult = !!result}
                                                {@const notReplicated = !hasResult && !report.isServer && server > 0}
                                                {#if hasResult || server > 0}
                                                <tr class={cn(
                                                    'border-b border-gray-50 last:border-0',
                                                    hasResult && (!result.readOk || !result.writeOk) && !notReplicated ? 'bg-red-50/30' : ''
                                                )}>
                                                    <td class="px-3 py-1 font-mono text-gray-700">{col}</td>
                                                    <td class="px-3 py-1 text-right font-mono {hasResult && result.localCount >= 0 ? 'text-gray-900 font-bold' : 'text-gray-300 italic'}">
                                                        {hasResult && result.localCount >= 0 ? result.localCount : 'n/a'}
                                                    </td>
                                                    <td class="px-3 py-1 text-right font-mono {server > 0 ? 'text-gray-900 font-bold' : 'text-gray-300'}">
                                                        {server}
                                                    </td>
                                                    <td class="px-3 py-1 text-center">
                                                        {#if notReplicated}
                                                            <span class="text-gray-300">—</span>
                                                        {:else if !hasResult}
                                                            <span class="text-gray-300">—</span>
                                                        {:else if result.readOk}
                                                            <span class="text-emerald-600" title="{result.readMs}ms">✅</span>
                                                        {:else}
                                                            <span class="text-red-600" title={result.error || 'Read failed'}>❌</span>
                                                        {/if}
                                                    </td>
                                                    <td class="px-3 py-1 text-center">
                                                        {#if notReplicated}
                                                            <span class="text-gray-300">—</span>
                                                        {:else if !hasResult}
                                                            <span class="text-gray-300">—</span>
                                                        {:else if result.writeOk}
                                                            <span class="text-emerald-600" title="{result.writeMs}ms">✅</span>
                                                        {:else}
                                                            <span class="text-red-600" title={result.error || 'Write failed'}>❌</span>
                                                        {/if}
                                                    </td>
                                                </tr>
                                                {/if}
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                                <!-- Summary footer -->
                                {#if true}
                                {@const tested = Object.values(report.collections)}
                                {@const readPass = tested.filter(c => c.readOk).length}
                                {@const writePass = tested.filter(c => c.writeOk).length}
                                {@const total = tested.length}
                                <div class={cn(
                                    'px-3 py-1.5 border-t text-[10px] font-bold',
                                    readPass === total && writePass === total
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                )}>
                                    Read: {readPass}/{total} · Write: {writePass}/{total}
                                    {#if readPass === total && writePass === total}
                                        — all replication working
                                    {/if}
                                </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {:else if remoteSyncState.status === 'idle'}
                <p class="text-xs text-gray-400">Click "Test All Devices" to test read/write on every collection for each connected device.</p>
            {/if}
        </div>
    </div>
    {/if}

    <!-- 1. Device Identity -->
    <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-border">
            <div class="flex items-center gap-2">
                {#if deviceId.isServer}
                    <Server class="h-4 w-4 text-accent" />
                {:else}
                    <Smartphone class="h-4 w-4 text-blue-500" />
                {/if}
                <h2 class="text-sm font-bold text-gray-900">Device Identity</h2>
                <span class="text-xs">{statusIcon(deviceId.status)}</span>
            </div>
            <button onclick={detectDevice} class="text-xs font-medium text-accent hover:text-accent-dark" style="min-height: unset">Re-detect</button>
        </div>
        <div class="px-4 py-3">
            {#if deviceId.status === 'loading'}
                <p class="text-sm text-gray-500 flex items-center gap-2"><Loader2 class="h-3.5 w-3.5 animate-spin" /> Detecting...</p>
            {:else if deviceId.status === 'error'}
                <p class="text-sm text-red-600">Error: {deviceId.error}</p>
            {:else if deviceId.status === 'ok'}
                <div class="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                    <span class="text-gray-500">This device</span>
                    <span class={cn('font-bold', deviceId.isServer ? 'text-accent' : 'text-blue-600')}>
                        {deviceId.isServer ? 'SERVER (Main Tablet)' : 'CLIENT (LAN Device)'}
                    </span>
                    <span class="text-gray-500">My IP</span>
                    <span class="font-mono font-medium text-gray-900">{deviceId.ipAddress || '—'}</span>
                    {#if !deviceId.isServer}
                        <span class="text-gray-500">Server IP</span>
                        <span class="font-mono font-medium text-gray-900">{deviceId.serverLanIp || '—'}</span>
                    {/if}
                    <span class="text-gray-500">Hostname</span>
                    <span class="font-mono font-medium text-gray-900 truncate">{deviceId.serverHostname || '—'}</span>
                    <span class="text-gray-500">Server Epoch</span>
                    <span class="font-mono text-xs text-gray-600">{deviceId.serverEpoch || '—'}</span>
                    <span class="text-gray-500">Browser URL</span>
                    <span class="font-mono text-xs text-gray-600 truncate">{browser ? window.location.origin : '—'}</span>
                </div>
            {:else}
                <p class="text-sm text-gray-400">Not tested yet</p>
            {/if}
        </div>
    </div>

    <!-- 2. Server Ping -->
    <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-border">
            <div class="flex items-center gap-2">
                <Zap class="h-4 w-4 text-amber-500" />
                <h2 class="text-sm font-bold text-gray-900">Server Ping</h2>
                <span class="text-xs">{statusIcon(pingResult.status)}</span>
            </div>
            <button onclick={pingServer} class="text-xs font-medium text-accent hover:text-accent-dark" style="min-height: unset">Ping Again</button>
        </div>
        <div class="px-4 py-3">
            {#if pingResult.status === 'testing'}
                <p class="text-sm text-gray-500 flex items-center gap-2"><Loader2 class="h-3.5 w-3.5 animate-spin" /> Pinging server...</p>
            {:else if pingResult.status === 'error'}
                <div class="rounded-lg bg-red-50 px-3 py-2">
                    <p class="text-sm font-bold text-red-700">Server unreachable</p>
                    <p class="text-xs text-red-600 mt-0.5">{pingResult.error}</p>
                    {#if pingResult.roundTripMs !== null}
                        <p class="text-xs text-red-400 mt-0.5">Timed out after {pingResult.roundTripMs}ms</p>
                    {/if}
                </div>
                <p class="text-xs text-gray-500 mt-2">
                    {#if isServerDevice}
                        The server process may not be running. Try <code class="bg-gray-100 px-1 rounded">pnpm dev</code>.
                    {:else}
                        Check WiFi connection. The server tablet must be running on the same network.
                    {/if}
                </p>
            {:else if pingResult.status === 'success'}
                <div class="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                    <span class="text-gray-500">Round-trip</span>
                    <span class={cn(
                        'font-mono font-bold',
                        (pingResult.roundTripMs ?? 0) < 100 ? 'text-emerald-600' :
                        (pingResult.roundTripMs ?? 0) < 500 ? 'text-amber-600' : 'text-red-600'
                    )}>
                        {pingResult.roundTripMs}ms
                    </span>
                    <span class="text-gray-500">Server time</span>
                    <span class="font-mono text-xs text-gray-600">{pingResult.serverTime ? new Date(pingResult.serverTime).toLocaleTimeString() : '—'}</span>
                    <span class="text-gray-500">Store docs</span>
                    <span class="font-mono font-medium text-gray-900">{pingResult.storeCount?.toLocaleString() ?? '—'}</span>
                    <span class="text-gray-500">Write test</span>
                    <span class={cn('font-bold', pingResult.writeOk ? 'text-emerald-600' : 'text-red-600')}>
                        {pingResult.writeOk ? 'Passed' : pingResult.writeError || 'Failed'}
                    </span>
                    <span class="text-gray-500">Seen as</span>
                    <span class="text-xs text-gray-600">{pingResult.deviceLabel || '—'}</span>
                </div>
            {:else}
                <p class="text-sm text-gray-400">Not tested yet</p>
            {/if}
        </div>
    </div>

    <!-- 3. Push / Pull Tests -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Push — now pushes REAL data -->
        <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div class="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-border">
                <div class="flex items-center gap-2">
                    <ArrowUpCircle class="h-4 w-4 text-blue-500" />
                    <h3 class="text-sm font-bold text-gray-900">Push Data</h3>
                    <span class="text-xs">{statusIcon(pushTest.status)}</span>
                </div>
                <button onclick={testPush} class="text-xs font-medium text-accent hover:text-accent-dark" style="min-height: unset">Push Now</button>
            </div>
            <div class="px-4 py-3">
                {#if pushTest.status === 'testing'}
                    <p class="text-sm text-gray-500 flex items-center gap-2"><Loader2 class="h-3 w-3 animate-spin" /> Pushing tables to server...</p>
                {:else if pushTest.status === 'error'}
                    <p class="text-sm text-red-600 font-bold">Push failed</p>
                    <p class="text-xs text-red-500 mt-0.5">{pushTest.error}</p>
                {:else if pushTest.status === 'success'}
                    <p class="text-sm text-emerald-600 font-bold">Pushed {pushTest.pushed} tables</p>
                    <p class="text-xs text-gray-500 mt-0.5">{pushTest.roundTripMs}ms round-trip</p>
                {:else}
                    <p class="text-sm text-gray-400">Pushes local RxDB tables to server</p>
                {/if}
            </div>
        </div>

        <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div class="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-border">
                <div class="flex items-center gap-2">
                    <ArrowDownCircle class="h-4 w-4 text-emerald-500" />
                    <h3 class="text-sm font-bold text-gray-900">Pull</h3>
                    <span class="text-xs">{statusIcon(pullTest.status)}</span>
                </div>
                <button onclick={testPull} class="text-xs font-medium text-accent hover:text-accent-dark" style="min-height: unset">Test</button>
            </div>
            <div class="px-4 py-3">
                {#if pullTest.status === 'testing'}
                    <p class="text-sm text-gray-500 flex items-center gap-2"><Loader2 class="h-3 w-3 animate-spin" /> Testing pull...</p>
                {:else if pullTest.status === 'error'}
                    <p class="text-sm text-red-600 font-bold">Pull endpoint unreachable</p>
                    <p class="text-xs text-red-500 mt-0.5">{pullTest.error}</p>
                {:else if pullTest.status === 'success'}
                    <p class="text-sm text-emerald-600 font-bold">Pull OK — {pullTest.docCount} tables</p>
                    <p class="text-xs text-gray-500 mt-0.5">{pullTest.roundTripMs}ms round-trip</p>
                {:else}
                    <p class="text-sm text-gray-400">Not tested</p>
                {/if}
            </div>
        </div>
    </div>

    <!-- 3b. Replication Round-Trip -->
    <div class="rounded-xl border-2 border-indigo-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-indigo-50 px-4 py-3 border-b border-indigo-200">
            <div class="flex items-center gap-2">
                <RefreshCw class="h-4 w-4 text-indigo-600" />
                <h2 class="text-sm font-bold text-indigo-900">Replication Round-Trip</h2>
                <span class="text-xs">{statusIcon(replicationTest.status)}</span>
            </div>
        </div>
        <div class="px-4 py-3 space-y-3">
            <p class="text-xs text-gray-500">
                Full cycle: Push a test document to the server store, pull it back, verify it exists, then clean up.
                This proves the entire replication pipeline works end-to-end.
            </p>
            <button
                onclick={testReplicationRoundTrip}
                disabled={replicationTest.status === 'testing'}
                class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
                {#if replicationTest.status === 'testing'}
                    <Loader2 class="h-3 w-3 animate-spin" />
                    Testing...
                {:else}
                    <RefreshCw class="h-3 w-3" />
                    Run Round-Trip Test
                {/if}
            </button>
            {#if replicationTest.status === 'success'}
                <div class="rounded-lg bg-emerald-50 px-3 py-2">
                    <p class="text-xs font-bold text-emerald-700">Round-trip passed!</p>
                    <p class="text-[10px] text-emerald-600 mt-0.5">
                        Push: {replicationTest.pushMs}ms | Pull: {replicationTest.pullMs}ms | Cleanup: {replicationTest.cleanupMs}ms
                    </p>
                    <p class="text-[10px] text-emerald-500 mt-0.5">
                        Document pushed → found in server store → cleaned up
                    </p>
                </div>
            {:else if replicationTest.status === 'error'}
                <div class="rounded-lg bg-red-50 px-3 py-2">
                    <p class="text-xs font-bold text-red-700">Round-trip failed</p>
                    <p class="text-[10px] text-red-600 mt-0.5">{replicationTest.error}</p>
                    {#if replicationTest.pushMs !== null}
                        <p class="text-[10px] text-red-400 mt-0.5">
                            Push: {replicationTest.pushMs}ms
                            {replicationTest.pullMs !== null ? ` | Pull: ${replicationTest.pullMs}ms` : ''}
                            {replicationTest.pullFound ? ' | Doc found' : ' | Doc NOT found'}
                        </p>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- 4. Server Store Status -->
    <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-border">
            <div class="flex items-center gap-2">
                <Database class="h-4 w-4 text-purple-500" />
                <h2 class="text-sm font-bold text-gray-900">Server Replication Store</h2>
                <span class="text-xs">{statusIcon(serverStatus.status)}</span>
            </div>
            <button onclick={checkServerStatus} class="text-xs font-medium text-accent hover:text-accent-dark" style="min-height: unset">Refresh</button>
        </div>
        <div class="px-4 py-3">
            {#if serverStatus.status === 'loading'}
                <p class="text-sm text-gray-500 flex items-center gap-2"><Loader2 class="h-3.5 w-3.5 animate-spin" /> Loading...</p>
            {:else if serverStatus.status === 'error'}
                <div class="rounded-lg bg-red-50 px-3 py-2">
                    <p class="text-sm font-bold text-red-700">Cannot reach server store</p>
                    <p class="text-xs text-red-600 mt-0.5">{serverStatus.error}</p>
                </div>
            {:else if serverStatus.status === 'ok'}
                <div class="flex items-center gap-4 mb-3">
                    <div>
                        <p class="text-2xl font-bold text-gray-900 font-mono">{serverStatus.total.toLocaleString()}</p>
                        <p class="text-[10px] text-gray-400 uppercase tracking-wider">Total docs</p>
                    </div>
                    <div>
                        <p class="text-sm font-mono text-gray-600">{serverStatus.epoch}</p>
                        <p class="text-[10px] text-gray-400 uppercase tracking-wider">Epoch</p>
                    </div>
                </div>
                {#if Object.keys(serverStatus.counts).length > 0}
                    <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-100">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="border-b border-gray-100 bg-gray-50">
                                    <th class="px-3 py-1.5 text-left font-bold text-gray-500 uppercase">Collection</th>
                                    <th class="px-3 py-1.5 text-right font-bold text-gray-500 uppercase">Docs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each Object.entries(serverStatus.counts).sort((a, b) => b[1] - a[1]) as [name, count]}
                                    <tr class="border-b border-gray-50 last:border-0">
                                        <td class="px-3 py-1.5 font-mono text-gray-700">{name}</td>
                                        <td class="px-3 py-1.5 text-right font-mono {count > 0 ? 'text-gray-900 font-bold' : 'text-gray-300'}">{count}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <p class="text-sm text-amber-600 font-medium">Server store is empty. The main tablet needs to push data.</p>
                {/if}
            {:else}
                <p class="text-sm text-gray-400">Not checked yet</p>
            {/if}
        </div>
    </div>

    <!-- 5. Write Proxy Test -->
    <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-border">
            <div class="flex items-center gap-2">
                <Activity class="h-4 w-4 text-cyan-500" />
                <h2 class="text-sm font-bold text-gray-900">Write Proxy Test</h2>
                <span class="text-xs">{statusIcon(writeProxyTest.status)}</span>
            </div>
        </div>
        <div class="px-4 py-3 space-y-3">
            <p class="text-xs text-gray-500">
                Tests the <code class="bg-gray-100 px-1 rounded">/api/collections/[collection]/write</code> endpoint
                that thin clients use to send updates to the server.
            </p>
            <button
                onclick={runWriteProxyTest}
                disabled={writeProxyTest.status === 'testing'}
                class="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
            >
                {#if writeProxyTest.status === 'testing'}
                    <Loader2 class="h-3 w-3 animate-spin" />
                    Testing...
                {:else}
                    <ArrowUpCircle class="h-3 w-3" />
                    Test Write to Server
                {/if}
            </button>
            {#if writeProxyTest.status === 'success'}
                <div class="rounded-lg bg-emerald-50 px-3 py-2">
                    <p class="text-xs font-bold text-emerald-700">Write proxy working</p>
                    <p class="text-[10px] text-emerald-600 mt-0.5">
                        Insert: {writeProxyTest.insertMs}ms | Read-back: {writeProxyTest.readMs}ms | Cleanup: {writeProxyTest.deleteMs}ms
                    </p>
                </div>
            {:else if writeProxyTest.status === 'error'}
                <div class="rounded-lg bg-red-50 px-3 py-2">
                    <p class="text-xs font-bold text-red-700">Write proxy failed</p>
                    <p class="text-[10px] text-red-600 mt-0.5">{writeProxyTest.error}</p>
                    <p class="text-[10px] text-red-400 mt-1">
                        This means thin clients CANNOT send updates to the server. Check the server console.
                    </p>
                </div>
            {/if}
        </div>
    </div>

    <!-- 6. Database Reset -->
    <div class="rounded-xl border-2 border-red-200 bg-red-50/50 overflow-hidden">
        <div class="flex items-center gap-2 bg-red-50 px-4 py-3 border-b border-red-200">
            <RotateCcw class="h-4 w-4 text-red-500" />
            <h2 class="text-sm font-bold text-red-700">Danger Zone</h2>
        </div>
        <div class="px-4 py-3 space-y-3">
            <p class="text-xs text-red-600">Clears the database on ALL connected devices and re-seeds with fresh data.</p>
            <button
                onclick={resetAllDevices}
                disabled={resettingAll}
                class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
                {resettingAll ? 'Resetting...' : 'Reset All Devices & Database'}
            </button>
        </div>
    </div>

    <!-- 7. Sync Test — Two-Column View -->
    <div class="rounded-xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between bg-amber-50 px-4 py-3 border-b border-amber-200">
            <div class="flex items-center gap-2">
                <Database class="h-4 w-4 text-amber-600" />
                <h2 class="text-sm font-bold text-amber-900">Sync Test — Tables Collection</h2>
                <span class={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    isServerDevice ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                )}>
                    {isServerDevice ? 'SERVER' : 'CLIENT'}
                </span>
            </div>
            <button
                onclick={fetchServerTables}
                class="text-xs font-medium text-amber-700 hover:text-amber-900"
                style="min-height: unset"
            >
                <RefreshCw class="h-3 w-3 inline" /> Refresh
            </button>
        </div>

        <!-- Add table form -->
        <div class="px-4 pt-3 pb-2 border-b border-amber-100">
            <p class="text-[10px] text-gray-400 mb-2">
                Add or delete tables from <span class="font-bold">{isServerDevice ? 'SERVER' : 'CLIENT'}</span>.
                Uses <code class="bg-gray-100 px-1 rounded text-[9px]">getWritableCollection()</code> —
                {isServerDevice ? 'writes directly to local RxDB' : 'routes through HTTP API to server'}.
                Server store auto-refreshes every 3s.
            </p>
            <form
                onsubmit={(e) => { e.preventDefault(); addTestTable(); }}
                class="flex gap-2"
            >
                <input
                    type="text"
                    bind:value={newTableName}
                    placeholder="New table name..."
                    class="pos-input flex-1 text-sm"
                    disabled={syncTestAdding}
                />
                <button
                    type="submit"
                    disabled={syncTestAdding || !newTableName.trim()}
                    class="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                    {#if syncTestAdding}
                        <Loader2 class="h-3 w-3 animate-spin" />
                    {:else}
                        <Plus class="h-3 w-3" />
                    {/if}
                    Add
                </button>
            </form>
            {#if syncTestError}
                <p class="text-[10px] text-red-500 mt-1">{syncTestError}</p>
            {/if}
        </div>

        <!-- Automated Sync Test -->
        <div class="px-4 py-3 border-b border-amber-100 bg-amber-50/30">
            <div class="flex items-center gap-3 mb-2">
                <button
                    onclick={runAutoSyncTest}
                    disabled={autoSyncTest.status === 'running'}
                    class="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                    {#if autoSyncTest.status === 'running'}
                        <Loader2 class="h-3.5 w-3.5 animate-spin" />
                        Running...
                    {:else}
                        <Zap class="h-3.5 w-3.5" />
                        Run Sync Test
                    {/if}
                </button>
                {#if autoSyncTest.status === 'pass'}
                    <span class="text-sm font-bold text-emerald-600">✅ ALL 6 STEPS PASSED</span>
                {:else if autoSyncTest.status === 'fail'}
                    <span class="text-sm font-bold text-red-600">❌ FAILED</span>
                {/if}
            </div>

            <!-- Step-by-step results -->
            {#if autoSyncTest.status !== 'idle'}
                <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="border-b border-gray-100 bg-gray-50">
                                <th class="px-3 py-1.5 text-left font-bold text-gray-500 w-6">#</th>
                                <th class="px-3 py-1.5 text-left font-bold text-gray-500">Step</th>
                                <th class="px-3 py-1.5 text-center font-bold text-gray-500 w-14">Time</th>
                                <th class="px-3 py-1.5 text-left font-bold text-gray-500">Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each autoSyncTest.steps as step, i}
                                <tr class={cn(
                                    'border-b border-gray-50 last:border-0',
                                    step.status === 'fail' ? 'bg-red-50' : step.status === 'pass' ? 'bg-emerald-50/50' : ''
                                )}>
                                    <td class="px-3 py-1.5 text-center">
                                        {#if step.status === 'pass'}
                                            <span class="text-emerald-600">✅</span>
                                        {:else if step.status === 'fail'}
                                            <span class="text-red-600">❌</span>
                                        {:else if step.status === 'running'}
                                            <Loader2 class="h-3 w-3 animate-spin text-amber-500 inline" />
                                        {:else}
                                            <span class="text-gray-300">⚪</span>
                                        {/if}
                                    </td>
                                    <td class="px-3 py-1.5 font-medium text-gray-800">{step.label}</td>
                                    <td class="px-3 py-1.5 text-center font-mono">
                                        {#if step.ms !== null}
                                            <span class={cn(
                                                'font-bold',
                                                step.ms < 500 ? 'text-emerald-600' : step.ms < 2000 ? 'text-amber-600' : 'text-red-600'
                                            )}>{step.ms}ms</span>
                                        {:else}
                                            <span class="text-gray-300">—</span>
                                        {/if}
                                    </td>
                                    <td class="px-3 py-1.5 text-[10px] text-gray-500 truncate max-w-[200px]">{step.detail}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                {#if autoSyncTest.error}
                    <div class="mt-2 rounded-lg bg-red-50 px-3 py-2">
                        <p class="text-xs font-bold text-red-700">{autoSyncTest.error}</p>
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Two-column table view -->
        <div class="grid grid-cols-2 divide-x divide-amber-100">
            <!-- Left: Local RxDB (this device) -->
            <div class="p-3">
                <div class="flex items-center gap-2 mb-2">
                    {#if isServerDevice}
                        <Server class="h-3.5 w-3.5 text-accent" />
                    {:else}
                        <Smartphone class="h-3.5 w-3.5 text-blue-500" />
                    {/if}
                    <h3 class="text-xs font-bold text-gray-700">
                        Local RxDB ({isServerDevice ? 'Server' : 'Client'})
                    </h3>
                    <span class="ml-auto text-[10px] font-mono text-gray-400">{tables.length} docs</span>
                </div>
                {#if !initialized}
                    <p class="text-xs text-gray-400">Loading...</p>
                {:else}
                    <div class="space-y-1 max-h-64 overflow-y-auto">
                        {#each tables as table (table.id)}
                            <div class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5">
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs font-bold text-gray-900 truncate">{table.label}</p>
                                    <p class="text-[9px] font-mono text-gray-400">{table.id.substring(0, 8)} · {table.status} · {table.locationId}</p>
                                </div>
                                <button
                                    onclick={() => deleteTestTable(table.id)}
                                    class="ml-1 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                                    style="min-height: unset"
                                    title="Delete from {isServerDevice ? 'server' : 'client'}"
                                >
                                    <Trash2 class="h-3 w-3" />
                                </button>
                            </div>
                        {:else}
                            <p class="text-xs text-gray-400 italic text-center py-4">No tables in local RxDB</p>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Right: Server Replication Store -->
            <div class="p-3">
                <div class="flex items-center gap-2 mb-2">
                    <Server class="h-3.5 w-3.5 text-purple-500" />
                    <h3 class="text-xs font-bold text-gray-700">Server Store</h3>
                    <span class="ml-auto text-[10px] font-mono text-gray-400">
                        {#if serverTablesLoading}
                            <Loader2 class="h-3 w-3 animate-spin inline" />
                        {:else}
                            {serverTables.length} docs
                        {/if}
                    </span>
                </div>
                {#if serverTablesError}
                    <p class="text-xs text-red-500">{serverTablesError}</p>
                {:else}
                    <div class="space-y-1 max-h-64 overflow-y-auto">
                        {#each serverTables as table (table.id)}
                            {@const inLocal = tables.some(t => t.id === table.id)}
                            <div class={cn(
                                'flex items-center justify-between rounded-lg border px-2 py-1.5',
                                inLocal ? 'border-gray-100 bg-gray-50' : 'border-amber-200 bg-amber-50'
                            )}>
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs font-bold text-gray-900 truncate">
                                        {table.label}
                                        {#if !inLocal}
                                            <span class="text-[9px] text-amber-600 font-normal ml-1">(not in local)</span>
                                        {/if}
                                    </p>
                                    <p class="text-[9px] font-mono text-gray-400">{table.id.substring(0, 8)} · {table.status} · {table.locationId}</p>
                                </div>
                            </div>
                        {:else}
                            <p class="text-xs text-gray-400 italic text-center py-4">Server store empty</p>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Sync status footer -->
        {#if true}
            {@const localCount = tables.length}
            {@const serverCount = serverTables.length}
            {@const inSync = localCount === serverCount && tables.every(t => serverTables.some(s => s.id === t.id))}
            <div class="px-4 py-2 bg-gray-50 border-t border-amber-100">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class={cn(
                            'inline-block h-2 w-2 rounded-full',
                            inSync ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        )}></span>
                        <span class="text-[10px] font-bold text-gray-600">
                            {#if inSync}
                                In sync — {localCount} tables match
                            {:else}
                                Out of sync — Local: {localCount} · Server: {serverCount}
                                {#if localCount > serverCount}
                                    <span class="text-amber-600">({localCount - serverCount} not yet on server)</span>
                                {:else if serverCount > localCount}
                                    <span class="text-blue-600">({serverCount - localCount} not yet in local)</span>
                                {/if}
                            {/if}
                        </span>
                    </div>
                    <span class="text-[9px] text-gray-400">auto-refresh 3s</span>
                </div>
            </div>
        {/if}
    </div>
</div>
</div>
