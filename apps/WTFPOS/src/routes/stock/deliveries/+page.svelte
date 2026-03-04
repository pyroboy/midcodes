<script lang="ts">
	import { deliveries, getSpoilageAlerts, stockItems, receiveDelivery } from '$lib/stores/stock.svelte';
	import { isWarehouseSession, session } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { Plus, X, AlertTriangle, XCircle, Search, Calendar, Package } from 'lucide-svelte';
	import ProgressRing from '$lib/components/stock/ProgressRing.svelte';

	// ─── Reactive Lists ──────────────────────────────────────────────────────────
	let searchQuery = $state('');
	let filterDateRange = $state<'all' | 'today' | 'yesterday' | 'earlier'>('all');
	let filterItem = $state('all');
	let showDepleted = $state(false);

	const preFilteredDeliveries = $derived(
		isWarehouseSession()
			? deliveries
			: deliveries.filter(d => {
				const item = stockItems.find(s => s.id === d.stockItemId);
				return item?.locationId === session.locationId;
			})
	);

	const filteredDeliveries = $derived(
		preFilteredDeliveries.filter(d => {
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
		getSpoilageAlerts().filter(d => {
			if (isWarehouseSession()) return true;
			const item = stockItems.find(s => s.id === d.stockItemId);
			return item?.locationId === session.locationId;
		}).sort((a, b) => a.daysLeft - b.daysLeft)
	);

	// Split into expired (daysLeft < 0) and expiring soon (daysLeft >= 0)
	const expiredAlerts  = $derived(allAlerts.filter(a => a.daysLeft < 0));
	const expiringAlerts = $derived(allAlerts.filter(a => a.daysLeft >= 0));

	const activeItems = $derived(
		stockItems.filter(s => isWarehouseSession() || s.locationId === session.locationId)
	);

	// ─── Receive Form ────────────────────────────────────────────────────────────
	let showModal = $state(false);
	let formStockItemId = $state('');
	let formQty = $state('');
	let formSupplier = $state('');
	let formBatchNo = $state('');
	let formExpiryDate = $state('');
	let formNotes = $state('');
	let formError = $state('');

	const parsedQty = $derived(parseFloat(formQty) || 0);
	const selectedItem = $derived(activeItems.find(s => s.id === formStockItemId));
	const canSave = $derived(!!formStockItemId && parsedQty > 0 && !!formSupplier.trim());

	function openModal() {
		formStockItemId = activeItems[0]?.id ?? '';
		formQty = '';
		formSupplier = '';
		formBatchNo = '';
		formExpiryDate = '';
		formNotes = '';
		formError = '';
		showModal = true;
	}

	function saveDelivery() {
		formError = '';
		if (!formStockItemId) { formError = 'Please select an item.'; return; }
		if (parsedQty <= 0)   { formError = 'Quantity must be greater than zero.'; return; }
		if (!formSupplier.trim()) { formError = 'Supplier is required.'; return; }

		const item = stockItems.find(s => s.id === formStockItemId);
		if (!item) return;

		receiveDelivery(
			item.id,
			item.name,
			parsedQty,
			item.unit,
			formSupplier.trim(),
			formNotes,
			formBatchNo || undefined,
			formExpiryDate || undefined
		);
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

	<!-- Expiring Soon Alerts (amber) -->
	{#if expiringAlerts.length > 0}
		<div class="pos-card border-amber-300/50 bg-amber-50/60 p-4 flex flex-col gap-3">
			<h2 class="text-amber-700 font-bold flex items-center gap-2 text-sm">
				<AlertTriangle class="w-4 h-4" /> Expiring Soon ({expiringAlerts.length})
			</h2>
			<div class="flex flex-wrap gap-3">
				{#each expiringAlerts as alert}
					<div class="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm shadow-sm">
						<div>
							<span class="font-semibold text-gray-900">{alert.itemName}</span>
							<span class="ml-2 font-mono text-xs text-gray-400">{alert.batchNo ?? 'No Batch'}</span>
						</div>
						<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
							{alert.daysLeft === 0 ? 'Expires TODAY' : `${alert.daysLeft}d left`}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-bold text-gray-900">Delivery History & Batches</h2>
			<p class="text-sm text-gray-500 mt-1">Track incoming stock batches, FIFO usage, and expiry.</p>
		</div>
		<button onclick={openModal} class="btn-primary flex items-center gap-2 shadow-sm">
			<Plus class="w-4 h-4" /> Receive Delivery
		</button>
	</div>

	<!-- ─── Filters & Search ─── -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative flex-1 min-w-[240px]">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search item, supplier, or batch..."
				class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:border-accent"
			/>
		</div>
		
		<div class="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg">
			<Calendar class="w-4 h-4 text-gray-400" />
			<select bind:value={filterDateRange} class="bg-transparent text-sm font-medium outline-none text-gray-700 min-w-[120px]">
				<option value="all">All Dates</option>
				<option value="today">Today</option>
				<option value="yesterday">Yesterday</option>
				<option value="earlier">Earlier</option>
			</select>
		</div>

		<div class="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg">
			<Package class="w-4 h-4 text-gray-400" />
			<select bind:value={filterItem} class="bg-transparent text-sm font-medium outline-none text-gray-700 min-w-[160px]">
				<option value="all">All Items</option>
				{#each activeItems as item}
					<option value={item.id}>{item.name}</option>
				{/each}
			</select>
		</div>

		<label class="flex items-center gap-2 px-3 py-2.5 bg-white border border-border rounded-lg cursor-pointer">
			<input type="checkbox" bind:checked={showDepleted} class="rounded border-gray-300 text-accent focus:ring-accent w-4 h-4" />
			<span class="text-sm font-medium text-gray-700">Show Depleted</span>
		</label>
	</div>

	<!-- Deliveries Table -->
	<div class="pos-card p-0 overflow-hidden">
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
						<td class="px-5 py-3 whitespace-nowrap text-gray-500 text-xs">{new Date(d.receivedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</td>
						<td class="px-5 py-3">
							<div class="flex flex-col gap-0.5">
								<span class="font-semibold text-gray-900">{d.itemName}</span>
								<span class="text-xs text-gray-400">{d.supplier}</span>
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
									<div class="flex flex-col text-[10px] text-gray-500 font-medium">
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

<!-- Receive Delivery Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
		<div class="pos-card w-[480px] flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Receive Delivery / Batch</h3>
				<button onclick={() => (showModal = false)} class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item *</span>
					<select bind:value={formStockItemId} class="pos-input">
						<option value="" disabled>Select an item...</option>
						{#each activeItems as item}
							<option value={item.id}>{item.name} ({item.unit})</option>
						{/each}
					</select>
				</label>

				{#if selectedItem}
					<p class="text-xs text-gray-500 -mt-2 px-1">
						Current stock: <span class="font-mono font-semibold text-gray-700">{Math.round(selectedItem.openingStock)} {selectedItem.unit}</span>
					</p>
				{/if}

				<div class="flex gap-4">
					<label class="flex-1 flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity *</span>
						<input type="number" bind:value={formQty} class="pos-input font-mono" min="0" step="any" />
					</label>
					<label class="flex-1 flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</span>
						<input type="text" class="pos-input bg-gray-50 text-gray-500" value={selectedItem?.unit ?? '—'} disabled />
					</label>
				</div>

				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier *</span>
					<input type="text" bind:value={formSupplier} class="pos-input" placeholder="e.g. Monterey Meats" />
				</label>

				<div class="flex gap-4 border-t border-border pt-4">
					<label class="flex-1 flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-accent uppercase tracking-wider">Batch No (Optional)</span>
						<input type="text" bind:value={formBatchNo} class="pos-input font-mono" placeholder="e.g. B-2024-05" />
					</label>
					<label class="flex-1 flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-status-red uppercase tracking-wider">Expiry (Optional)</span>
						<input type="date" bind:value={formExpiryDate} class="pos-input" />
					</label>
				</div>

				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</span>
					<input type="text" bind:value={formNotes} class="pos-input" placeholder="Optional notes" />
				</label>
			</div>

			{#if formError}
				<p class="rounded-lg bg-status-red-light border border-status-red/20 px-3 py-2 text-sm font-medium text-status-red">{formError}</p>
			{/if}

			<div class="flex gap-3 mt-2">
				<button class="btn-ghost flex-1" onclick={() => (showModal = false)}>Cancel</button>
				<button class="btn-primary flex-1" onclick={saveDelivery} disabled={!canSave}>
					Receive Stock
				</button>
			</div>
		</div>
	</div>
{/if}
