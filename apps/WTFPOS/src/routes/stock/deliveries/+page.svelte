<script lang="ts">
	import { deliveries, getSpoilageAlerts, stockItems, receiveDelivery } from '$lib/stores/stock.svelte';
	import { isWarehouseSession, session } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';

	// ─── Reactive Lists ──────────────────────────────────────────────────────────
	const filteredDeliveries = $derived(
		isWarehouseSession()
			? deliveries
			: deliveries.filter(d => {
				const item = stockItems.find(s => s.id === d.stockItemId);
				return item?.locationId === session.locationId;
			})
	);

	const spoilageAlerts = $derived(
		getSpoilageAlerts().filter(d => {
			if (isWarehouseSession()) return true;
			const item = stockItems.find(s => s.id === d.stockItemId);
			return item?.locationId === session.locationId;
		}).sort((a, b) => a.daysLeft - b.daysLeft)
	);

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

	const parsedQty = $derived(parseFloat(formQty) || 0);

	function openModal() {
		formStockItemId = activeItems[0]?.id ?? '';
		formQty = '';
		formSupplier = '';
		formBatchNo = '';
		formExpiryDate = '';
		formNotes = '';
		showModal = true;
	}

	function saveDelivery() {
		if (!formStockItemId || parsedQty <= 0) return;
		const item = stockItems.find(s => s.id === formStockItemId);
		if (!item) return;

		receiveDelivery(
			item.id,
			item.name,
			parsedQty,
			item.unit,
			formSupplier || 'Unknown',
			formNotes,
			formBatchNo || undefined,
			formExpiryDate || undefined
		);
		showModal = false;
	}
</script>

<div class="flex flex-col gap-6 max-w-7xl mx-auto">
	<!-- Alerts Section -->
	{#if spoilageAlerts.length > 0}
		<div class="pos-card border-status-red/30 bg-status-red-light/10 p-5 flex flex-col gap-4">
			<h2 class="text-status-red font-bold flex items-center gap-2">
				<span class="text-xl">⚠️</span> Spoilage Alerts (Expiring Soon)
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each spoilageAlerts as alert}
					<div class="rounded-lg border border-status-red/20 bg-white p-4 shadow-sm flex flex-col gap-2">
						<div class="flex justify-between items-start">
							<div>
								<span class="text-sm font-bold text-gray-900">{alert.itemName}</span>
								<!-- Use optional chaining to safely print batchNo, defaulting to "No Batch" -->
								<div class="text-xs text-gray-400 font-mono mt-0.5">{alert.batchNo ?? 'No Batch'}</div>
							</div>
							<span class="rounded bg-status-red-light px-2 py-0.5 text-xs font-bold text-status-red">
								{#if alert.daysLeft < 0}
									EXPIRED {Math.abs(alert.daysLeft)} days ago
								{:else if alert.daysLeft === 0}
									Expires TODAY
								{:else}
									{alert.daysLeft} days left
								{/if}
							</span>
						</div>
						
						<!-- Progress bar for batch usage -->
						<div class="mt-2 text-xs text-gray-500">
							<div class="flex justify-between mb-1">
								<span>{alert.usedQty ?? 0} {alert.unit} used</span>
								<span>{alert.qty} {alert.unit} total</span>
							</div>
							<div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
								<div class="h-full bg-status-red transition-all" style="width: {((alert.usedQty ?? 0) / alert.qty) * 100}%"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Header and Actions -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-bold text-gray-900">Delivery history & Batches</h2>
			<p class="text-sm text-gray-500 mt-1">Track incoming stock batches, FIFO usage, and expiry.</p>
		</div>
		<button onclick={openModal} class="btn-primary flex items-center gap-2 shadow-sm">
			<span class="text-lg">+</span> Receive Delivery
		</button>
	</div>

	<!-- Deliveries Table -->
	<div class="pos-card p-0 overflow-hidden">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
					<th class="px-5 py-3">Time</th>
					<th class="px-5 py-3">Item Received</th>
					<th class="px-5 py-3 text-right">Qty</th>
					<th class="px-5 py-3">Batch & Expiry</th>
					<th class="px-5 py-3 text-center">FIFO Status</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each filteredDeliveries as d (d.id)}
					<tr class={cn('hover:bg-gray-50 transition-colors', d.depleted && 'opacity-60 bg-gray-50')}>
						<td class="px-5 py-3 whitespace-nowrap text-gray-500">{d.receivedAt}</td>
						<td class="px-5 py-3">
							<div class="flex flex-col gap-0.5">
								<span class="font-semibold text-gray-900">{d.itemName}</span>
								<span class="text-xs text-gray-400">{d.supplier}</span>
							</div>
						</td>
						<td class="px-5 py-3 text-right font-mono font-bold text-gray-900">
							<span class="text-status-green">+{d.qty}</span> <span class="text-xs font-normal text-gray-400 ml-0.5">{d.unit}</span>
						</td>
						<td class="px-5 py-3">
							<div class="flex flex-col gap-1 text-xs">
								<span class="font-mono text-gray-700">{d.batchNo ?? '-'}</span>
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
								<div class="w-24 mx-auto flex flex-col gap-1">
									<div class="flex justify-between text-[10px] text-gray-500 font-medium">
										<span>{d.usedQty ?? 0} used</span>
										<span>{(d.qty - (d.usedQty ?? 0))} left</span>
									</div>
									<div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
										<div class="h-full bg-accent transition-all" style="width: {((d.usedQty ?? 0) / d.qty) * 100}%"></div>
									</div>
								</div>
							{/if}
						</td>
					</tr>
				{/each}
				
				{#if filteredDeliveries.length === 0}
					<tr>
						<td colspan="5" class="px-5 py-12 text-center text-sm text-gray-400">
							No deliveries recorded in this location.
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
		<div class="pos-card w-[480px] flex flex-col gap-5">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Receive Delivery / Batch</h3>
				<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>

			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</label>
					<select bind:value={formStockItemId} class="pos-input">
						{#each activeItems as s}
							<option value={s.id}>{s.name} ({s.category})</option>
						{/each}
					</select>
				</div>

				<div class="flex gap-4">
					<div class="flex-1 flex flex-col gap-1.5">
						<label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</label>
						<input type="number" bind:value={formQty} class="pos-input font-mono" min="0" step="0.1" />
					</div>
					<div class="flex-1 flex flex-col gap-1.5">
						<label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</label>
						<input type="text" class="pos-input bg-gray-50" value={activeItems.find(s => s.id === formStockItemId)?.unit ?? ''} disabled />
					</div>
				</div>
				
				<div class="flex gap-4 border-t border-border pt-4">
					<div class="flex-1 flex flex-col gap-1.5">
						<label class="text-xs font-semibold text-accent uppercase tracking-wider">Batch No (Optional)</label>
						<input type="text" bind:value={formBatchNo} class="pos-input font-mono" placeholder="e.g. B-2024-05" />
					</div>
					<div class="flex-1 flex flex-col gap-1.5">
						<label class="text-xs font-semibold text-status-red uppercase tracking-wider">Expiry (Optional)</label>
						<input type="date" bind:value={formExpiryDate} class="pos-input" />
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</label>
					<input type="text" bind:value={formSupplier} class="pos-input" placeholder="e.g. Monterey Meats" />
				</div>

				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</label>
					<input type="text" bind:value={formNotes} class="pos-input" placeholder="Optional notes" />
				</div>
			</div>

			<div class="flex gap-3 mt-2">
				<button class="btn-ghost flex-1" onclick={() => showModal = false}>Cancel</button>
				<button class="btn-primary flex-1" onclick={saveDelivery} disabled={!formStockItemId || parsedQty <= 0}>
					✓ Receive Stock
				</button>
			</div>
		</div>
	</div>
{/if}
