<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, wasteEntries, logWaste, WASTE_REASONS,
	} from '$lib/stores/stock.svelte';

	const UNITS = ['grams', 'kg', 'portions', 'bowls', 'bottles', 'liters', 'pcs'];

	let selectedStockId = $state('');
	let qty    = $state('');
	let unit   = $state('grams');
	let reason = $state('');
	let saved  = $state(false);

	const canSave = $derived(selectedStockId !== '' && qty.trim() !== '' && reason !== '');

	function handleLog() {
		if (!canSave) return;
		const item = stockItems.find(s => s.id === selectedStockId);
		if (!item) return;
		logWaste(selectedStockId, item.name, parseFloat(qty) || 0, unit, reason);
		selectedStockId = ''; qty = ''; unit = 'grams'; reason = '';
		saved = true;
		setTimeout(() => (saved = false), 2500);
	}

	const reasonColor: Record<string, string> = {
		'Dropped / Spilled':    'bg-orange-50 text-orange-600',
		'Expired':              'bg-status-red-light text-status-red',
		'Unusable (damaged)':   'bg-purple-50 text-purple-600',
		'Overcooked':           'bg-status-yellow-light text-status-yellow',
		'Trimming (bone/fat)':  'bg-amber-50 text-amber-700',
		'Other':                'bg-gray-100 text-gray-500',
	};
</script>

<div class="grid grid-cols-[380px_1fr] gap-6">
	<!-- Log form -->
	<div class="rounded-xl border border-border bg-white p-6 flex flex-col gap-5 self-start">
		<div>
			<h2 class="text-base font-bold text-gray-900">Log Waste</h2>
			<p class="mt-0.5 text-xs text-gray-400">Preparation waste only — not unconsumed customer leftovers</p>
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Item *</span>
				<select bind:value={selectedStockId} class="pos-input">
					<option value="">Select item…</option>
					{#each stockItems as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
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
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason *</span>
				<select bind:value={reason} class="pos-input">
					<option value="">Select reason…</option>
					{#each WASTE_REASONS as r}<option value={r}>{r}</option>{/each}
				</select>
			</div>
		</div>

		<button onclick={handleLog} disabled={!canSave} class="btn-primary disabled:opacity-40">
			{saved ? '✓ Logged!' : 'Log Waste'}
		</button>
	</div>

	<!-- Waste log -->
	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Today's Waste Log</h2>
			<span class="rounded-full border border-status-red/20 bg-status-red-light px-2.5 py-0.5 text-xs font-semibold text-status-red">
				{wasteEntries.length} entries
			</span>
		</div>

		{#if wasteEntries.length === 0}
			<div class="flex items-center justify-center rounded-xl border border-border bg-white p-10 text-center text-gray-400">
				<div>
					<div class="mb-2 text-3xl">✅</div>
					<p class="text-sm">No waste logged today</p>
				</div>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-border bg-white">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</th>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Reason</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">By</th>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each wasteEntries as e (e.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium text-gray-900">{e.itemName}</td>
								<td class="px-4 py-3 text-right font-mono text-gray-700">{e.qty} {e.unit}</td>
								<td class="px-4 py-3">
									<span class={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', reasonColor[e.reason] ?? 'bg-gray-100 text-gray-500')}>
										{e.reason}
									</span>
								</td>
								<td class="px-4 py-3 text-right text-xs text-gray-500">{e.loggedBy}</td>
								<td class="px-4 py-3 text-right text-xs text-gray-400">{e.loggedAt}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
