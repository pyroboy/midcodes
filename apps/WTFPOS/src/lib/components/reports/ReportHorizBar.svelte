<script lang="ts">
	import { cn } from '$lib/utils';

	interface Row {
		label: string;
		value: number;
		subLabel?: string;
	}

	interface Props {
		rows: Row[];
		maxValue?: number;
		formatValue?: (v: number) => string;
		/** Accent color class for the bar fill */
		barColor?: string;
		/** Show rank numbers */
		showRank?: boolean;
	}

	let {
		rows,
		maxValue,
		formatValue,
		barColor = 'bg-accent',
		showRank = true,
	}: Props = $props();

	const max = $derived(maxValue ?? Math.max(...rows.map(r => r.value), 1));
	const fmt = $derived(formatValue ?? ((v: number) => String(v)));
</script>

{#if rows.length === 0}
	<div class="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-400">
		No data for this period
	</div>
{:else}
	<div class="flex flex-col gap-2">
		{#each rows as row, i}
			<div class="group flex items-center gap-3">
				{#if showRank}
					<span class="w-5 shrink-0 text-right text-xs font-semibold text-gray-300">{i + 1}</span>
				{/if}
				<div class="flex-1 min-w-0">
					<div class="flex items-baseline justify-between gap-2 mb-1">
						<span class="truncate text-sm font-semibold text-gray-800">{row.label}</span>
						<span class="shrink-0 font-mono text-sm font-bold text-gray-900">{fmt(row.value)}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class={cn('h-full rounded-full transition-all', barColor)}
							style="width: {max > 0 ? (row.value / max) * 100 : 0}%"
						></div>
					</div>
					{#if row.subLabel}
						<p class="mt-0.5 text-[10px] text-gray-400">{row.subLabel}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
