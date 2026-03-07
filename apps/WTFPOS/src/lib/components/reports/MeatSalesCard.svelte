<script lang="ts">
	import { cn, formatKg } from '$lib/utils';
	import type { MeatReport, MeatReportPeriod } from '$lib/stores/reports.svelte';
	import { PERIOD_LABELS } from '$lib/stores/reports.svelte';

	interface Props {
		report: MeatReport;
		period: MeatReportPeriod;
	}

	let { report, period }: Props = $props();

	const avgVariance = $derived(
		report.rows.length > 0
			? (report.rows.reduce((s, r) => s + r.variancePct, 0) / report.rows.length).toFixed(1)
			: '0.0'
	);

	const metrics = $derived([
		{ label: 'Total Sold', value: formatKg(report.totalMeatSoldGrams), sub: PERIOD_LABELS[period], color: 'text-gray-900', bg: 'bg-white', border: 'border-border' },
		{ label: 'Avg / Head', value: `${report.avgMeatPerHead}g`, sub: `${report.totalPaxServed} pax`, color: 'text-accent', bg: 'bg-accent-light', border: 'border-accent/20' },
		{ label: 'Pork / Head', value: `${report.avgPorkPerHead}g`, sub: `${report.byProtein['pork']?.pctOfTotal ?? 0}%`, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
		{ label: 'Beef / Head', value: `${report.avgBeefPerHead}g`, sub: `${report.byProtein['beef']?.pctOfTotal ?? 0}%`, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
		{ label: 'Chicken / Head', value: `${report.avgChickenPerHead}g`, sub: `${report.byProtein['chicken']?.pctOfTotal ?? 0}%`, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
		{ label: 'Pax Served', value: String(report.totalPaxServed), sub: PERIOD_LABELS[period], color: 'text-gray-900', bg: 'bg-white', border: 'border-border' },
		{ label: 'Avg Variance', value: `${parseFloat(avgVariance) >= 0 ? '+' : ''}${avgVariance}%`, sub: '', color: 'text-status-yellow', bg: 'bg-status-yellow-light', border: 'border-status-yellow/30' },
	]);
</script>

<div class="grid grid-cols-7 gap-2">
	{#each metrics as m (m.label)}
		<div class={cn('rounded-lg border px-2.5 py-2', m.bg, m.border)}>
			<p class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 truncate">{m.label}</p>
			<p class={cn('mt-0.5 text-lg font-bold leading-tight', m.color)}>{m.value}</p>
			{#if m.sub}
				<p class="text-[10px] text-gray-400">{m.sub}</p>
			{/if}
		</div>
	{/each}
</div>
