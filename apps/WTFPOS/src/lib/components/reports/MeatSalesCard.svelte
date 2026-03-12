<script lang="ts">
	import { cn, formatKg } from '$lib/utils';
	import type { MeatReport, MeatReportPeriod } from '$lib/stores/reports.svelte';
	import { PERIOD_LABELS, meatReportComparison } from '$lib/stores/reports.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';

	interface Props {
		report: MeatReport;
		period: MeatReportPeriod;
	}

	let { report, period }: Props = $props();

	const comparison = $derived(meatReportComparison(period));

	const avgVariance = $derived(
		report.rows.length > 0
			? (report.rows.reduce((s, r) => s + r.variancePct, 0) / report.rows.length).toFixed(1)
			: '0.0'
	);

	// Protein mix summary: "Pork 45% / Beef 40% / Chicken 15%"
	const proteinMix = $derived.by(() => {
		const parts: string[] = [];
		for (const [p, label] of [['pork', 'Pk'], ['beef', 'Bf'], ['chicken', 'Ch']] as const) {
			const pct = report.byProtein[p]?.pctOfTotal ?? 0;
			if (pct > 0) parts.push(`${label} ${pct}%`);
		}
		return parts.length > 0 ? parts.join(' / ') : 'No data';
	});
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-1">
	<KpiCard
		label="Total Sold"
		value={formatKg(report.totalMeatSoldGrams)}
		change={comparison?.totalSold.changePct ?? null}
		prevValue={comparison ? formatKg(comparison.totalSold.previous) : null}
		changeLabel="vs prev period"
		sub={PERIOD_LABELS[period]}
	/>
	<KpiCard
		label="Avg / Head"
		value={formatKg(report.avgMeatPerHead)}
		change={comparison?.avgPerHead.changePct ?? null}
		prevValue={comparison ? formatKg(comparison.avgPerHead.previous) : null}
		changeLabel="vs prev period"
		sub="{report.totalPaxServed} pax"
		variant="accent"
	/>
	<KpiCard
		label="Protein Mix"
		value={proteinMix}
		sub="Pk=Pork Bf=Beef Ch=Chicken"
	/>
	<KpiCard
		label="Pax Served"
		value={String(report.totalPaxServed)}
		change={comparison?.paxServed.changePct ?? null}
		prevValue={comparison ? String(comparison.paxServed.previous) : null}
		changeLabel="vs prev period"
		sub={PERIOD_LABELS[period]}
	/>
	<KpiCard
		label="Avg Variance"
		value="{parseFloat(avgVariance) >= 0 ? '+' : ''}{avgVariance}%"
		variant={parseFloat(avgVariance) < -15 ? 'danger' : parseFloat(avgVariance) > 15 ? 'danger' : 'default'}
	/>
</div>
