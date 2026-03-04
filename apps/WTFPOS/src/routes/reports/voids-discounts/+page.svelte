<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { voidsAndDiscountsSummary } from '$lib/stores/reports.svelte';

	const summary = $derived(voidsAndDiscountsSummary());
</script>

<!-- Live indicator -->
<div class="mb-4 flex items-center gap-2">
	<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Today's Voids & Discounts</h2>
	<span class="flex items-center gap-1.5 text-xs text-status-green">
		<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
		Live totals
	</span>
</div>

<div class="grid grid-cols-2 gap-6">
	<!-- Voids Section -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-bold text-gray-900">Voided Orders</h2>
				<span class="rounded-lg bg-status-red/10 px-2.5 py-1 text-xs font-bold text-status-red">
					{summary.voids.count} Orders
				</span>
			</div>
			
			<div class="mb-6 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-status-red font-mono">{formatPeso(summary.voids.value)}</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Lost</span>
			</div>

			<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Reason Breakdown</h3>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
					<span class="text-sm font-semibold text-gray-700">Mistakes</span>
					<span class="font-mono text-sm font-bold">{summary.voids.mistake}</span>
				</div>
				<div class="flex items-center justify-between rounded-lg border border-status-red/30 bg-status-red/5 px-4 py-3">
					<span class="text-sm font-semibold text-status-red">Walkouts</span>
					<span class="font-mono text-sm font-bold text-status-red">{summary.voids.walkout}</span>
				</div>
				<div class="flex items-center justify-between rounded-lg border border-status-yellow/30 bg-status-yellow/5 px-4 py-3">
					<span class="text-sm font-semibold text-status-yellow">Write-offs (Spoilage, etc)</span>
					<span class="font-mono text-sm font-bold text-status-yellow">{summary.voids.writeOff}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Discounts Section -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-bold text-gray-900">Discounts Applied</h2>
				<span class="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
					{summary.discounts.count} Orders
				</span>
			</div>
			
			<div class="mb-6 flex items-baseline gap-2">
				<span class="text-3xl font-extrabold text-accent font-mono">{formatPeso(summary.discounts.value)}</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Given</span>
			</div>

			<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Type Breakdown</h3>
			<div class="flex flex-col gap-2">
				{#each summary.discounts.breakdown as row}
					<div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
						<span class="text-sm font-semibold text-gray-700">{row.label}</span>
						<span class={cn('font-mono text-sm font-bold', row.amount > 0 ? 'text-gray-900' : 'text-gray-400')}>
							{formatPeso(row.amount)}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
