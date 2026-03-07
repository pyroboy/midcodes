<script lang="ts">
	import { devices, renameDevice, getCurrentDeviceId } from '$lib/stores/device.svelte';
	import { LOCATIONS } from '$lib/stores/session.svelte';
	import { resetDatabase } from '$lib/db';
	import { cn } from '$lib/utils';
	import { formatDistanceToNow, differenceInSeconds, parseISO } from 'date-fns';
	import { APP_VERSION, BUILD_DATE } from '$lib/version';
	import { onMount } from 'svelte';

	// Auto-refresh absolute dates every minute for relative freshness
	let now = $state(new Date());
	onMount(() => {
		const interval = setInterval(() => { now = new Date(); }, 30000);
		return () => clearInterval(interval);
	});

	let currentDeviceId = $state('');
	onMount(() => {
		currentDeviceId = getCurrentDeviceId();
	});

	const deviceList = $derived(devices.value || []);

	// Group devices by location
	const groupedDevices = $derived(() => {
		const groups: Record<string, typeof deviceList> = {};
		
		for (const loc of LOCATIONS) {
			groups[loc.id] = [];
		}
		groups['remote'] = [];

		for (const d of deviceList) {
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

	// Status helpers
	function getStatusInfo(lastSeenAt: string | undefined) {
		// Use 'now' to force reactivity every 30s
		now; 
		if (!lastSeenAt) return { color: 'bg-gray-400', label: 'Unknown' };
		const diff = differenceInSeconds(new Date(), parseISO(lastSeenAt));
		if (diff < 60) return { color: 'bg-status-green', label: 'Online' };
		if (diff < 300) return { color: 'bg-amber-400', label: 'Stale' };
		return { color: 'bg-status-red', label: 'Offline' };
	}

	function getSyncBadge(status: string) {
		switch(status) {
			case 'local-only': return 'bg-gray-100 text-gray-600 border-gray-200';
			case 'syncing': return 'bg-blue-50 text-blue-700 border-blue-200';
			case 'synced': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
			case 'error': return 'bg-status-red-light text-status-red border-status-red/20';
			default: return 'bg-gray-100 text-gray-600 border-gray-200';
		}
	}

	// Inline editing
	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let editInputRef = $state<HTMLInputElement | null>(null);

	function startEditing(dev: any) {
		editingId = dev.id;
		editingName = dev.name;
		// Focus next tick
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
		if (confirm('⚠️ WARNING: This will completely wipe all data on this device and re-seed with mock data. Are you sure?')) {
			isResetting = true;
			await resetDatabase();
		}
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

	$effect(() => {
		// Just referencing to track reactivity 
		now;
	});
</script>

<div class="flex flex-col gap-6">
	<!-- Page Header & Legend -->
	<div class="flex items-end justify-between border-b border-border pb-4">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-3">
				<h2 class="text-2xl font-black text-gray-900 tracking-tight">Device Monitor</h2>
				<span class="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white">
					{deviceList.length} total
				</span>
			</div>
			<p class="text-sm text-gray-500 font-medium">Real-time status of all POS tablets and phones across branches</p>
		</div>
		
		<!-- Legend -->
		<div class="flex items-center gap-4 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 shadow-sm">
			<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-status-green"></span>Online (&lt;1m)</div>
			<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>Stale (&lt;5m)</div>
			<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-status-red"></span>Offline</div>
		</div>
	</div>

	<!-- Topology Groups -->
	<div class="flex flex-col gap-8">
		{#each groupedDevices() as group (group.id)}
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide pl-1">{group.name}</h3>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{#each group.items as dev (dev.id)}
						{@const status = getStatusInfo(dev.lastSeenAt)}
						
						<div class={cn(
							"flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all relative overflow-hidden",
							dev.id === currentDeviceId ? "border-accent ring-1 ring-accent/30 shadow-md" : "border-border"
						)}>
							<!-- Status Indicator Corner Bubble -->
							<div class="absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-10 {status.color}"></div>

							<!-- Top Row: Status Dot + Name -->
							<div class="flex items-start justify-between z-10">
								<div class="flex items-center gap-2 max-w-full">
									<span class="relative flex h-3 w-3 shrink-0">
										{#if status.label === 'Online'}
											<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 {status.color}"></span>
										{/if}
										<span class="relative inline-flex h-3 w-3 rounded-full {status.color}"></span>
									</span>
									
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
										<span class="shrink-0 rounded bg-accent/10 px-1.5 py-0text-[9px] font-black text-accent uppercase tracking-wider scale-[0.85] origin-left">YOU</span>
									{/if}
								</div>
							</div>

							<!-- Details Grid -->
							<div class="grid grid-cols-2 gap-y-3 gap-x-2 text-xs z-10 mt-1">
								<div class="flex flex-col gap-0.5">
									<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">User & Role</span>
									<span class="font-medium text-gray-900 truncate">{dev.userName || '—'} <span class="text-gray-400 font-normal">({dev.role || '—'})</span></span>
								</div>
								
								<div class="flex flex-col gap-0.5">
									<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">App Version</span>
									<span class="font-mono text-gray-700">{dev.appVersion || APP_VERSION}</span>
								</div>

								<div class="flex flex-col gap-0.5">
									<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Last Seen</span>
									<span class="font-medium text-gray-700">
										{#if dev.lastSeenAt}
											{formatDistanceToNow(parseISO(dev.lastSeenAt), { addSuffix: true })}
										{:else}
											Never
										{/if}
									</span>
								</div>

								<div class="flex flex-col gap-0.5">
									<span class="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Sync State</span>
									<span class={cn("inline-flex self-start rounded border px-1.5 py-0 text-[10px] font-bold leading-relaxed", getSyncBadge(dev.syncStatus))}>
										{dev.syncStatus === 'local-only' ? 'Local Only' : dev.syncStatus.toUpperCase()}
									</span>
								</div>
							</div>

							<!-- Footer metadata (hidden slightly) -->
							<div class="mt-2 text-[10px] text-gray-300 font-mono flex items-center justify-between border-t border-border/50 pt-2 z-10">
								<span class="truncate pr-2" title={dev.userAgent}>{dev.deviceType} • {dev.screenWidth}px</span>
								<span class="uppercase tracking-wider">ID: {dev.id.substring(0,8)}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}

		{#if deviceList.length === 0}
			<div class="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-gray-50/50">
				<p class="text-sm font-medium text-gray-500">No devices registered yet.</p>
				<p class="text-xs text-gray-400 mt-1">Heartbeat initialization may be pending.</p>
			</div>
		{/if}
	</div>

	<!-- Database Info Footer -->
	<div class="mt-8 mb-4 border-t border-border pt-6 flex flex-col gap-3">
		<div class="flex items-center justify-between items-start">
			<h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest">Database Infrastructure</h3>
			<div class="flex items-center gap-2">
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
					class="rounded-lg border border-status-red/30 bg-status-red-light/50 hover:bg-status-red-light px-3 py-1.5 text-xs font-bold text-status-red transition-colors disabled:opacity-50"
				>
					{isResetting ? 'Resetting...' : '⚠️ Reset Database (Seed)'}
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
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sync Topology</span>
				<span class="text-sm font-semibold text-gray-900 mt-0.5">P2P Ready <span class="text-gray-400 font-normal">(v0 schema)</span></span>
			</div>
			<div class="h-8 w-px bg-border"></div>
			<div class="flex flex-col">
				<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Build Date</span>
				<span class="font-mono text-sm text-gray-600 mt-0.5">{BUILD_DATE || 'Unknown'}</span>
			</div>
		</div>
	</div>
</div>
