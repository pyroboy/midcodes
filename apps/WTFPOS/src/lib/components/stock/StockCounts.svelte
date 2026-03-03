<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, stockCounts, countPeriods,
		getCurrentStock, getDrift, submitCount,
		type CountPeriod
	} from '$lib/stores/stock.svelte';

	let activePeriod = $state<CountPeriod>('10am');

	const isPending = $derived(countPeriods.find(p => p.id === activePeriod)?.status === 'pending');

	function varianceClass(v: number | null) {
		if (v === null) return 'text-gray-300';
		if (Math.abs(v) > 50) return 'text-status-red font-semibold';
		if (Math.abs(v) > 3)  return 'text-status-yellow font-semibold';
		if (v !== 0) return 'text-status-yellow font-semibold';
		return 'text-status-green font-semibold';
	}
</script>

<!-- Period selector -->
<div class="mb-5 flex items-center gap-3">
	{#each countPeriods as p}
		<button
			onclick={() => (activePeriod = p.id)}
			class={cn(
				'flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all',
				activePeriod === p.id
					? 'border-accent bg-accent-light text-accent shadow-sm'
					: 'border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
			style="min-height: unset"
		>
			<div class="text-left">
				<p class="text-sm font-bold">{p.label}</p>
				<p class="text-xs text-gray-400">{p.time}</p>
			</div>
			<span class={cn(
				'ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
				p.status === 'done' ? 'bg-status-green-light text-status-green' : 'bg-amber-50 text-amber-600'
			)}>
				{p.status}
			</span>
		</button>
	{/each}
</div>

{#if isPending}
	<div class="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
		<span class="text-amber-600">⏳</span>
		<p class="text-sm font-medium text-amber-700">Count not yet started. Enter actual counts below to complete this session.</p>
	</div>
{/if}

<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Expected</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Counted</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Drift</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each stockItems as item (item.id)}
				{@const count = stockCounts.find(c => c.stockItemId === item.id)}
				{@const counted = count?.counted[activePeriod] ?? null}
				{@const expected = getCurrentStock(item.id)}
				{@const drift = getDrift(item.id, activePeriod)}
				<tr class={cn('hover:bg-gray-50', drift !== null && drift > 50 && 'bg-status-red-light/30')}>
					<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{expected.toLocaleString()} {item.unit}</td>
					<td class="px-4 py-3 text-right">
						{#if isPending}
							<input
								type="number"
								placeholder="—"
								min="0"
								value={counted ?? ''}
								oninput={(e) => submitCount(item.id, activePeriod, parseFloat((e.target as HTMLInputElement).value) || 0)}
								class="w-24 rounded-md border border-border px-2 py-1 text-right font-mono text-sm outline-none focus:border-accent"
							/>
						{:else if counted !== null}
							<span class="font-mono font-semibold text-gray-900">{counted.toLocaleString()} {item.unit}</span>
						{:else}
							<span class="text-gray-300">—</span>
						{/if}
					</td>
					<td class={cn('px-4 py-3 text-right font-mono', varianceClass(drift))}>
						{#if drift === null}
							—
						{:else if drift > 0}
							<span class="flex items-center justify-end gap-1">
								⚠ -{drift.toLocaleString()} {item.unit}
							</span>
						{:else if drift < 0}
							+{Math.abs(drift).toLocaleString()} {item.unit}
						{:else}
							✓ 0
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if isPending}
	<div class="mt-4 flex justify-end">
		<button class="btn-primary">Submit Count</button>
	</div>
{/if}
