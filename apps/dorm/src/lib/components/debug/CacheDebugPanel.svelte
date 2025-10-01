<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Database, CheckCircle2, XCircle, Clock, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { cache, cacheKeys } from '$lib/services/cache';

	interface CacheItem {
		label: string;
		cacheKey: string;
		cached: boolean;
		expiresIn?: number;
		justUpdated?: boolean;
	}

	// Live cache status - updated via browser events
	let cacheItems = $state<CacheItem[]>([]);
	let lastUpdate = $state<Date | null>(null);
	let lastEventKey = $state<string>('');
	let updatePulse = $state(false);
	let countdownInterval: ReturnType<typeof setInterval> | undefined;
	let isCollapsed = $state(false);

	// Map cache keys to display labels
	// Note: Payments page is not used in production, so it's excluded from monitoring
	const cacheKeyMap = [
		{ label: 'Tenants', key: cacheKeys.tenants() },
		{ label: 'Properties', key: cacheKeys.activeProperties() },
		{ label: 'Leases', key: cacheKeys.leasesCore() },
		{ label: 'Transactions', key: cacheKeys.transactions('default') },
		{ label: 'Rental Units', key: cacheKeys.rentalUnits() },
		{ label: 'Meters', key: cacheKeys.meters() },
		{ label: 'Readings', key: cacheKeys.readings() },
		{ label: 'Utility Billings', key: cacheKeys.utilityBillings() }
	];

	// Statistics
	let totalEvents = $state(0);
	let cacheHitRate = $state(0);

	// Update cache status from actual cache
	function updateCacheStatus() {
		const detailedStatus = cache.getDetailedStatus();
		const previousItems = [...cacheItems];
		const stats = cache.getStats();

		cacheItems = cacheKeyMap.map(item => {
			const status = detailedStatus[item.key];
			const previousItem = previousItems.find(p => p.cacheKey === item.key);

			return {
				label: item.label,
				cacheKey: item.key,
				cached: status?.cached || false,
				expiresIn: status?.expiresIn,
				justUpdated: previousItem ? previousItem.cached !== (status?.cached || false) : false
			};
		});

		// Update statistics
		const cachedCount = cacheItems.filter(item => item.cached).length;
		cacheHitRate = cacheItems.length > 0 ? (cachedCount / cacheItems.length) * 100 : 0;

		lastUpdate = new Date();
		updatePulse = true;
		setTimeout(() => {
			updatePulse = false;
			// Clear justUpdated flags
			cacheItems = cacheItems.map(item => ({ ...item, justUpdated: false }));
		}, 500);

		console.log('🔄 [CacheDebugPanel] Updated cache status', {
			cached: cachedCount,
			total: cacheItems.length,
			hitRate: `${cacheHitRate.toFixed(0)}%`
		});
	}

	// Update countdown timers without re-fetching cache data
	function updateCountdowns() {
		cacheItems = cacheItems.map(item => {
			if (item.expiresIn && item.expiresIn > 0) {
				return {
					...item,
					expiresIn: Math.max(0, item.expiresIn - 1000) // Subtract 1 second
				};
			}
			return item;
		});
	}

	// Manual refresh
	function manualRefresh() {
		console.log('🔄 [CacheDebugPanel] Manual refresh triggered');
		updateCacheStatus();
	}

	onMount(() => {
		console.log('🎯 [CacheDebugPanel] Component mounted');

		// Initial update
		updateCacheStatus();

		// Listen for cache events (event-driven, no polling!)
		const handleCacheUpdate = (event: Event) => {
			const customEvent = event as CustomEvent;
			const key = customEvent.detail?.key || 'unknown';

			totalEvents++;
			lastEventKey = key;

			console.log('🔔 [CacheDebugPanel] Received cache event', {
				key,
				timestamp: customEvent.detail?.timestamp,
				totalEvents
			});

			updateCacheStatus();
		};

		window.addEventListener('cache-updated', handleCacheUpdate);

		// Start countdown timer (updates display every second)
		countdownInterval = setInterval(() => {
			updateCountdowns();
		}, 1000);

		return () => {
			window.removeEventListener('cache-updated', handleCacheUpdate);
			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
		};
	});

	// Helper to format expiry time
	function formatExpiresIn(ms: number | undefined): string {
		if (!ms || ms <= 0) return 'expired';

		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);

		if (minutes > 0) {
			const remainingSeconds = seconds % 60;
			return `${minutes}m ${remainingSeconds}s`;
		}
		return `${seconds}s`;
	}

	// Format time
	function formatTime(date: Date | null) {
		if (!date) return 'Never';
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<div class="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-80 transition-all duration-300 {updatePulse ? 'shadow-xl border-blue-400' : ''}">
	<!-- Header - Always visible -->
	<div class="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
		<Database class="w-4 h-4 text-blue-600 {updatePulse ? 'animate-pulse' : ''}" />
		<h3 class="text-sm font-semibold text-gray-900">Cache Status</h3>
		{#if updatePulse}
			<Zap class="w-3 h-3 text-amber-500 animate-pulse" />
		{/if}
		<Badge variant="outline" class="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
			Live
		</Badge>
		<Button
			variant="ghost"
			size="icon"
			class="h-6 w-6 hover:bg-gray-200"
			onclick={manualRefresh}
		>
			<RefreshCw class="w-3 h-3 text-gray-600" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="h-6 w-6 hover:bg-gray-200"
			onclick={() => isCollapsed = !isCollapsed}
		>
			{#if isCollapsed}
				<ChevronUp class="w-3 h-3 text-gray-600" />
			{:else}
				<ChevronDown class="w-3 h-3 text-gray-600" />
			{/if}
		</Button>
	</div>

	{#if !isCollapsed}
		<!-- Statistics -->
		<div class="m-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs space-y-1">
			<div class="flex justify-between">
				<span class="text-gray-600">Hit Rate:</span>
				<span class="font-mono text-green-600 font-semibold">{cacheHitRate.toFixed(0)}%</span>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-600">Events:</span>
				<span class="font-mono text-blue-600 font-semibold">{totalEvents}</span>
			</div>
			{#if lastEventKey}
				<div class="flex justify-between">
					<span class="text-gray-600">Last Event:</span>
					<span class="font-mono text-amber-600 text-[10px] truncate max-w-[150px]">{lastEventKey}</span>
				</div>
			{/if}
		</div>

		<!-- Cache Items -->
		<div class="space-y-1.5 text-xs max-h-96 overflow-y-auto px-3 pb-3">
			{#each cacheItems as item}
				{@const Icon = item.cached ? CheckCircle2 : XCircle}
				{@const statusClass = item.cached ? 'text-green-600' : 'text-orange-500'}
				{@const bgClass = item.cached ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}
				{@const expiryText = formatExpiresIn(item.expiresIn)}
				<div
					class="flex items-center justify-between py-2 px-2 border rounded transition-all duration-300 {bgClass} {item.justUpdated && updatePulse ? 'bg-blue-100 border-blue-300 scale-105' : ''}"
					title={item.cacheKey}
				>
					<span class="text-gray-700 font-medium">{item.label}</span>
					<div class="flex items-center gap-1.5 {statusClass}">
						<Icon class="w-3.5 h-3.5" />
						<div class="flex flex-col items-end">
							<span class="font-medium text-[11px]">{item.cached ? 'Cached' : 'Miss'}</span>
							{#if item.cached}
								<span class="text-[10px] {item.expiresIn && item.expiresIn < 30000 ? 'text-red-600 animate-pulse' : 'text-gray-500'} flex items-center gap-0.5">
									<Clock class="w-2.5 h-2.5" />
									{expiryText}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Footer -->
		<div class="px-3 pb-3 pt-2 border-t border-gray-200">
			<div class="flex items-center justify-between text-xs text-gray-500">
				<div class="flex items-center gap-2">
					<Zap class="w-3 h-3 text-amber-500" />
					<span>Event-driven</span>
				</div>
				<span class="text-[10px]">{formatTime(lastUpdate)}</span>
			</div>
		</div>

		<div class="px-3 pb-3 text-[10px] text-gray-500 leading-relaxed">
			<p>✓ Updates instantly on cache change</p>
			<p>✓ Real-time countdown timers</p>
			<p>✓ No polling, zero performance impact</p>
		</div>
	{/if}
</div>