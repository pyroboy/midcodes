<script lang="ts">
	import { preloadStates, PRELOAD_ROUTES, type RoutePreloadState } from '$lib/services/preloadService';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	let states = $state<Map<string, RoutePreloadState>>(new Map());
	let isMinimized = $state(false);

	$effect(() => {
		const unsubscribe = preloadStates.subscribe((value) => {
			states = value;
		});
		return unsubscribe;
	});

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'loading': return '⏳';
			case 'ready': return '✅';
			case 'idle': return '⬜';
			default: return '❓';
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'loading': return 'text-yellow-500';
			case 'ready': return 'text-green-500';
			case 'idle': return 'text-muted-foreground opacity-30';
			default: return 'text-muted-foreground';
		}
	}
	
	function isCurrent(route: string): boolean {
		return $page.url.pathname === route;
	}
</script>

<div class="fixed top-24 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg text-xs w-64 shadow-xl">
	<button
		onclick={() => isMinimized = !isMinimized}
		class="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50 rounded-t-lg transition-colors"
	>
		<span class="font-semibold flex items-center gap-2">
			🚀 Preload System
			{#if !isMinimized}
				<span class="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] border border-blue-500/20">Two-Tier</span>
			{/if}
		</span>
		<span class="text-muted-foreground">{isMinimized ? '▼' : '▲'}</span>
	</button>
	
	{#if !isMinimized}
		<div class="px-3 pb-3 pt-2 border-t border-border">
			
			<!-- Header -->
			<div class="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider px-1">
				<span>Route</span>
				<span class="w-12 text-center">Data</span>
				<span class="w-12 text-center">Assets</span>
			</div>

			<!-- Rows -->
			<div class="space-y-1">
				{#each PRELOAD_ROUTES as route}
					{@const state = states.get(route)}
					<div class="grid grid-cols-[1fr_auto_auto] gap-2 items-center p-1.5 rounded-md {isCurrent(route) ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'} transition-colors">
						
						<!-- Route Name -->
						<div class="flex items-center gap-1.5 min-w-0">
							{#if isCurrent(route)}
								<div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
							{/if}
							<span class="font-mono truncate {isCurrent(route) ? 'text-primary font-bold' : ''}">{route}</span>
						</div>
						
						<!-- Data/Skeleton Status -->
						<div class="w-12 flex justify-center">
							<span class="{getStatusColor(state?.skeleton || 'idle')} text-xs" title="Skeleton: {state?.skeleton}">
								{getStatusIcon(state?.skeleton || 'idle')}
							</span>
						</div>
						
						<!-- Assets Status -->
						<div class="w-12 flex justify-center">
							<span class="{getStatusColor(state?.assets || 'idle')} text-xs" title="Assets: {state?.assets}">
								{getStatusIcon(state?.assets || 'idle')}
							</span>
						</div>
					</div>
				{/each}
			</div>
			
			<!-- Footer Info -->
			<div class="mt-3 pt-2 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground">
				<span class="flex items-center gap-1">
					Storage: 
					{#if browser && sessionStorage.getItem('idgen_preload_state')}
						<span class="text-green-500">Persistent</span>
					{:else}
						<span class="text-yellow-500">New Session</span>
					{/if}
				</span>
				<span>{PRELOAD_ROUTES.filter(r => states.get(r)?.skeleton === 'ready').length}/{PRELOAD_ROUTES.length} Ready</span>
			</div>
		</div>
	{/if}
</div>
