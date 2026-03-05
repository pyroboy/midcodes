<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, stockCounts, countPeriods,
		getCurrentStock, getDrift, submitCount, markPeriodDone,
		type CountPeriod
	} from '$lib/stores/stock.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { Clock, CheckCircle, AlertCircle } from 'lucide-svelte';
	import QuickNumberInput from './QuickNumberInput.svelte';
	import VarianceBar from './VarianceBar.svelte';

	let activePeriod = $state<CountPeriod>('pm10');

	// Only show items for the current branch (no cross-branch editing)
	const branchItems = $derived(
		stockItems.value.filter(s =>
			session.locationId === 'all' || s.locationId === session.locationId
		)
	);

	const activePeriodData = $derived(countPeriods.find(p => p.id === activePeriod));
	const isPending = $derived(activePeriodData?.status === 'pending');

	// Variance summary for completed periods
	const driftEntries = $derived(
		branchItems.map(item => getDrift(item.id, activePeriod)).filter((d): d is number => d !== null)
	);
	const totalAbsVariance = $derived(driftEntries.reduce((s, d) => s + Math.abs(d), 0));
	const itemsWithDrift   = $derived(driftEntries.filter(d => d !== 0).length);

	// Percentage-based variance threshold (>10% of expected is flagged)
	function varianceClass(item: typeof branchItems[0], v: number | null) {
		if (v === null) return 'text-gray-300';
		const expected = getCurrentStock(item.id);
		const pct = expected > 0 ? Math.abs(v) / expected : 0;
		if (pct > 0.1) return 'text-status-red font-semibold';
		if (pct > 0.02 || Math.abs(v) > 2) return 'text-status-yellow font-semibold';
		if (v !== 0) return 'text-status-yellow font-semibold';
		return 'text-status-green font-semibold';
	}

	async function handleSubmitCount() {
		await markPeriodDone(activePeriod);
	}
</script>

<!-- Period selector -->
<div class="mb-5 flex items-center gap-3">
	{#each countPeriods as p}
		<button
			onclick={() => (activePeriod = p.id)}
			class={cn(
				'flex items-center gap-3 min-h-[44px] rounded-xl border px-5 py-3 transition-all',
				activePeriod === p.id
					? 'border-accent bg-accent-light text-accent shadow-sm'
					: 'border-border bg-white text-gray-600 hover:bg-gray-50'
			)}
		>
			<Clock class="w-4 h-4 flex-shrink-0 opacity-60" />
			<div class="text-left">
				<p class="text-sm font-bold">{p.label}</p>
				<p class="text-xs text-gray-400">{p.time}</p>
			</div>
			{#if p.status === 'done'}
				<CheckCircle class="w-4 h-4 text-status-green flex-shrink-0" />
			{:else}
				<span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">Pending</span>
			{/if}
		</button>
	{/each}
</div>

{#if isPending}
	<div class="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
		<AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0" />
		<p class="text-sm font-medium text-amber-700">Count not yet started. Enter actual counts below, then tap <strong>Submit Count</strong> to lock in this session.</p>
	</div>
{:else}
	<!-- Variance summary for completed periods -->
	<div class="mb-4 grid grid-cols-3 gap-3">
		<div class="rounded-lg border border-border bg-white px-4 py-3">
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Items Counted</p>
			<p class="mt-0.5 text-xl font-bold text-gray-900">{branchItems.length}</p>
		</div>
		<div class="rounded-lg border border-border bg-white px-4 py-3">
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Variance</p>
			<p class={cn('mt-0.5 text-xl font-bold font-mono', totalAbsVariance === 0 ? 'text-status-green' : 'text-status-red')}>
				{totalAbsVariance.toLocaleString()}
			</p>
		</div>
		<div class="rounded-lg border border-border bg-white px-4 py-3">
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Items with Drift</p>
			<p class={cn('mt-0.5 text-xl font-bold', itemsWithDrift === 0 ? 'text-status-green' : 'text-status-yellow')}>
				{itemsWithDrift} / {branchItems.length}
			</p>
		</div>
	</div>
{/if}

<div class="overflow-hidden rounded-xl border border-border bg-white">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Expected</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Counted</th>
				<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Shortage / Surplus</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each branchItems as item (item.id)}
				{@const count = stockCounts.value.find(c => c.stockItemId === item.id)}
				{@const counted = count?.counted[activePeriod] ?? null}
				{@const expected = getCurrentStock(item.id)}
				{@const drift = getDrift(item.id, activePeriod)}
				<tr class={cn('hover:bg-gray-50', drift !== null && Math.abs(drift) / Math.max(1, expected) > 0.1 && 'bg-status-red-light/20')}>
					<td class="px-4 py-3 font-medium text-gray-900">{item.name}</td>
					<td class="px-4 py-3 text-right font-mono text-gray-500">{expected.toLocaleString()} {item.unit}</td>
					<td class="px-4 py-3 text-right">
						{#if isPending}
							<QuickNumberInput 
								value={counted} 
								onChange={(val) => submitCount(item.id, activePeriod, val)}
							/>
						{:else if counted !== null}
							<span class="font-mono font-semibold text-gray-900">{counted.toLocaleString()} {item.unit}</span>
						{:else}
							<span class="text-gray-300">—</span>
						{/if}
					</td>
					<td class={cn('px-4 py-3 text-right', varianceClass(item, drift))}>
						{#if drift === null}
							<span class="text-gray-300">—</span>
						{:else}
							<div class="flex flex-col gap-1 w-full max-w-[120px] ml-auto">
								<VarianceBar expected={expected} drift={drift} />
								<div class="text-[10px] font-mono leading-none">
									{#if drift > 0}
										<span class="flex items-center justify-end gap-0.5">
											<AlertCircle class="w-3 h-3" />
											−{drift.toLocaleString()} {item.unit}
										</span>
									{:else if drift < 0}
										+{Math.abs(drift).toLocaleString()} {item.unit}
									{:else}
										<span class="text-status-green">✓ 0</span>
									{/if}
								</div>
							</div>
						{/if}
					</td>
				</tr>
			{/each}
			{#if branchItems.length === 0}
				<tr>
					<td colspan="4" class="px-4 py-12 text-center text-sm text-gray-400">No items tracked for this location.</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

{#if isPending}
	<div class="mt-4 flex justify-end">
		<button onclick={handleSubmitCount} class="btn-primary">Submit Count</button>
	</div>
{/if}
