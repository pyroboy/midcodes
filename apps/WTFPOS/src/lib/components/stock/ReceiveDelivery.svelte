<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, deliveries, receiveDelivery,
	} from '$lib/stores/stock.svelte';

	const UNITS = ['grams', 'kg', 'portions', 'bowls', 'bottles', 'liters', 'pcs'];

	let selectedStockId = $state('');
	let qty      = $state('');
	let unit     = $state('grams');
	let supplier = $state('');
	let notes    = $state('');
	let saved    = $state(false);
	let receiptPhoto = $state<File | null>(null);

	// Find the last delivery for the selected item to auto-fill supplier
	$effect(() => {
		if (selectedStockId) {
			const lastDelivery = deliveries.value.find(d => d.stockItemId === selectedStockId);
			if (lastDelivery && !supplier) {
				supplier = lastDelivery.supplier;
			}
		}
	});

	const selectedItem = $derived(stockItems.value.find(s => s.id === selectedStockId));
	const canSave = $derived(selectedStockId !== '' && parseFloat(qty) > 0 && supplier.trim() !== '');

	async function handleReceive() {
		if (!canSave) return;
		const item = stockItems.value.find(s => s.id === selectedStockId);
		if (!item) return;

		let photoUrl: string | undefined = undefined;
		if (receiptPhoto) {
			photoUrl = URL.createObjectURL(receiptPhoto);
		}

		await receiveDelivery(selectedStockId, item.name, parseFloat(qty) || 0, unit, supplier, notes, undefined, undefined, photoUrl);
		
		selectedStockId = ''; qty = ''; unit = 'grams'; supplier = ''; notes = ''; receiptPhoto = null;
		
		const fileInput = document.getElementById('delivery-photo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

		saved = true;
		setTimeout(() => (saved = false), 2500);
	}
</script>

<div class="grid grid-cols-[380px_1fr] gap-6 h-full">
	<!-- Form panel -->
	<div class="rounded-xl border border-border bg-white p-6 flex flex-col gap-5 self-start">
		<div>
			<h2 class="text-base font-bold text-gray-900">Log Delivery</h2>
			<p class="mt-0.5 text-xs text-gray-400">Record incoming stock from suppliers</p>
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Item *</span>
				<select bind:value={selectedStockId} class="pos-input">
					<option value="">Select item…</option>
					{#each stockItems.value as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
				{#if selectedItem}
					<p class="text-[10px] font-medium text-gray-400 mt-1 pl-1">
						Current Stock: <strong class="text-gray-700">{Math.round(selectedItem.openingStock)} {selectedItem.unit}</strong>
					</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity *</span>
					<input type="number" bind:value={qty} placeholder="0" min="0" class="pos-input" />
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit</span>
					<select bind:value={unit} class="pos-input">
						{#each UNITS as u}<option value={u}>{u}</option>{/each}
					</select>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier *</span>
				<input type="text" bind:value={supplier} placeholder="e.g. Metro Meat Co." class={cn('pos-input', !supplier.trim() && selectedStockId && 'border-status-red focus:border-status-red focus:ring-status-red/20')} />
				{#if !supplier.trim() && selectedStockId}
					<p class="text-[10px] font-medium text-status-red">Supplier is required</p>
				{/if}
			</div>

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes (optional)</span>
				<input type="text" bind:value={notes} placeholder="e.g. Checked for freshness" class="pos-input" />
			</div>

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Proof of Delivery (Photo)</span>
				<input 
					id="delivery-photo"
					type="file" 
					accept="image/*" 
					capture="environment"
					onchange={(e) => {
						const target = e.target as HTMLInputElement;
						receiptPhoto = target.files?.[0] || null;
					}}
					class="pos-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
				/>
			</div>
		</div>

		<button onclick={handleReceive} disabled={!canSave} class="btn-primary disabled:opacity-40">
			{saved ? '✓ Saved!' : '+ Log Delivery'}
		</button>
	</div>

	<!-- Deliveries log -->
	<div class="flex flex-col gap-3">
		<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Today's Deliveries</h2>
		{#if deliveries.value.length === 0}
			<div class="flex flex-1 items-center justify-center rounded-xl border border-border bg-white p-10 text-center text-gray-400">
				<div>
					<div class="mb-2 text-3xl">📦</div>
					<p class="text-sm">No deliveries logged yet</p>
				</div>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-border bg-white">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Supplier</th>
							<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Photo</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each deliveries.value as d (d.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium text-gray-900">{d.itemName}</td>
								<td class="px-4 py-3 text-right font-mono text-gray-700">{d.qty} {d.unit}</td>
								<td class="px-4 py-3 text-gray-500">{d.supplier}</td>
								<td class="px-4 py-3 text-center">
									{#if d.photo}
										<a href={d.photo} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline text-lg" title="View Photo">
											📸
										</a>
									{:else}
										<span class="text-gray-300">-</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-right text-xs text-gray-400">{d.receivedAt}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
