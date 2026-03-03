<script lang="ts">
	import { cn } from '$lib/utils';

	const ITEMS = [
		'Samgyupsal (Pork Belly)', 'Chadolbaegi (Beef Brisket)', 'Galbi (Short Ribs)',
		'US Beef Belly', 'Kimchi', 'Japchae', 'Steamed Rice', 'Doenjang Jjigae',
		'Bibimbap', 'Soju (Original)', 'San Miguel Beer', 'Iced Tea'
	];
	const UNITS = ['grams', 'kg', 'portions', 'bowls', 'bottles', 'liters', 'pcs'];

	// Form state
	let item     = $state('');
	let qty      = $state('');
	let unit     = $state('grams');
	let supplier = $state('');
	let notes    = $state('');
	let saved    = $state(false);

	interface Delivery {
		id: number; item: string; qty: string; unit: string; supplier: string; receivedAt: string;
	}

	let deliveries = $state<Delivery[]>([
		{ id: 1, item: 'Samgyupsal (Pork Belly)',   qty: '5000',  unit: 'grams',    supplier: 'Metro Meat Co.',     receivedAt: '8:15 AM' },
		{ id: 2, item: 'San Miguel Beer',            qty: '24',    unit: 'bottles',  supplier: 'SM Trading',         receivedAt: '8:30 AM' },
		{ id: 3, item: 'Kimchi',                     qty: '10',    unit: 'portions', supplier: 'Korean Foods PH',    receivedAt: '9:00 AM' }
	]);
	let nextId = $state(4);

	function receive() {
		if (!item || !qty || !supplier) return;
		deliveries = [{ id: nextId++, item, qty, unit, supplier, receivedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) }, ...deliveries];
		item = ''; qty = ''; unit = 'grams'; supplier = ''; notes = '';
		saved = true;
		setTimeout(() => (saved = false), 2500);
	}

	const canSave = $derived(item.trim() !== '' && qty.trim() !== '' && supplier.trim() !== '');
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
				<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Item *</label>
				<select bind:value={item} class="pos-input">
					<option value="">Select item…</option>
					{#each ITEMS as i}<option value={i}>{i}</option>{/each}
				</select>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity *</label>
					<input type="number" bind:value={qty} placeholder="0" min="0" class="pos-input" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit</label>
					<select bind:value={unit} class="pos-input">
						{#each UNITS as u}<option value={u}>{u}</option>{/each}
					</select>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier *</label>
				<input type="text" bind:value={supplier} placeholder="e.g. Metro Meat Co." class="pos-input" />
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes (optional)</label>
				<input type="text" bind:value={notes} placeholder="e.g. Checked for freshness" class="pos-input" />
			</div>
		</div>

		<button
			onclick={receive}
			disabled={!canSave}
			class="btn-primary disabled:opacity-40"
		>
			{saved ? '✓ Saved!' : '+ Log Delivery'}
		</button>
	</div>

	<!-- Deliveries log -->
	<div class="flex flex-col gap-3">
		<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Today's Deliveries</h2>
		{#if deliveries.length === 0}
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
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each deliveries as d (d.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium text-gray-900">{d.item}</td>
								<td class="px-4 py-3 text-right font-mono text-gray-700">{d.qty} {d.unit}</td>
								<td class="px-4 py-3 text-gray-500">{d.supplier}</td>
								<td class="px-4 py-3 text-right text-xs text-gray-400">{d.receivedAt}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
