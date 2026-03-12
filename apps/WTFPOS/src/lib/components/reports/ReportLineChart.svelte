<script lang="ts">
	import { cn } from '$lib/utils';

	export interface LineChartSeries {
		key: string;
		label: string;
		color: string;
		data: number[];
	}

	interface Props {
		labels: string[];
		series: LineChartSeries[];
		yUnit?: string;
		height?: number;
		formatValue?: (v: number) => string;
	}

	let {
		labels,
		series,
		yUnit = '₱',
		height = 220,
		formatValue,
	}: Props = $props();

	// Internal dimensions (match ReportBarChart)
	const marginLeft = 52;
	const marginRight = 12;
	const marginTop = 16;
	const marginBottom = 32;

	const innerW = $derived(600 - marginLeft - marginRight);
	const innerH = $derived(height - marginTop - marginBottom);

	function niceMax(v: number): number {
		if (v <= 0) return 10;
		const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
		return Math.ceil(v / magnitude) * magnitude;
	}

	const maxVal = $derived(
		niceMax(Math.max(...series.flatMap((s) => s.data), 0))
	);

	const gridLines = $derived([0, 0.25, 0.5, 0.75, 1].map((f) => maxVal * f));

	function yPos(value: number): number {
		return marginTop + innerH - (value / maxVal) * innerH;
	}

	function xPos(i: number): number {
		if (labels.length <= 1) return marginLeft + innerW / 2;
		return marginLeft + (i / (labels.length - 1)) * innerW;
	}

	// Build polyline points string for each series
	function polylinePoints(data: number[]): string {
		return data.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ');
	}

	// Tooltip
	let activeIndex = $state<number | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function defaultFormat(v: number): string {
		if (yUnit === '₱') return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
		return `${v.toLocaleString()}${yUnit ? ' ' + yUnit : ''}`;
	}

	const fmt = $derived(formatValue ?? defaultFormat);

	function formatAxisLabel(v: number): string {
		if (yUnit === '₱') {
			if (v >= 1000000) return `₱${(v / 1000000).toFixed(1)}M`;
			if (v >= 1000) return `₱${(v / 1000).toFixed(0)}k`;
			return `₱${v}`;
		}
		if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
		return String(v);
	}

	function handleDotEnter(e: MouseEvent, i: number) {
		activeIndex = i;
		const svg = (e.currentTarget as SVGElement).closest('svg')!;
		const rect = svg.getBoundingClientRect();
		const dot = (e.currentTarget as SVGElement).getBoundingClientRect();
		tooltipX = dot.left - rect.left + dot.width / 2;
		tooltipY = dot.top - rect.top - 8;
	}
</script>

<div class="relative w-full">
	{#if labels.length === 0}
		<div class="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400" style="height: {height}px">
			No data for this period
		</div>
	{:else}
		<svg
			viewBox="0 0 600 {height}"
			width="100%"
			class="select-none overflow-visible"
			style="height: {height}px"
		>
			<!-- Grid lines + Y axis labels -->
			{#each gridLines as gv}
				{@const gy = yPos(gv)}
				<line
					x1={marginLeft}
					y1={gy}
					x2={600 - marginRight}
					y2={gy}
					stroke="#E5E7EB"
					stroke-width="1"
				/>
				<text
					x={marginLeft - 4}
					y={gy + 4}
					text-anchor="end"
					font-size="9"
					fill="#9CA3AF"
					font-family="JetBrains Mono, monospace"
				>
					{formatAxisLabel(gv)}
				</text>
			{/each}

			<!-- Lines + dots for each series -->
			{#each series as s}
				{#if s.data.length > 1}
					<polyline
						points={polylinePoints(s.data)}
						fill="none"
						stroke={s.color}
						stroke-width="2.5"
						stroke-linejoin="round"
						stroke-linecap="round"
						opacity="0.85"
					/>
				{/if}
				{#each s.data as val, i}
					<circle
						cx={xPos(i)}
						cy={yPos(val)}
						r={activeIndex === i ? 5 : 3.5}
						fill={s.color}
						stroke="white"
						stroke-width="2"
						class="cursor-pointer transition-all"
						onmouseenter={(e) => handleDotEnter(e, i)}
						onmouseleave={() => (activeIndex = null)}
						role="img"
						aria-label="{s.label}: {fmt(val)}"
					/>
				{/each}
			{/each}

			<!-- X axis labels -->
			{#each labels as lbl, i}
				<text
					x={xPos(i)}
					y={height - marginBottom + 14}
					text-anchor="middle"
					font-size="9"
					fill="#9CA3AF"
					font-family="Inter, sans-serif"
				>
					{lbl}
				</text>
			{/each}
		</svg>

		<!-- Tooltip -->
		{#if activeIndex !== null}
			<div
				class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-white px-3 py-2 shadow-lg text-xs"
				style="left: {tooltipX}px; top: {tooltipY}px;"
			>
				<p class="font-semibold text-gray-700 mb-1">{labels[activeIndex]}</p>
				{#each series as s}
					{#if s.data[activeIndex] !== undefined}
						<p class="flex items-center gap-1.5">
							<span class="inline-block h-2 w-2 rounded-full" style="background: {s.color}"></span>
							<span class="text-gray-500">{s.label}:</span>
							<span class="font-mono font-bold text-gray-900">{fmt(s.data[activeIndex])}</span>
						</p>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Legend -->
		<div class="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
			{#each series as s}
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-2 w-2 rounded-full" style="background: {s.color}"></span>
					{s.label}
				</span>
			{/each}
		</div>
	{/if}
</div>
