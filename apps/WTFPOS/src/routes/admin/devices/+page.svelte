<script lang="ts">
	import { devices, renameDevice, getCurrentDeviceId, getDeviceIdentity, pruneStaleDevices, removeDevice } from '$lib/stores/device.svelte';
	import { LOCATIONS, ADMIN_ROLES, session } from '$lib/stores/session.svelte';
	import { resetDatabase } from '$lib/db';
	import { performFullReset } from '$lib/db/replication';
	import { cn } from '$lib/utils';
	import { formatDistanceToNow, differenceInSeconds, parseISO } from 'date-fns';
	import { APP_VERSION, BUILD_DATE } from '$lib/version';
	import { onMount } from 'svelte';
	import { Monitor, Smartphone, Tablet, LayoutGrid, Network, AlertTriangle, Users, Trash2, Moon } from 'lucide-svelte';

	// Auto-refresh every 3s for live-feeling timestamps
	let now = $state(new Date());
	onMount(() => {
		const interval = setInterval(() => { now = new Date(); }, 3_000);
		return () => clearInterval(interval);
	});

	let currentDeviceId = $state('');
	onMount(() => {
		currentDeviceId = getCurrentDeviceId();
	});

	// ─── Server-side client tracker (source of truth for connection status) ──
	interface ServerClient {
		ip: string;
		isServer: boolean;
		deviceHint: string;
		deviceName: string;
		userName: string;
		role: string;
		locationId: string;
		currentRoute: string;
		lastSeenAt: string;
		isActive: boolean;
		isScreenActive: boolean;
		hitCount: number;
		connectionTypes: string[];
		lastSyncAt: string | null;
	}
	let serverClients = $state<ServerClient[]>([]);

	/** Map of IP → server-tracked client for fast lookup */
	const serverClientsByIp = $derived(
		new Map(serverClients.map(c => [c.ip, c]))
	);

	async function fetchServerClients() {
		try {
			const res = await fetch('/api/device/clients', { signal: AbortSignal.timeout(5000) });
			if (res.ok) {
				const data = await res.json();
				serverClients = data.clients || [];
			}
		} catch {
			// Server unreachable — keep stale data
		}
	}

	onMount(() => {
		fetchServerClients();
		// Fallback poll every 10s — SSE is the primary update mechanism now
		const poll = setInterval(fetchServerClients, 10_000);

		// SSE: listen for real-time client-tracker changes
		const es = new EventSource('/api/replication/stream');
		es.addEventListener('clients', (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.clients) {
					serverClients = data.clients;
					now = new Date(); // refresh timestamps
				}
			} catch { /* ignore parse errors */ }
		});

		return () => {
			clearInterval(poll);
			es.close();
		};
	});

	const deviceList = $derived(devices.value || []);

	// Role-based filtering: admin/owner see all, others see only their location
	const filteredDeviceList = $derived(
		ADMIN_ROLES.includes(session.role)
			? deviceList
			: deviceList.filter(d => d.locationId === session.locationId)
	);

	// View mode
	let viewMode = $state<'topology' | 'cards'>('topology');

	// ─── Network Nodes: group by IP ──────────────────────────────────────────

	interface NetworkNode {
		ipAddress: string;
		isServer: boolean;
		sessions: typeof deviceList;
		locationId: string;
		deviceType: string;
		lastSeenAt: string;
		name: string;
		dataMode: string;
	}

	const networkNodes = $derived.by(() => {
		const byIp = new Map<string, typeof deviceList>();
		for (const d of filteredDeviceList) {
			const ip = d.ipAddress || d.id; // fallback for pre-migration
			if (!byIp.has(ip)) byIp.set(ip, []);
			byIp.get(ip)!.push(d);
		}
		const nodes: NetworkNode[] = [];
		for (const [ip, sessions] of byIp) {
			// Pick the most recent session's metadata
			const sorted = [...sessions].sort((a, b) => (b.lastSeenAt || '').localeCompare(a.lastSeenAt || ''));
			const primary = sorted[0];
			nodes.push({
				ipAddress: ip,
				isServer: sessions.some(s => s.isServer),
				sessions,
				locationId: primary.locationId,
				deviceType: primary.deviceType,
				lastSeenAt: primary.lastSeenAt,
				name: primary.ipAddress ? ip : primary.name, // show IP as name if available
				dataMode: (primary as any).dataMode || 'full-rxdb',
			});
		}
		return nodes;
	});

	const serverNode = $derived(networkNodes.find(n => n.isServer));
	const clientNodes = $derived(networkNodes.filter(n => !n.isServer));

	// Status helpers — parameterized on `now` for reactivity
	// Uses server-side client tracker as primary source of truth, falls back to RxDB heartbeat
	// Thresholds: Online <45s, Stale 45-120s, Offline >120s
	function getStatusInfo(lastSeenAt: string | undefined, opts?: { deviceId?: string; ip?: string; isScreenActive?: boolean }) {
		now; // reactive dependency
		// If this is the current device, it's always online (we're literally viewing the page)
		if (opts?.deviceId && opts.deviceId === currentDeviceId) {
			return { status: 'online' as const, color: 'bg-status-green', label: 'Online', hex: '#10B981', seconds: 0 };
		}

		let baseStatus: { status: 'online' | 'stale' | 'offline'; color: string; label: string; hex: string; seconds: number };

		// Check server-side client tracker (most accurate — updated on every HTTP request)
		if (opts?.ip) {
			const serverClient = serverClientsByIp.get(opts.ip);
			if (serverClient) {
				const serverDiff = differenceInSeconds(new Date(), parseISO(serverClient.lastSeenAt));
				if (serverClient.isActive || serverDiff < 45) {
					baseStatus = { status: 'online', color: 'bg-status-green', label: 'Online', hex: '#10B981', seconds: serverDiff };
				} else if (serverDiff < 120) {
					baseStatus = { status: 'stale', color: 'bg-amber-400', label: 'Stale', hex: '#F59E0B', seconds: serverDiff };
				} else {
					baseStatus = { status: 'offline', color: 'bg-status-red', label: 'Offline', hex: '#EF4444', seconds: serverDiff };
				}

				// Sleeping overlay: online but screen inactive
				if (baseStatus.status === 'online' && serverClient.isScreenActive === false) {
					return { status: 'sleeping' as const, color: 'bg-slate-400', label: 'Asleep', hex: '#94A3B8', seconds: baseStatus.seconds };
				}
				return baseStatus;
			}
		}

		// Fallback: RxDB heartbeat timestamp
		if (!lastSeenAt) return { status: 'offline' as const, color: 'bg-gray-400', label: 'Unknown', hex: '#9CA3AF', seconds: Infinity };
		const diff = differenceInSeconds(new Date(), parseISO(lastSeenAt));
		if (diff < 45) baseStatus = { status: 'online', color: 'bg-status-green', label: 'Online', hex: '#10B981', seconds: diff };
		else if (diff < 120) baseStatus = { status: 'stale', color: 'bg-amber-400', label: 'Stale', hex: '#F59E0B', seconds: diff };
		else baseStatus = { status: 'offline', color: 'bg-status-red', label: 'Offline', hex: '#EF4444', seconds: diff };

		// Sleeping overlay from RxDB device record
		if (baseStatus.status === 'online' && opts?.isScreenActive === false) {
			return { status: 'sleeping' as const, color: 'bg-slate-400', label: 'Asleep', hex: '#94A3B8', seconds: diff };
		}
		return baseStatus;
	}

	/** Data freshness: how old is the device record's actual data vs just the heartbeat ping */
	function getDataFreshness(dev: any): { label: string; isStale: boolean; isMissing: boolean } {
		now; // reactive dependency
		const hasIp = !!dev.ipAddress;
		const hasDocCount = dev.dbDocCount > 0;
		const hasUpdatedAt = !!dev.updatedAt;

		if (!hasUpdatedAt) return { label: 'No data received', isStale: false, isMissing: true };
		if (!hasIp && !hasDocCount) return { label: 'Waiting for identity...', isStale: false, isMissing: true };

		const dataAge = differenceInSeconds(new Date(), parseISO(dev.updatedAt));
		if (dataAge < 90) return { label: `Data ${dataAge}s ago`, isStale: false, isMissing: !hasIp };
		if (dataAge < 300) return { label: `Data ${Math.floor(dataAge / 60)}m ago`, isStale: true, isMissing: !hasIp };
		return { label: `Data ${Math.floor(dataAge / 60)}m ago`, isStale: true, isMissing: !hasIp };
	}

	// Active nodes: online + stale (for SVG). Offline nodes removed unless server.
	const activeClientNodes = $derived(
		clientNodes.filter(n => {
			const s = getStatusInfo(n.lastSeenAt, nodeStatusOpts(n));
			return s.status !== 'offline';
		})
	);

	// Location colors
	const LOCATION_COLORS: Record<string, string> = {
		'tag': '#EA580C',
		'pgl': '#8B5CF6',
		'wh-tag': '#06B6D4',
		'all': '#6B7280',
		'remote': '#9CA3AF'
	};

	const LOCATION_LABELS: Record<string, string> = {
		'tag': 'Tagbilaran',
		'pgl': 'Panglao',
		'wh-tag': 'Warehouse',
		'all': 'All Locations',
		'remote': 'Remote'
	};

	function getSyncBadge(status: string): { classes: string; label: string } {
		switch(status) {
			case 'local-only': return { classes: 'bg-gray-100 text-gray-600 border border-gray-200', label: 'Local Only' };
			case 'syncing': return { classes: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Syncing' };
			case 'synced': return { classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Synced' };
			case 'error': return { classes: 'bg-red-50 text-red-700 border border-red-200', label: 'Sync Error' };
			default: return { classes: 'bg-gray-100 text-gray-600 border border-gray-200', label: 'Unknown' };
		}
	}

	function getDataModeBadge(mode: string): { label: string; color: string; icon: string } {
		switch (mode) {
			case 'full-rxdb': return { label: 'Full DB', color: 'bg-status-green text-white', icon: '●' };
			case 'selective-rxdb': return { label: 'Selective DB', color: 'bg-blue-500 text-white', icon: '◐' };
			case 'sse-only': return { label: 'SSE Stream', color: 'bg-status-yellow text-black', icon: '⚡' };
			case 'api-fetch': return { label: 'API Fetch', color: 'bg-gray-500 text-white', icon: '↓' };
			default: return { label: 'Unknown', color: 'bg-gray-300 text-gray-600', icon: '?' };
		}
	}

	// ─── Inline editing ─────────────────────────────────────────────────────

	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let editInputRef = $state<HTMLInputElement | null>(null);

	function startEditing(dev: any) {
		editingId = dev.id;
		editingName = dev.name;
		setTimeout(() => editInputRef?.focus(), 0);
	}

	async function saveName(id: string) {
		if (editingId === id) {
			await renameDevice(id, editingName.trim() || 'Unnamed Device');
			editingId = null;
		}
	}

	let isResetting = $state(false);
	async function handleReset() {
		if (!confirm('WARNING: This will wipe ALL data on ALL connected devices. Continue?')) return;
		if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
		isResetting = true;
		try {
			// 1. Tell server to clear its stores + broadcast RESET_ALL to other clients
			// Write-lock is set immediately — stale pushes are silently dropped
			console.log('[Reset] Sending RESET_ALL to server...');
			await fetch('/api/replication/reset', { method: 'POST' });
		} catch (err) {
			console.error('[Reset] Server reset failed:', err);
		}
		// 2. The SSE broadcast listener in replication.ts will call performFullReset()
		//    automatically when it receives the RESET_ALL signal. Give it 1s to arrive.
		//    If the SSE listener already fired (mutex acquired), this is a no-op.
		//    If SSE is disconnected, this is the fallback.
		await new Promise(r => setTimeout(r, 1000));
		console.log('[Reset] Calling performFullReset() as fallback (SSE may have already triggered it)...');
		await performFullReset();
	}

	let isExporting = $state(false);
	async function handleExport() {
		try {
			isExporting = true;
			const { getDb } = await import('$lib/db');
			const db = await getDb();
			const jsonExport = await db.exportJSON();
			const blob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `wtfpos-backup-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('[Backup] Failed to export database', err);
			alert('Failed to export database backup. Check console.');
		} finally {
			isExporting = false;
		}
	}

	// ─── Selected node for detail panel ─────────────────────────────────────

	let selectedNodeIp = $state<string | null>(null);
	const selectedNode = $derived(networkNodes.find(n => n.ipAddress === selectedNodeIp));

	// ─── Edge cases: warnings ───────────────────────────────────────────────

	// Duplicate servers at same REAL location (skip 'all' — it's a virtual aggregate, not a branch)
	const duplicateServerWarning = $derived.by(() => {
		const servers = networkNodes.filter(n => n.isServer);
		if (servers.length > 1) {
			const byLoc = new Map<string, number>();
			for (const s of servers) {
				if (s.locationId === 'all') continue; // owner viewing all branches — not a real location
				byLoc.set(s.locationId, (byLoc.get(s.locationId) || 0) + 1);
			}
			for (const [loc, count] of byLoc) {
				if (count > 1) return loc;
			}
		}
		return null;
	});

	// No server at any location
	const noServerWarning = $derived(!serverNode);

	// Cards view: group by location
	const groupedDevices = $derived(() => {
		const groups: Record<string, typeof deviceList> = {};
		for (const loc of LOCATIONS) {
			groups[loc.id] = [];
		}
		groups['remote'] = [];
		for (const d of filteredDeviceList) {
			if (groups[d.locationId]) {
				groups[d.locationId].push(d);
			} else {
				groups['remote'].push(d);
			}
		}
		return [
			{ id: 'tag', name: 'Alta Citta · Tagbilaran', items: groups['tag'] },
			{ id: 'pgl', name: 'Alona Beach · Panglao', items: groups['pgl'] },
			{ id: 'wh-tag', name: 'Tagbilaran Warehouse', items: groups['wh-tag'] },
			{ id: 'all', name: 'Remote / HQ', items: groups['all'] },
			{ id: 'remote', name: 'Unknown Location', items: groups['remote'] },
		].filter(g => g.items.length > 0);
	});

	// DB Conformity: compare each device against the server node
	function getDbConformity(dev: any): { label: string; hex: string; icon: string } {
		const sNode = serverNode;
		if (!sNode) return { label: 'Unknown', hex: '#9CA3AF', icon: '?' };
		// Find primary session from server node
		const serverPrimary = sNode.sessions[0];
		if (!serverPrimary) return { label: 'Unknown', hex: '#9CA3AF', icon: '?' };
		if (dev.isServer) return { label: 'Source', hex: '#3B82F6', icon: 'S' };

		const serverTs = serverPrimary.dbLastUpdated || '';
		const serverCount = serverPrimary.dbDocCount || 0;
		const devTs = dev.dbLastUpdated || '';
		const devCount = dev.dbDocCount || 0;

		if (!devTs && !serverTs) return { label: 'No Data', hex: '#9CA3AF', icon: '—' };
		if (!devTs) return { label: 'Stale', hex: '#F59E0B', icon: '!' };

		if (devTs === serverTs && devCount === serverCount) {
			return { label: 'Synced', hex: '#10B981', icon: '✓' };
		}
		if (devTs < serverTs || devCount < serverCount) {
			return { label: 'Behind', hex: '#F59E0B', icon: '↓' };
		}
		if (devTs > serverTs || devCount > serverCount) {
			return { label: 'Ahead', hex: '#60A5FA', icon: '↑' };
		}
		return { label: 'Partial', hex: '#F59E0B', icon: '~' };
	}

	// Check if this device's IP is in a given node
	function isCurrentDeviceNode(node: NetworkNode): boolean {
		return node.sessions.some(s => s.id === currentDeviceId);
	}

	/** Build status opts for a network node (IP + current device check) */
	function nodeStatusOpts(node: NetworkNode): { deviceId?: string; ip?: string; isScreenActive?: boolean } {
		// Use the primary session's isScreenActive flag
		const primary = node.sessions[0];
		return {
			deviceId: isCurrentDeviceNode(node) ? currentDeviceId : undefined,
			ip: node.ipAddress,
			isScreenActive: (primary as any)?.isScreenActive,
		};
	}

	/** Build status opts for an individual session/device record */
	function devStatusOpts(dev: { id: string; ipAddress?: string; isScreenActive?: boolean }): { deviceId?: string; ip?: string; isScreenActive?: boolean } {
		return {
			deviceId: dev.id,
			ip: dev.ipAddress || undefined,
			isScreenActive: dev.isScreenActive,
		};
	}

	$effect(() => { now; });
</script>

<div class="flex h-full flex-col gap-6 overflow-auto">
	<!-- Page Header -->
	<div class="flex items-end justify-between border-b border-border pb-4">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-3">
				<h2 class="text-2xl font-black text-gray-900 tracking-tight">Device Monitor</h2>
				<span class="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white">
					{networkNodes.length} {networkNodes.length === 1 ? 'node' : 'nodes'}
				</span>
				<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
					{filteredDeviceList.length} {filteredDeviceList.length === 1 ? 'session' : 'sessions'}
				</span>
			</div>
			<p class="text-sm text-gray-500 font-medium">Network topology grouped by IP — one node per physical machine</p>
		</div>

		<div class="flex items-center gap-3">
			<!-- View Toggle -->
			<div class="flex items-center rounded-lg border border-border bg-white shadow-sm overflow-hidden">
				<button
					onclick={() => viewMode = 'topology'}
					class={cn(
						"flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors",
						viewMode === 'topology' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
					)}
				>
					<Network class="h-3.5 w-3.5" />
					Topology
				</button>
				<button
					onclick={() => viewMode = 'cards'}
					class={cn(
						"flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors",
						viewMode === 'cards' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
					)}
				>
					<LayoutGrid class="h-3.5 w-3.5" />
					Cards
				</button>
			</div>

			<!-- Legend -->
			<div class="flex items-center gap-4 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 shadow-sm">
				<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-status-green"></span>Online</div>
				<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-slate-400"></span>Asleep</div>
				<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>Stale</div>
				<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-status-red"></span>Offline</div>
			</div>
		</div>
	</div>

	<!-- Warnings -->
	{#if noServerWarning}
		<div class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
			<AlertTriangle class="h-5 w-5 text-amber-600 shrink-0" />
			<div>
				<p class="text-sm font-bold text-amber-800">No server detected</p>
				<p class="text-xs text-amber-600">Server auto-detection requires <code class="font-mono bg-amber-100 px-1 rounded">/api/device/identify</code> to be working. If this persists, check the server terminal for errors.</p>
			</div>
		</div>
	{/if}
	{#if duplicateServerWarning}
		<div class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
			<AlertTriangle class="h-5 w-5 text-red-600 shrink-0" />
			<div>
				<p class="text-sm font-bold text-red-800">Multiple servers detected at {LOCATION_LABELS[duplicateServerWarning] || duplicateServerWarning}</p>
				<p class="text-xs text-red-600">Only one machine per location should be running the Node.js build. Check your deployment.</p>
			</div>
		</div>
	{/if}

	<!-- ═══════════════ TOPOLOGY VIEW ═══════════════ -->
	{#if viewMode === 'topology'}
		<div class="flex flex-1 gap-6 min-h-0">
			<!-- SVG Topology Canvas -->
			<div class="flex-1 rounded-2xl border border-border bg-gradient-to-b from-gray-50 to-white p-6 shadow-sm relative overflow-hidden">
				<!-- Subtle grid background -->
				<div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 24px 24px;"></div>

				<svg class="w-full h-full relative" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
					<defs>
						<style>
							@keyframes dashFlow {
								to { stroke-dashoffset: -20; }
							}
							@keyframes dashFlowSlow {
								to { stroke-dashoffset: -20; }
							}
							.line-online {
								animation: dashFlow 1.5s linear infinite;
							}
							.line-stale {
								animation: dashFlowSlow 4.5s linear infinite;
							}
							@keyframes pulse-glow {
								0%, 100% { opacity: 0.4; }
								50% { opacity: 0.8; }
							}
							.server-glow {
								animation: pulse-glow 2s ease-in-out infinite;
							}
						</style>
					</defs>

					<!-- ── Connection Lines (drawn first, behind nodes) ── -->
					{#each activeClientNodes as node, i}
						{@const total = activeClientNodes.length}
						{@const angle = ((i / total) * Math.PI * 0.8) + Math.PI * 0.1}
						{@const radius = 180}
						{@const cx = 400 + Math.cos(angle - Math.PI / 2 + Math.PI) * radius}
						{@const cy = 330 + Math.sin(angle - Math.PI / 2 + Math.PI) * (radius * 0.6)}
						{@const status = getStatusInfo(node.lastSeenAt, nodeStatusOpts(node))}

						<line
							x1="400" y1="100"
							x2={cx} y2={cy}
							stroke={status.status === 'online' ? '#10B981' : status.status === 'sleeping' ? '#94A3B8' : '#F59E0B'}
							stroke-width={status.status === 'online' ? 2 : 1}
							stroke-dasharray={status.status === 'online' ? '6 4' : '3 6'}
							opacity={status.status === 'online' ? 0.6 : status.status === 'sleeping' ? 0.25 : 0.35}
							class={status.status === 'online' ? 'line-online' : status.status === 'sleeping' ? '' : 'line-stale'}
						/>
					{/each}

					<!-- ── Server Node (center top) ── -->
					{#if serverNode}
						{@const serverStatus = getStatusInfo(serverNode.lastSeenAt, nodeStatusOpts(serverNode))}
						{@const isOfflineServer = serverStatus.status === 'offline'}
						<!-- Server glow -->
						<circle cx="400" cy="100" r="48" fill={serverStatus.hex} opacity="0.08" class="server-glow" />
						<circle cx="400" cy="100" r="38" fill={serverStatus.hex} opacity="0.05" />

						<g
							onclick={() => selectedNodeIp = selectedNodeIp === serverNode.ipAddress ? null : serverNode.ipAddress}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedNodeIp = selectedNodeIp === serverNode.ipAddress ? null : serverNode.ipAddress; }}}
							class="cursor-pointer"
							role="button"
							tabindex="0"
						>
							<!-- Server rack shape -->
							<rect x="370" y="72" width="60" height="56" rx="8" fill="white" stroke={isOfflineServer ? '#EF4444' : '#1F2937'} stroke-width={isOfflineServer ? 2.5 : 2} />
							<rect x="370" y="72" width="60" height="56" rx="8" fill="#1F2937" opacity="0.03" />

							<!-- Server rack lines -->
							<line x1="378" y1="86" x2="422" y2="86" stroke="#374151" stroke-width="1.5" stroke-linecap="round" />
							<line x1="378" y1="94" x2="422" y2="94" stroke="#374151" stroke-width="1.5" stroke-linecap="round" />
							<line x1="378" y1="102" x2="422" y2="102" stroke="#374151" stroke-width="1.5" stroke-linecap="round" />

							<!-- LED dots -->
							<circle cx="416" cy="86" r="2" fill={serverStatus.hex} />
							<circle cx="416" cy="94" r="2" fill={serverStatus.hex} />
							<circle cx="416" cy="102" r="2" fill={serverStatus.hex} />

							<!-- Server stand -->
							<rect x="388" y="128" width="24" height="4" rx="2" fill="#9CA3AF" />

							<!-- Status ring -->
							<circle cx="400" cy="100" r="34" fill="none" stroke={serverStatus.hex} stroke-width="2" opacity="0.5" />

							<!-- Offline badge for server -->
							{#if isOfflineServer}
								<rect x="372" y="60" width="56" height="14" rx="7" fill="#EF4444" />
								<text x="400" y="70" text-anchor="middle" class="text-[8px] font-bold fill-white uppercase" style="font-family: Inter, sans-serif;">Offline</text>
							{/if}
						</g>

						<!-- Server label -->
						<text x="400" y="150" text-anchor="middle" class="text-[11px] font-bold fill-gray-900" style="font-family: Inter, sans-serif;">
							{serverNode.ipAddress || 'Server'}
						</text>
						<text x="400" y="163" text-anchor="middle" class="text-[9px] font-semibold fill-accent uppercase tracking-wider" style="font-family: Inter, sans-serif;">
							SERVER{isCurrentDeviceNode(serverNode) ? ' (YOU)' : ''}
						</text>
						<!-- Session count badge -->
						{#if serverNode.sessions.length > 1}
							<g>
								<rect x="432" y="78" width="32" height="16" rx="8" fill="#3B82F6" />
								<text x="448" y="89" text-anchor="middle" class="text-[8px] font-bold fill-white" style="font-family: Inter, sans-serif;">
									{serverNode.sessions.length} tab{serverNode.sessions.length > 1 ? 's' : ''}
								</text>
							</g>
						{/if}
					{/if}

					<!-- ── Active Client Device Nodes (online + stale only) ── -->
					{#each activeClientNodes as node, i}
						{@const total = activeClientNodes.length}
						{@const angle = ((i / total) * Math.PI * 0.8) + Math.PI * 0.1}
						{@const radius = 180}
						{@const cx = 400 + Math.cos(angle - Math.PI / 2 + Math.PI) * radius}
						{@const cy = 330 + Math.sin(angle - Math.PI / 2 + Math.PI) * (radius * 0.6)}
						{@const status = getStatusInfo(node.lastSeenAt, nodeStatusOpts(node))}
						{@const locColor = LOCATION_COLORS[node.locationId] || '#9CA3AF'}
						{@const isSelected = selectedNodeIp === node.ipAddress}
						{@const isSleeping = status.status === 'sleeping'}
						{@const screenFill = isSleeping ? '#1E293B' : '#F3F4F6'}

						<g
							onclick={() => selectedNodeIp = isSelected ? null : node.ipAddress}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedNodeIp = isSelected ? null : node.ipAddress; }}}
							class="cursor-pointer"
							role="button"
							tabindex="0"
						>
							<!-- Selection highlight -->
							{#if isSelected}
								<circle cx={cx} cy={cy} r="36" fill="#EA580C" opacity="0.08" />
								<circle cx={cx} cy={cy} r="36" fill="none" stroke="#EA580C" stroke-width="1.5" opacity="0.4" />
							{/if}

							<!-- Device shape based on type -->
							{#if node.deviceType === 'phone'}
								<rect x={cx - 12} y={cy - 20} width="24" height="40" rx="5" fill="white" stroke={status.hex} stroke-width="2" />
								<rect x={cx - 9} y={cy - 15} width="18" height="26" rx="1" fill={screenFill} />
								<circle cx={cx} cy={cy + 16} r="2.5" fill={status.hex} />
								<circle cx={cx} cy={cy - 17} r="1.5" fill="#D1D5DB" />
							{:else if node.deviceType === 'tablet'}
								<rect x={cx - 24} y={cy - 16} width="48" height="32" rx="5" fill="white" stroke={status.hex} stroke-width="2" />
								<rect x={cx - 20} y={cy - 12} width="40" height="24" rx="1" fill={screenFill} />
								<circle cx={cx + 20} cy={cy} r="2" fill={status.hex} />
								<circle cx={cx - 22} cy={cy} r="1.5" fill="#D1D5DB" />
							{:else}
								<rect x={cx - 22} y={cy - 16} width="44" height="28" rx="3" fill="white" stroke={status.hex} stroke-width="2" />
								<rect x={cx - 18} y={cy - 12} width="36" height="20" rx="1" fill={screenFill} />
								<path d="M {cx - 26} {cy + 14} L {cx - 22} {cy + 12} L {cx + 22} {cy + 12} L {cx + 26} {cy + 14} Z" fill="white" stroke={status.hex} stroke-width="1.5" />
								<circle cx={cx} cy={cy - 14} r="1.5" fill="#D1D5DB" />
							{/if}

							<!-- Moon/Z overlay for sleeping devices -->
							{#if isSleeping}
								<text x={cx} y={cy + 2} text-anchor="middle" dominant-baseline="middle" class="text-[10px] font-bold" fill="#CBD5E1" style="font-family: Inter, sans-serif;">z</text>
							{/if}

							<!-- Status dot (top-right) -->
							<circle cx={cx + (node.deviceType === 'tablet' ? 22 : node.deviceType === 'phone' ? 10 : 20)} cy={cy - (node.deviceType === 'phone' ? 18 : 14)} r="4" fill="white" />
							<circle cx={cx + (node.deviceType === 'tablet' ? 22 : node.deviceType === 'phone' ? 10 : 20)} cy={cy - (node.deviceType === 'phone' ? 18 : 14)} r="3" fill={status.hex} />

							<!-- Session count badge -->
							{#if node.sessions.length > 1}
								<rect x={cx - 16} y={cy - (node.deviceType === 'phone' ? 28 : 24)} width="32" height="14" rx="7" fill="#3B82F6" />
								<text x={cx} y={cy - (node.deviceType === 'phone' ? 18 : 14)} text-anchor="middle" class="text-[7px] font-bold fill-white" style="font-family: Inter, sans-serif;">
									{node.sessions.length} sessions
								</text>
							{/if}

							<!-- Location color bar -->
							<rect x={cx - 10} y={cy + (node.deviceType === 'phone' ? 24 : 18)} width="20" height="3" rx="1.5" fill={locColor} opacity="0.7" />

							<!-- IP address label -->
							<text x={cx} y={cy + (node.deviceType === 'phone' ? 36 : 30)} text-anchor="middle" class="text-[9px] font-bold fill-gray-700" style="font-family: Inter, sans-serif;">
								{node.ipAddress.length > 15 ? node.ipAddress.substring(0, 13) + '..' : node.ipAddress}
							</text>
							<!-- Primary user -->
							<text x={cx} y={cy + (node.deviceType === 'phone' ? 46 : 40)} text-anchor="middle" class="text-[8px] font-bold uppercase tracking-wider" style="font-family: Inter, sans-serif;" fill="#EA580C">
								{node.sessions[0]?.userName || '—'}
							</text>
							<!-- Location label -->
							<text x={cx} y={cy + (node.deviceType === 'phone' ? 55 : 49)} text-anchor="middle" class="text-[7px] font-medium fill-gray-400 uppercase tracking-wider" style="font-family: Inter, sans-serif;">
								{LOCATION_LABELS[node.locationId] || node.locationId}
							</text>

							<!-- "YOU" indicator -->
							{#if isCurrentDeviceNode(node)}
								<text x={cx} y={cy + (node.deviceType === 'phone' ? 63 : 57)} text-anchor="middle" class="text-[7px] font-black fill-accent uppercase" style="font-family: Inter, sans-serif;">YOU</text>
							{/if}
						</g>
					{/each}

					<!-- Empty state -->
					{#if activeClientNodes.length === 0 && !serverNode}
						<text x="400" y="250" text-anchor="middle" class="text-sm fill-gray-400" style="font-family: Inter, sans-serif;">No devices registered</text>
					{:else if activeClientNodes.length === 0}
						<text x="400" y="300" text-anchor="middle" class="text-[11px] fill-gray-400" style="font-family: Inter, sans-serif;">No other devices connected</text>
						<text x="400" y="316" text-anchor="middle" class="text-[9px] fill-gray-300" style="font-family: Inter, sans-serif;">Open the app on another device to see it here</text>
					{/if}
				</svg>
			</div>

			<!-- Device Detail Panel (right side) -->
			<div class="w-72 shrink-0">
				{#if selectedNode}
					{@const status = getStatusInfo(selectedNode.lastSeenAt, nodeStatusOpts(selectedNode))}
					{@const locColor = LOCATION_COLORS[selectedNode.locationId] || '#9CA3AF'}
					{@const primarySession = selectedNode.sessions[0]}
					{@const freshness = primarySession ? getDataFreshness(primarySession) : null}

					<div class="rounded-2xl border border-border bg-white p-5 shadow-sm flex flex-col gap-4">
						<!-- Node header -->
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl" style="background-color: {locColor}15;">
								{#if selectedNode.isServer}
									<Network class="h-5 w-5" style="color: {locColor};" />
								{:else if selectedNode.deviceType === 'phone'}
									<Smartphone class="h-5 w-5" style="color: {locColor};" />
								{:else if selectedNode.deviceType === 'tablet'}
									<Tablet class="h-5 w-5" style="color: {locColor};" />
								{:else}
									<Monitor class="h-5 w-5" style="color: {locColor};" />
								{/if}
							</div>
							<div class="flex flex-col min-w-0">
								<span class="truncate font-bold text-gray-900 text-sm">{selectedNode.ipAddress}</span>
								<div class="flex items-center gap-1.5 flex-wrap">
									<span class="relative flex h-2 w-2">
										{#if status.label === 'Online'}
											<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style="background-color: {status.hex};"></span>
										{/if}
										<span class="relative inline-flex h-2 w-2 rounded-full" style="background-color: {status.hex};"></span>
									</span>
									<span class="text-[10px] font-semibold uppercase tracking-wide" style="color: {status.hex};">{status.label}</span>
									{#if isCurrentDeviceNode(selectedNode)}
										<span class="rounded bg-accent/10 px-1 text-[8px] font-black text-accent uppercase">YOU</span>
									{/if}
									{#if selectedNode.isServer}
										<span class="rounded bg-blue-100 px-1 text-[8px] font-black text-blue-700 uppercase">SERVER</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Server auto-detect info -->
						{#if selectedNode.isServer}
							<div class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
								<span class="text-xs font-bold text-blue-700">Auto-detected Server</span>
								<p class="text-[10px] text-blue-500 mt-0.5">Detected via IP — this machine runs the Node.js build</p>
							</div>
						{/if}

						<!-- Data freshness banner -->
						{#if freshness?.isMissing}
							<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
								<span class="text-[10px] font-bold text-amber-700">{freshness.label}</span>
								<p class="text-[9px] text-amber-500 mt-0.5">
									{#if !primarySession?.ipAddress}
										IP not yet detected — identity endpoint may be unavailable
									{:else}
										Some fields may be outdated
									{/if}
								</p>
							</div>
						{:else if freshness?.isStale}
							<div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
								<span class="text-[10px] font-bold text-gray-500">{freshness.label}</span>
								<p class="text-[9px] text-gray-400 mt-0.5">Data may not reflect current state</p>
							</div>
						{/if}

						<!-- Detail rows -->
						<div class="flex flex-col gap-3 text-xs">
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">IP Address</span>
								{#if selectedNode.ipAddress && !selectedNode.ipAddress.startsWith('dev-')}
									<span class="font-mono font-medium text-gray-900">{selectedNode.ipAddress}</span>
								{:else}
									<span class="font-mono font-medium text-amber-500 italic">Pending...</span>
								{/if}
							</div>
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Location</span>
								<span class="font-medium text-gray-900">{LOCATION_LABELS[selectedNode.locationId] || selectedNode.locationId}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Device Type</span>
								<span class="font-medium text-gray-700 capitalize">{selectedNode.deviceType}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Data Mode</span>
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {getDataModeBadge(selectedNode.dataMode || 'full-rxdb').color}">
									{getDataModeBadge(selectedNode.dataMode || 'full-rxdb').icon} {getDataModeBadge(selectedNode.dataMode || 'full-rxdb').label}
								</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Sync Status</span>
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {getSyncBadge((primarySession)?.syncStatus || 'local-only').classes}">
									{getSyncBadge((primarySession)?.syncStatus || 'local-only').label}
								</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Last Heartbeat</span>
								<span class="font-medium text-gray-700">
									{#if selectedNode.lastSeenAt}
										{formatDistanceToNow(parseISO(selectedNode.lastSeenAt), { addSuffix: true })}
									{:else}
										Never
									{/if}
								</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Data Freshness</span>
								<span class={cn("font-medium", freshness?.isStale ? 'text-amber-500' : 'text-gray-700')}>
									{freshness?.label || '—'}
								</span>
							</div>
							{#if status.status === 'sleeping'}
								<div class="flex justify-between items-center">
									<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Screen</span>
									<span class="flex items-center gap-1 font-medium text-slate-500">
										<Moon class="h-3 w-3" />
										Off
									</span>
								</div>
							{/if}
						</div>

						<!-- Sessions list -->
						<div class="rounded-xl border border-border bg-gray-50 p-3 flex flex-col gap-2">
							<div class="flex items-center justify-between">
								<span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
									<Users class="h-3 w-3" />
									Active Sessions
								</span>
								<span class="text-[10px] font-bold text-gray-500">{selectedNode.sessions.length}</span>
							</div>
							<div class="flex flex-col gap-1.5">
								{#each selectedNode.sessions as sess}
									{@const sessStatus = getStatusInfo(sess.lastSeenAt, devStatusOpts(sess))}
									<div class="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-border/50">
										<div class="flex items-center gap-2 min-w-0">
											<span class="relative flex h-2 w-2 shrink-0">
												<span class="relative inline-flex h-2 w-2 rounded-full" style="background-color: {sessStatus.hex};"></span>
											</span>
											<span class="text-[11px] font-medium text-gray-900 truncate">{sess.userName || 'Unknown'}</span>
										</div>
										<span class="text-[9px] font-semibold uppercase text-gray-400 shrink-0 ml-2">{sess.role || '—'}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Cloud sync placeholder (server nodes only) -->
						{#if selectedNode.isServer}
							<div class="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-3 flex flex-col gap-2">
								<div class="flex items-center justify-between">
									<span class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Cloud Sync</span>
									<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/50 text-blue-400">
										Phase 2
									</span>
								</div>
								<p class="text-[9px] text-blue-300 leading-relaxed">
									Cloud backup to Neon PostgreSQL will sync this server's data for cross-branch analytics and disaster recovery.
								</p>
							</div>
						{/if}

						<!-- IP footer -->
						<div class="text-[9px] text-gray-300 font-mono border-t border-border/50 pt-2 truncate" title={selectedNode.ipAddress}>
							IP: {selectedNode.ipAddress} · {selectedNode.sessions.length} session{selectedNode.sessions.length !== 1 ? 's' : ''}
						</div>
					</div>
				{:else}
					<div class="rounded-2xl border-2 border-dashed border-border bg-gray-50/50 p-8 flex flex-col items-center justify-center gap-2 text-center">
						<div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
							<Network class="h-5 w-5 text-gray-400" />
						</div>
						<p class="text-sm font-medium text-gray-500">Select a node</p>
						<p class="text-xs text-gray-400">Click any node in the topology to view its sessions and details</p>
					</div>
				{/if}

				<!-- Location Legend -->
				<div class="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm">
					<h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Branches</h4>
					<div class="flex flex-col gap-2">
						{#each Object.entries(LOCATION_LABELS) as [id, label]}
							{@const count = networkNodes.filter(n => n.locationId === id).length}
							{#if count > 0}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="h-2.5 w-2.5 rounded-full" style="background-color: {LOCATION_COLORS[id]};"></span>
										<span class="text-xs font-medium text-gray-700">{label}</span>
									</div>
									<span class="text-[10px] font-bold text-gray-400">{count}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</div>

	<!-- ═══════════════ CARDS VIEW ═══════════════ -->
	{:else}
		<div class="flex flex-col gap-8">
			{#each groupedDevices() as group (group.id)}
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide pl-1">{group.name}</h3>

					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{#each group.items as dev (dev.id)}
							{@const status = getStatusInfo(dev.lastSeenAt, devStatusOpts(dev))}
							{@const devFreshness = getDataFreshness(dev)}

							<div class={cn(
								"flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all relative overflow-hidden",
								dev.id === currentDeviceId ? "border-accent ring-1 ring-accent/30 shadow-md" : "border-border"
							)}>
								<div class="absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-10 {status.color}"></div>

								<div class="flex items-start justify-between z-10">
									<div class="flex items-center gap-2 max-w-full">
										<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
											{#if dev.deviceType === 'phone'}
												<Smartphone class="h-4 w-4 text-gray-500" />
											{:else if dev.deviceType === 'tablet'}
												<Tablet class="h-4 w-4 text-gray-500" />
											{:else}
												<Monitor class="h-4 w-4 text-gray-500" />
											{/if}
										</div>

										<span class="relative flex h-3 w-3 shrink-0">
											{#if status.label === 'Online'}
												<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 {status.color}"></span>
											{/if}
											<span class="relative inline-flex h-3 w-3 rounded-full {status.color}"></span>
										</span>
										{#if status.status === "sleeping"}
											<Moon class="h-3 w-3 shrink-0 text-slate-400" />
										{/if}

										{#if editingId === dev.id}
											<input
												bind:this={editInputRef}
												type="text"
												bind:value={editingName}
												class="pos-input text-sm h-7 py-0 px-2 font-bold w-32 border-accent"
												onblur={() => saveName(dev.id)}
												onkeydown={(e) => {
													if (e.key === 'Enter') saveName(dev.id);
													if (e.key === 'Escape') editingId = null;
												}}
											/>
										{:else}
											<button
												class="truncate font-bold text-gray-900 text-sm hover:bg-gray-100 px-1 -ml-1 rounded transition-colors text-left"
												onclick={() => startEditing(dev)}
												title="Click to rename"
											>
												{dev.name}
											</button>
										{/if}

										{#if dev.id === currentDeviceId}
											<span class="shrink-0 rounded bg-accent/10 px-1.5 py-0 text-[9px] font-black text-accent uppercase tracking-wider scale-[0.85] origin-left">YOU</span>
										{/if}
									</div>

									{#if status.status === 'offline' && dev.id !== currentDeviceId}
										<button
											class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-status-red transition-colors"
											title="Remove this device"
											onclick={async () => { await removeDevice(dev.id); }}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									{/if}
								</div>

								{#if devFreshness.isMissing}
									<div class="flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 z-10">
										<span class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
										<span class="text-[10px] font-semibold text-amber-600">{devFreshness.label}</span>
									</div>
								{/if}

								<div class="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-2 text-xs z-10 mt-1">
									<div class="flex flex-col gap-0.5">
										<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">User & Role</span>
										<span class="font-medium text-gray-900 truncate">{dev.userName || '—'} <span class="text-gray-400 font-normal">({dev.role || '—'})</span></span>
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">IP Address</span>
										{#if dev.ipAddress}
											<span class="font-mono text-gray-700">{dev.ipAddress}</span>
										{:else}
											<span class="font-mono text-amber-500 italic text-[10px]">Pending...</span>
										{/if}
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Last Heartbeat</span>
										<span class="font-medium text-gray-700">
											{#if dev.lastSeenAt}
												{formatDistanceToNow(parseISO(dev.lastSeenAt), { addSuffix: true })}
											{:else}
												Never
											{/if}
										</span>
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Data Age</span>
										<span class={cn("font-medium text-[10px]", devFreshness.isStale ? 'text-amber-500' : 'text-gray-500')}>
											{devFreshness.label}
										</span>
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Data Mode</span>
										<span class="px-2 py-0.5 rounded-full text-xs font-medium {getDataModeBadge(dev.dataMode || 'full-rxdb').color} w-fit">
											{getDataModeBadge(dev.dataMode || 'full-rxdb').icon} {getDataModeBadge(dev.dataMode || 'full-rxdb').label}
										</span>
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Sync Status</span>
										<span class="px-2 py-0.5 rounded-full text-xs font-medium {getSyncBadge(dev.syncStatus || 'local-only').classes} w-fit">
											{getSyncBadge(dev.syncStatus || 'local-only').label}
										</span>
									</div>
								</div>

								<div class="mt-2 text-[10px] text-gray-300 font-mono flex items-center justify-between border-t border-border/50 pt-2 z-10">
									<span class="truncate pr-2">{dev.deviceType} · {dev.screenWidth}px</span>
									<span class="uppercase tracking-wider">ID: {dev.id.substring(0,8)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			{#if filteredDeviceList.length === 0}
				<div class="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-gray-50/50">
					<p class="text-sm font-medium text-gray-500">No devices registered yet.</p>
					<p class="text-xs text-gray-400 mt-1">Heartbeat initialization may be pending.</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Database Info Footer -->
	<div class="mt-8 mb-4 border-t border-border pt-6 flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest">Database Infrastructure</h3>
			<div class="flex items-center gap-2">
				<button
					onclick={async () => { await pruneStaleDevices(); }}
					class="rounded-lg border border-border bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors flex gap-2 items-center"
				>
					<Trash2 class="h-3.5 w-3.5" />
					Remove Offline Devices
				</button>
				<button
					onclick={handleExport}
					disabled={isExporting}
					class="rounded-lg border border-border bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors disabled:opacity-50 flex gap-2 items-center"
				>
					{@html `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`}
					{isExporting ? 'Exporting...' : 'Export Backup'}
				</button>
				<button
					onclick={handleReset}
					disabled={isResetting}
					class="rounded-lg border border-status-red/30 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-status-red transition-colors disabled:opacity-50"
				>
					{isResetting ? 'Resetting...' : 'Reset All Devices & Database'}
				</button>
			</div>
		</div>
		<div class="inline-flex w-fit items-center gap-6 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
			<div class="flex flex-col">
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Storage Engine</span>
				<span class="text-sm font-semibold text-gray-900 mt-0.5">RxDB + Dexie</span>
			</div>
			<div class="h-8 w-px bg-border"></div>
			<div class="flex flex-col">
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Server Detection</span>
				<span class="text-sm font-semibold text-gray-900 mt-0.5">Auto (IP-based)</span>
			</div>
			<div class="h-8 w-px bg-border"></div>
			<div class="flex flex-col">
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Build Date</span>
				<span class="font-mono text-sm text-gray-600 mt-0.5">{BUILD_DATE || 'Unknown'}</span>
			</div>
		</div>
	</div>
</div>
