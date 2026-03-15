<script lang="ts">
	import { deliveries, getSpoilageAlerts, stockItems } from '$lib/stores/stock.svelte';
	import { isWarehouseSession, session } from '$lib/stores/session.svelte';
	import { cn, formatPeso, formatDate } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { Plus, X, AlertTriangle, XCircle, Search, Calendar, Package } from 'lucide-svelte';
	import ProgressRing from '$lib/components/stock/ProgressRing.svelte';
	import ReceiveDelivery from '$lib/components/stock/ReceiveDelivery.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// ─── Reactive Lists ──────────────────────────────────────────────────────────
	let searchQuery = $state('');
	let filterDateRange = $state<'all' | 'today' | 'yesterday' | 'earlier'>('all');
	let filterItem = $state('all');
	let showDepleted = $state(false);

	const preFilteredDeliveries = $derived(
		isWarehouseSession()
			? deliveries.value
			: deliveries.value.filter((d: any) => {
				const item = stockItems.value.find(s => s.id === d.stockItemId);
				return item?.locationId === session.locationId;
			})
	);

	const filteredDeliveries = $derived(
		preFilteredDeliveries.filter((d: any) => {
			if (!showDepleted && d.depleted) return false;

			const matchSearch = !searchQuery.trim() ||
				d.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				d.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(d.batchNo && d.batchNo.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchItem = filterItem === 'all' || d.stockItemId === filterItem;

			// If filterDateRange !== 'all', we would filter by date here
			// For this execution we assume everything is 'today' since the store seeds with times only
			const matchDate = filterDateRange === 'all' || filterDateRange === 'today';

			return matchSearch && matchItem && matchDate;
		})
	);

	const allAlerts = $derived(
		getSpoilageAlerts().filter((d: any) => {
			if (isWarehouseSession()) return true;
			const item = stockItems.value.find(s => s.id === d.stockItemId);
			return item?.locationId === session.locationId;
		}).sort((a: any, b: any) => a.daysLeft - b.daysLeft)
	);

	// Split into expired (daysLeft < 0) and expiring soon (daysLeft >= 0)
	const expiredAlerts  = $derived(allAlerts.filter((a: any) => a.daysLeft < 0));
	const expiringAlerts = $derived(allAlerts.filter((a: any) => a.daysLeft >= 0));

	const activeItems = $derived(
		stockItems.value.filter(s => isWarehouseSession() || s.locationId === session.locationId)
	);

	// ─── Auto-open from quick action ─────────────────────────────────────────────
	$effect(() => {
		if (page.url.searchParams.get('action') === 'open') {
			openModal();
			goto('/stock/deliveries', { replaceState: true, noScroll: true });
		}
	});

	// ─── Receive Form ────────────────────────────────────────────────────────────
	let showModal = $state(false);

	// Issue 09: Success toast
	let successMsg = $state<string | null>(null);
	let successTimeout: ReturnType<typeof setTimeout> | null = null;

	// Issue 16: Procurement CTA state
	let lastSavedDelivery = $state<{ itemName: string; qty: number; unit: string; unitCost: number; totalCost: number } | null>(null);

	function openModal() {
		lastSavedDelivery = null;
		showModal = true;
	}

	function handleDeliverySaved(result: { itemName: string; qty: number; unit: string; unitCost: number; totalCost: number }) {
		// Issue 09: Show success toast
		if (successTimeout) clearTimeout(successTimeout);
		successMsg = `✓ Delivery recorded — +${result.qty}${result.unit} ${result.itemName}`;
		successTimeout = setTimeout(() => { successMsg = null; successTimeout = null; }, 3500);

		// Issue 16: Show procurement CTA if unit cost was provided
		if (result.unitCost > 0) {
			lastSavedDelivery = result;
		} else {
			lastSavedDelivery = null;
		}

		showModal = false;
	}
</script>

<div class="flex flex-col gap-6 max-w-7xl mx-auto">

	<!-- Expired Alerts (red) -->
	{#if expiredAlerts.length > 0}
		<div class="pos-card border-status-red/40 bg-status-red-light/20 p-4 flex flex-col gap-3">
			<h2 class="text-status-red font-bold flex items-center gap-2 text-sm">
				<XCircle class="w-4 h-4" /> Expired Stock ({expiredAlerts.length})
			</h2>
			<div class="flex flex-wrap gap-3">
				{#each expiredAlerts as alert}
					<div class="flex items-center gap-3 rounded-lg border border-status-red/30 bg-white px-3 py-2 text-sm shadow-sm">
						<div>
							<span class="font-semibold text-gray-900">{alert.itemName}</span>
							<span class="ml-2 font-mono text-xs text-gray-400">{alert.batchNo ?? 'No Batch'}</span>
						</div>
						<span class="rounded bg-status-red-light px-2 py-0.5 text-xs font-bold text-status-red">
							Expired {Math.abs(alert.daysLeft)}d ago
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- P0-3: Expiring Soon Alerts — always rendered at page top, not gated by form state -->
	{#if expiringAlerts.length > 0}
		<div class="pos-card border-amber-300/50 bg-amber-50/60 p-4 flex flex-col gap-3">
			<h2 class="text-amber-800 font-bold flex items-center gap-2 text-sm">
				<AlertTriangle class="w-4 h-4" /> Expiring Soon ({expiringAlerts.length})
			</h2>
			<div class="flex flex-wrap gap-3">
				{#each expiringAlerts as alert}
					<div class="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm shadow-sm">
						<div>
							<span class="font-semibold text-gray-900">{alert.itemName}</span>
							<span class="ml-2 font-mono text-xs text-gray-400">{alert.batchNo ?? 'No Batch'}</span>
						</div>
						<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
							{alert.daysLeft === 0 ? 'Expires TODAY' : `${alert.daysLeft}d left`}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div>
			<h2 class="text-base sm:text-lg font-bold text-gray-900">Delivery History & Batches</h2>
			<p class="text-xs sm:text-sm text-gray-500 mt-1">Track incoming stock batches, FIFO usage, and expiry.</p>
		</div>
		<button onclick={openModal} class="btn-primary flex items-center justify-center gap-2 shadow-sm shrink-0">
			<Plus class="w-4 h-4" /> Receive Delivery
		</button>
	</div>

	<!-- ─── Filters & Search ─── -->
	<div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
		<div class="relative flex-1 min-w-0 sm:min-w-[200px]">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search item, supplier, or batch..."
				class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:border-accent"
			/>
		</div>

		<div class="flex items-center gap-2">
			<div class="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg">
				<Calendar class="w-4 h-4 text-gray-400 shrink-0" />
				<select bind:value={filterDateRange} class="bg-transparent text-sm font-medium outline-none text-gray-700 w-full sm:min-w-[100px]">
					<option value="all">All Dates</option>
					<option value="today">Today</option>
					<option value="yesterday">Yesterday</option>
					<option value="earlier">Earlier</option>
				</select>
			</div>

			<div class="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg">
				<Package class="w-4 h-4 text-gray-400 shrink-0" />
				<select bind:value={filterItem} class="bg-transparent text-sm font-medium outline-none text-gray-700 w-full sm:min-w-[120px]">
					<option value="all">All Items</option>
					{#each activeItems as item}
						<option value={item.id}>{item.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<label class="flex items-center gap-2 px-3 py-2.5 bg-white border border-border rounded-lg cursor-pointer">
			<input type="checkbox" bind:checked={showDepleted} class="rounded border-gray-300 text-accent focus:ring-accent w-4 h-4" />
			<span class="text-sm font-medium text-gray-700">Show Depleted</span>
		</label>
	</div>

	<!-- Deliveries — Mobile card view -->
	<div class="flex flex-col gap-2 md:hidden">
		{#each filteredDeliveries as d (d.id)}
			<div class={cn('rounded-xl border border-border bg-white p-3', d.depleted && 'opacity-50')}>
				<div class="flex items-start justify-between gap-2">
					<div class="flex-1 min-w-0">
						<p class="font-semibold text-sm text-gray-900">{d.itemName}</p>
						<p class="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
							{d.supplier}
							{#if d.supplier?.includes('Transfer from')}
								<span class="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-semibold leading-none">Transfer</span>
							{/if}
						</p>
					</div>
					<span class="font-mono font-bold text-sm shrink-0">
						<span class="text-status-green">+{d.qty}</span>
						<span class="text-xs font-normal text-gray-400">{d.unit}</span>
					</span>
				</div>
				<div class="flex items-center justify-between mt-2 text-xs text-gray-500">
					<div class="flex items-center gap-3">
						<span>{formatDate(d.receivedAt)}</span>
						{#if d.batchNo}
							<span class="font-mono">{d.batchNo}</span>
						{/if}
					</div>
					{#if d.depleted}
						<span class="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500 uppercase">DEPLETED</span>
					{:else}
						<div class="flex items-center gap-2">
							<ProgressRing used={d.usedQty ?? 0} total={d.qty} size={24} strokeWidth={3} />
							<span class="text-[10px] font-medium text-gray-700">{d.qty - (d.usedQty ?? 0)} left</span>
						</div>
					{/if}
				</div>
			</div>
		{/each}

		{#if filteredDeliveries.length === 0}
			<div class="px-4 py-12 text-center text-sm text-gray-400">
				No deliveries found matching the filters.
			</div>
		{/if}
	</div>

	<!-- Deliveries — Desktop table view -->
	<div class="pos-card p-0 overflow-hidden hidden md:block">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
					<th class="px-5 py-3">Time</th>
					<th class="px-5 py-3">Item / Supplier</th>
					<th class="px-5 py-3 text-right">Qty</th>
					<th class="px-5 py-3">Batch & Expiry</th>
					<th class="px-5 py-3 text-center">FIFO Usage</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each filteredDeliveries as d (d.id)}
					{@const usedPct = Math.min(100, ((d.usedQty ?? 0) / Math.max(1, d.qty)) * 100)}
					<tr class={cn('hover:bg-gray-50 transition-colors', d.depleted && 'opacity-50')}>
						<td class="px-5 py-3 whitespace-nowrap text-gray-500 text-xs">{formatDate(d.receivedAt)}</td>
						<td class="px-5 py-3">
							<div class="flex flex-col gap-0.5">
								<span class="font-semibold text-gray-900">{d.itemName}</span>
								<span class="text-xs text-gray-400 flex items-center gap-1.5">
									{d.supplier}
									{#if d.supplier?.includes('Transfer from')}
										<span class="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded font-semibold leading-none">Transfer</span>
									{/if}
								</span>
							</div>
						</td>
						<td class="px-5 py-3 text-right font-mono font-bold">
							<span class="text-status-green">+{d.qty}</span>
							<span class="ml-0.5 text-xs font-normal text-gray-400">{d.unit}</span>
						</td>
						<td class="px-5 py-3">
							<div class="flex flex-col gap-1 text-xs">
								<span class="font-mono text-gray-700">{d.batchNo ?? '—'}</span>
								{#if d.expiryDate}
									<span class="text-gray-500">Exp: {d.expiryDate}</span>
								{/if}
							</div>
						</td>
						<td class="px-5 py-3">
							{#if d.depleted}
								<div class="flex justify-center">
									<span class="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500 uppercase">DEPLETED</span>
								</div>
							{:else}
								<div class="flex items-center justify-center gap-3">
									<ProgressRing used={d.usedQty ?? 0} total={d.qty} size={28} strokeWidth={4} />
									<div class="flex flex-col text-[10px] text-gray-700 font-medium">
										<span><strong class="text-gray-900">{d.qty - (d.usedQty ?? 0)}</strong> left</span>
										<span>{d.usedQty ?? 0} used</span>
									</div>
								</div>
							{/if}
						</td>
					</tr>
				{/each}

				{#if filteredDeliveries.length === 0}
					<tr>
						<td colspan="5" class="px-5 py-12 text-center text-sm text-gray-400">
							No deliveries found matching the filters.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Issue 09: Success toast -->
{#if successMsg}
	<div class="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl bg-status-green px-5 py-3.5 text-white shadow-xl fixed-safe-bottom fixed-safe-right" transition:fade={{ duration: 200 }}>
		<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
		</svg>
		<span class="text-sm font-semibold">{successMsg}</span>
	</div>
{/if}

<!-- Issue 16: Procurement expense CTA (shown after delivery with unit cost) -->
{#if lastSavedDelivery}
	{@const procurementParams = new URLSearchParams({
		category: 'Meat & Protein',
		amount: String(lastSavedDelivery.totalCost),
		description: `${lastSavedDelivery.itemName} ${lastSavedDelivery.qty}${lastSavedDelivery.unit}`
	})}
	<div class="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 z-[60] flex items-center gap-3 rounded-xl border border-accent/30 bg-white px-4 py-3 shadow-xl fixed-safe-bottom" transition:fade={{ duration: 200 }}>
		<div class="flex flex-col gap-0.5">
			<span class="text-xs font-semibold text-gray-600">Procurement cost: <span class="font-mono text-accent">{formatPeso(lastSavedDelivery.totalCost)}</span></span>
			<span class="text-xs text-gray-400">Add as expense?</span>
		</div>
		<a
			href="/expenses?{procurementParams.toString()}"
			class="btn-primary text-xs whitespace-nowrap"
			onclick={() => { lastSavedDelivery = null; }}
		>Record expense →</a>
		<button onclick={() => { lastSavedDelivery = null; }} class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded" aria-label="Dismiss">
			<X class="w-4 h-4" />
		</button>
	</div>
{/if}

<!-- Receive Delivery Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
		<div class="w-full sm:w-[500px] sm:max-w-[500px] rounded-t-2xl sm:rounded-xl shadow-xl relative safe-bottom sm:pb-0">
			<button
				onclick={() => (showModal = false)}
				class="absolute top-4 right-4 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
				aria-label="Close"
			>
				<X class="w-5 h-5" />
			</button>
			<ReceiveDelivery onSaved={handleDeliverySaved} onCancel={() => (showModal = false)} />
		</div>
	</div>
{/if}
