<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { staffPerformance } from '$lib/stores/reports.svelte';
	import { session } from '$lib/stores/session.svelte';

	const rows = $derived(staffPerformance());
</script>

<div class="mb-4 flex items-center gap-2">
	<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Today — Live</h2>
	<span class="flex items-center gap-1.5 text-xs text-status-green">
		<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-status-green"></span>
		Updating from POS orders
	</span>
</div>

<div class="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-gray-50">
				<th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-r border-gray-200">Staff Name</th>
				<th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Orders Closed</th>
				<th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total Revenue</th>
				<th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Avg Ticket</th>
				<th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 border-l border-gray-200">Voids</th>
				<th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Discounts</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
            {#if rows.length === 0}
                <tr>
                    <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                        <div class="text-3xl mb-3">👥</div>
                        No staff performance data yet today.<br/><span class="text-xs">Data appears when staff checkout orders.</span>
                    </td>
                </tr>
            {/if}
			{#each rows as row}
				<tr class="hover:bg-gray-50 transition-colors">
					<td class="px-5 py-4 font-bold text-gray-900 border-r border-gray-100 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-orange-100 text-status-orange flex items-center justify-center font-bold text-xs uppercase">
                            {row.name.substring(0,2)}
                        </div>
                        {row.name}
                    </td>
					<td class="px-5 py-4 text-right font-mono text-gray-700">{row.ordersClosed}</td>
					<td class="px-5 py-4 text-right font-mono font-bold text-gray-900">{formatPeso(row.totalRevenue)}</td>
					<td class="px-5 py-4 text-right font-mono text-gray-600">{formatPeso(row.avgTicket)}</td>
					<td class={cn("px-5 py-4 text-right font-mono border-l border-gray-100", row.voidCount > 2 ? 'text-status-red font-bold' : 'text-gray-500 font-semibold')}>
						{#if row.voidCount > 0}
							{row.voidCount} {row.voidCount > 2 ? '!' : ''}
						{:else}
							<!-- TODO: voidCount requires cancelled orders to have closedBy set at void time -->
							<span class="text-gray-300 font-normal">N/A</span>
						{/if}
                    </td>
					<td class="px-5 py-4 text-right font-mono text-gray-500 font-semibold">{row.discountCount}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
