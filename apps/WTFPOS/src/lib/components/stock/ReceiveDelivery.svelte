<script lang="ts">
	import { cn, formatPeso } from '$lib/utils';
	import {
		stockItems, deliveries, receiveDelivery,
	} from '$lib/stores/stock.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { isWarehouseSession } from '$lib/stores/session.svelte';
	import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
	import { btScale } from '$lib/stores/bluetooth-scale.svelte';
	import PhotoCapture from '$lib/components/PhotoCapture.svelte';

	interface Props {
		/** Called after a delivery is successfully saved. Parent can use this to close a modal or show a toast. */
		onSaved?: (result: { itemName: string; qty: number; unit: string; unitCost: number; totalCost: number }) => void;
		/** Called when the user wants to dismiss/cancel without saving. */
		onCancel?: () => void;
	}

	let { onSaved, onCancel }: Props = $props();

	// Branch-scoped items and deliveries
	const activeItems = $derived(
		stockItems.value.filter(s => isWarehouseSession() || s.locationId === session.locationId)
	);

	const branchStockIds = $derived(new Set(activeItems.map(s => s.id)));
	const branchDeliveries = $derived(
		deliveries.value.filter(d => branchStockIds.has(d.stockItemId))
	);

	// P1-2: Recent suppliers derived from delivery history
	const recentSuppliers = $derived(
		[...new Set(
			branchDeliveries
				.map((d: any) => d.supplier as string)
				.filter(Boolean)
		)].slice(0, 5)
	);

	let formStockItemId = $state('');
	let formQty         = $state('');
	let formUnitCost    = $state('');
	let formSupplier    = $state('');
	let formBatchNo     = $state('');
	let formExpiryDate  = $state('');
	let formNotes       = $state('');
	let formError       = $state('');
	let formPhotos      = $state<string[]>([]);
	let formItemSearch  = $state('');
	let saved           = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const filteredFormItems = $derived(
		formItemSearch.trim()
			? activeItems.filter(i => i.name.toLowerCase().includes(formItemSearch.toLowerCase()))
			: activeItems
	);

	const locationGroupLabels: Record<string, string> = {
		'wh-tag': 'Warehouse',
		'tag': 'Alta Citta (Tagbilaran)',
		'pgl': 'Alona Beach (Panglao)',
	};

	const groupedFormItems = $derived(() => {
		const groups: { label: string; items: typeof filteredFormItems }[] = [];
		const byLoc = new Map<string, typeof filteredFormItems>();
		for (const item of filteredFormItems) {
			const loc = item.locationId ?? 'unknown';
			if (!byLoc.has(loc)) byLoc.set(loc, []);
			byLoc.get(loc)!.push(item);
		}
		for (const [loc, items] of byLoc) {
			groups.push({ label: locationGroupLabels[loc] ?? loc, items });
		}
		return groups;
	});

	const selectedItem   = $derived(activeItems.find(s => s.id === formStockItemId));
	const parsedQty      = $derived(parseFloat(formQty) || 0);
	const parsedUnitCost = $derived(parseFloat(formUnitCost) || 0);
	const computedTotalCost = $derived(parsedUnitCost > 0 ? parsedUnitCost * parsedQty : 0);
	const isWeightUnit   = $derived(selectedItem?.unit === 'grams' || selectedItem?.unit === 'kg');
	const btConnected    = $derived(btScale.connectionStatus === 'connected');
	const canSave        = $derived(!!formStockItemId && parsedQty > 0 && !!formSupplier.trim());

	// Auto-fill supplier from last delivery for the selected item
	$effect(() => {
		if (formStockItemId) {
			const lastDelivery = branchDeliveries.find((d: any) => d.stockItemId === formStockItemId);
			if (lastDelivery && !formSupplier) {
				formSupplier = lastDelivery.supplier;
			}
		}
	});

	// Cleanup timer on destroy
	$effect(() => {
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	async function handleReceive() {
		formError = '';
		if (!formStockItemId) { formError = 'Please select an item.'; return; }
		if (parsedQty <= 0)   { formError = 'Quantity must be greater than zero.'; return; }
		if (!formSupplier.trim()) { formError = 'Supplier is required.'; return; }

		const item = stockItems.value.find(s => s.id === formStockItemId);
		if (!item) return;

		const unitCost = parsedUnitCost > 0 ? parsedUnitCost : undefined;

		try {
			await receiveDelivery(
				item.id,
				item.name,
				parsedQty,
				item.unit,
				formSupplier.trim(),
				formNotes,
				formBatchNo || undefined,
				formExpiryDate || undefined,
				undefined,
				unitCost
			);
		} catch (err) {
			formError = `Failed to save delivery: ${err instanceof Error ? err.message : 'try again'}`;
			return;
		}

		const result = {
			itemName: item.name,
			qty: parsedQty,
			unit: item.unit,
			unitCost: parsedUnitCost,
			totalCost: computedTotalCost,
		};

		// Reset form
		formStockItemId = ''; formQty = ''; formUnitCost = ''; formSupplier = '';
		formBatchNo = ''; formExpiryDate = ''; formNotes = ''; formError = '';
		formPhotos = []; formItemSearch = '';

		if (onSaved) {
			onSaved(result);
		} else {
			// Standalone mode: show inline confirmation
			if (saveTimer) clearTimeout(saveTimer);
			saved = true;
			saveTimer = setTimeout(() => (saved = false), 2500);
		}
	}
</script>

<div class="rounded-xl border border-border bg-white flex flex-col self-start" style="max-height: 85vh;">
	<!-- Header (always visible) -->
	<div class="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
		<h2 class="text-base font-bold text-gray-900">Log Delivery</h2>
		<p class="mt-0.5 text-xs text-gray-400">Record incoming stock from suppliers</p>
	</div>

	<!-- Scrollable form body -->
	<div class="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5">
		<div class="flex flex-col gap-4">
			<!-- Searchable item picker -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Item *</span>
				<input
					type="text"
					bind:value={formItemSearch}
					class="pos-input"
					placeholder="Search items..."
				/>
				<select bind:value={formStockItemId} class="pos-input">
					<option value="" disabled>Select an item…</option>
					{#if isWarehouseSession()}
						{#each groupedFormItems() as group}
							<optgroup label={group.label}>
								{#each group.items as s}
									<option value={s.id}>{s.name} ({s.unit})</option>
								{/each}
							</optgroup>
						{/each}
					{:else}
						{#each filteredFormItems as s}
							<option value={s.id}>{s.name} ({s.unit})</option>
						{/each}
					{/if}
				</select>
				{#if selectedItem}
					<p class="text-[10px] font-medium text-gray-400 mt-0.5 pl-1">
						Current Stock: <strong class="text-gray-700">{Math.round(selectedItem.openingStock)} {selectedItem.unit}</strong>
					</p>
				{/if}
			</div>

			<div class="flex gap-3">
				<div class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity *</span>
					{#if isWeightUnit && btConnected}
						<BluetoothWeightInput
							id="delivery-qty"
							value={formQty}
							onValueChange={(v) => { formQty = v; }}
							theme="light"
						/>
					{:else}
						<input type="tel" inputmode="numeric" bind:value={formQty} placeholder="0" min="0" step="any" class="pos-input font-mono" style="min-height: 56px; font-size: 18px" />
					{/if}
				</div>
				<div class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit</span>
					<input type="text" class="pos-input bg-gray-50 text-gray-500" value={selectedItem?.unit ?? '—'} disabled />
				</div>
			</div>

			<!-- Unit Cost + computed Total Cost -->
			<div class="flex gap-3">
				<label class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit Cost ₱ <span class="font-normal text-gray-400 normal-case">(optional)</span></span>
					<input type="number" bind:value={formUnitCost} class="pos-input font-mono" min="0" step="0.01" placeholder="0.00" />
				</label>
				<div class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Cost</span>
					{#if parsedUnitCost > 0 && parsedQty > 0}
						<div class="pos-input bg-gray-50 font-mono font-semibold text-gray-700 flex items-center">
							{formatPeso(computedTotalCost)}
						</div>
					{:else}
						<div class="pos-input bg-gray-50 text-gray-400 text-sm flex items-center">—</div>
					{/if}
				</div>
			</div>

			<!-- Supplier with recent chips -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier *</span>
				<input
					type="text"
					bind:value={formSupplier}
					placeholder="e.g. Metro Meat Co."
					class={cn('pos-input', !formSupplier.trim() && formStockItemId && 'border-status-red focus:border-status-red focus:ring-status-red/20')}
				/>
				{#if !formSupplier.trim() && formStockItemId}
					<p class="text-[10px] font-medium text-status-red">Supplier is required</p>
				{/if}
				{#if recentSuppliers.length > 0}
					<div class="flex flex-wrap gap-1.5 mt-0.5">
						{#each recentSuppliers as supplier}
							<button
								type="button"
								class="px-2.5 py-1 text-xs rounded-full border border-border bg-gray-50 text-gray-700 hover:bg-accent hover:text-white hover:border-accent transition-colors"
								onclick={() => (formSupplier = supplier)}
							>{supplier}</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Batch + Expiry -->
			<div class="flex gap-3 border-t border-border pt-4">
				<label class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Batch No (Optional)</span>
					<input type="text" bind:value={formBatchNo} class="pos-input font-mono" placeholder="e.g. B-2024-05" />
				</label>
				<label class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expiry (Optional)</span>
					<input type="date" bind:value={formExpiryDate} class="pos-input" />
				</label>
			</div>

			<PhotoCapture
				photos={formPhotos}
				onchange={(p) => (formPhotos = p)}
				label="Delivery Photos (optional)"
			/>

			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes (optional)</span>
				<input type="text" bind:value={formNotes} placeholder="e.g. Checked for freshness" class="pos-input" />
			</div>
		</div>
	</div>

	<!-- Sticky footer: error + action buttons always visible -->
	<div class="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 pt-3 pb-4 sm:pb-5 flex-shrink-0 flex flex-col gap-3">
		{#if formError}
			<p class="rounded-lg bg-status-red-light border border-status-red/20 px-3 py-2 text-sm font-medium text-status-red">{formError}</p>
		{/if}

		{#if saved}
			<div class="rounded-lg border border-status-green/20 bg-status-green-light px-4 py-3 text-center text-sm font-bold text-status-green">
				Delivery recorded!
			</div>
		{:else}
			<button onclick={handleReceive} disabled={!canSave} class="btn-primary disabled:opacity-40">
				+ Log Delivery
			</button>
		{/if}
		{#if onCancel}
			<button class="btn-ghost w-full text-gray-500" onclick={onCancel}>Cancel</button>
		{/if}
	</div>
</div>
