<script lang="ts">
	import type { Table } from '$lib/types';
	import { formatCountdown, cn } from '$lib/utils';

	let { table }: { table: Table } = $props();

	const statusColors: Record<Table['status'], string> = {
		available: 'border-table-available/40 bg-table-available/10 hover:bg-table-available/20',
		occupied: 'border-table-occupied/40 bg-table-occupied/10 hover:bg-table-occupied/20',
		warning: 'border-table-warning/60 bg-table-warning/15 hover:bg-table-warning/25',
		critical: 'border-table-critical/80 bg-table-critical/20 hover:bg-table-critical/30 animate-pulse',
		billing: 'border-orange-500 bg-orange-100 hover:bg-orange-200',
		maintenance: 'border-gray-500 bg-gray-800/10 hover:bg-gray-800/20'
	};

	const statusDot: Record<Table['status'], string> = {
		available: 'bg-table-available',
		occupied: 'bg-table-occupied',
		warning: 'bg-table-warning animate-pulse',
		critical: 'bg-table-critical animate-timer-tick',
		billing: 'bg-orange-500',
		maintenance: 'bg-gray-500'
	};

	const statusLabel: Record<Table['status'], string> = {
		available: 'Available',
		occupied: 'Occupied',
		warning: '⚠ Running low',
		critical: '🔴 Time up soon',
		billing: 'Printing Bill',
		maintenance: '🔧 Maintenance'
	};
</script>

<button
	class={cn(
		'pos-card flex cursor-pointer flex-col gap-2 border-2 text-left transition-all active:scale-95 no-select',
		statusColors[table.status]
	)}
>
	<!-- Table number -->
	<div class="flex items-center justify-between">
		<span class="text-2xl font-bold">{table.number}</span>
		<div class={cn('h-3 w-3 rounded-full', statusDot[table.status])}></div>
	</div>

	<!-- Capacity badge -->
	<div class="text-xs text-white/40">
		{table.capacity} pax
	</div>

	<!-- Countdown or status -->
	{#if table.elapsedSeconds !== null}
		<div
			class={cn(
				'font-mono text-xl font-bold',
				table.status === 'critical' && 'text-table-critical',
				table.status === 'warning' && 'text-table-warning',
				table.status === 'occupied' && 'text-table-occupied'
			)}
		>
			{formatCountdown(table.elapsedSeconds)}
		</div>
		<div class="text-xs text-white/40">{statusLabel[table.status]}</div>
	{:else}
		<div class="text-sm font-medium text-table-available">{statusLabel[table.status]}</div>
	{/if}
</button>
