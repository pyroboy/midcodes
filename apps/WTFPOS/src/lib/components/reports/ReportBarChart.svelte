<script lang="ts">
	import { cn } from '$lib/utils';

	export interface ChartDataPoint {
		label: string;
		primary: number;
		secondary?: number;
		highlight?: boolean;
	}

	interface Props {
		data: ChartDataPoint[];
		/** Unit shown on tooltip and Y axis, e.g. '₱' or 'g' or '' */
		yUnit?: string;
		/** SVG height in pixels */
		height?: number;
		/** Show the secondary bar alongside primary */
		showSecondary?: boolean;
		/** Primary bar color (Tailwind fill class or hex) */
		primaryColor?: string;
		/** Secondary bar color */
		secondaryColor?: string;
		/** Formatter for Y axis / tooltip values */
		formatValue?: (v: number) => string;
	}

	let {
		data,
		yUnit = '₱',
		height = 200,
		showSecondary = false,
		primaryColor = '#EA580C',
		secondaryColor = '#10B981',
		formatValue,
	}: Props = $props();

	// Internal dimensions
	const marginLeft = 52;
	const marginRight = 12;
	const marginTop = 16;
	const marginBottom = 32;

	const innerW = $derived(600 - marginLeft - marginRight);
	const innerH = $derived(height - marginTop - marginBottom);

	// Nice max for Y axis
	function niceMax(v: number): number {
		if (v <= 0) return 10;
		const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
		return Math.ceil(v / magnitude) * magnitude;
	}

	const maxVal = $derived(
		niceMax(Math.max(
			...data.map(d => showSecondary ? Math.max(d.primary, d.secondary ?? 0) : d.primary),
			0
		))
	);

	// Grid lines at 0, 25%, 50%, 75%, 100%
	const gridLines = $derived([0, 0.25, 0.5, 0.75, 1].map(f => maxVal * f));

	function yPos(value: number): number {
		return marginTop + innerH - (value / maxVal) * innerH;
	}

	const barGap = $derived(data.length > 0 ? innerW / data.length : innerW);
	const barWidth = $derived(showSecondary ? barGap * 0.35 : barGap * 0.55);

	function xCenter(i: number): number {
		return marginLeft + i * barGap + barGap / 2;
	}

	function xBar(i: number): number {
		return xCenter(i) - (showSecondary ? barWidth + 2 : barWidth / 2);
	}

	function xBarSecondary(i: number): number {
		return xCenter(i) + 2;
	}

	// Tooltip
	let activeBar = $state<number | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function defaultFormat(v: number): string {
		if (yUnit === '₱') return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
		if (yUnit === 'g') return `${v.toLocaleString()}g`;
		if (yUnit === 'kg') return `${(v / 1000).toFixed(2)} kg`;
		return `${v.toLocaleString()}${yUnit}`;
	}

	const fmt = $derived(formatValue ?? defaultFormat);

	function formatAxisLabel(v: number): string {
		if (yUnit === '₱') {
			if (v >= 1000000) return `₱${(v / 1000000).toFixed(1)}M`;
			if (v >= 1000)    return `₱${(v / 1000).toFixed(0)}k`;
			return `₱${v}`;
		}
		if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
		return String(v);
	}
</script>

<!-- Wrap in relative div so absolute tooltip is positioned correctly -->
<div class="relative w-full">
	{#if data.length === 0}
		<div class="flex h-[{height}px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
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

			<!-- Bars -->
			{#each data as point, i}
				{@const barH = Math.max(2, (point.primary / maxVal) * innerH)}
				{@const by = yPos(point.primary)}

				<!-- Primary bar -->
				<rect
					x={xBar(i)}
					y={by}
					width={barWidth}
					height={barH}
					rx="3"
					fill={point.highlight ? '#EA580C' : primaryColor}
					fill-opacity={point.highlight ? '1' : '0.75'}
					class="cursor-pointer transition-opacity hover:fill-opacity-100"
					onmouseenter={(e) => {
						activeBar = i;
						const rect = (e.currentTarget as SVGRectElement).closest('svg')!.getBoundingClientRect();
						const svgEl = e.currentTarget as SVGRectElement;
						const svgRect = svgEl.getBoundingClientRect();
						tooltipX = svgRect.left - rect.left + svgRect.width / 2;
						tooltipY = svgRect.top - rect.top - 8;
					}}
					onmouseleave={() => (activeBar = null)}
					role="img"
					aria-label="{point.label}: {fmt(point.primary)}"
				/>

				<!-- Secondary bar (optional) -->
				{#if showSecondary && point.secondary !== undefined}
					{@const secH = Math.max(2, (point.secondary / maxVal) * innerH)}
					{@const sy = yPos(point.secondary)}
					<rect
						x={xBarSecondary(i)}
						y={sy}
						width={barWidth}
						height={secH}
						rx="3"
						fill={secondaryColor}
						fill-opacity="0.65"
						class="cursor-pointer transition-opacity hover:fill-opacity-100"
						onmouseenter={(e) => {
							activeBar = i;
							const rect = (e.currentTarget as SVGRectElement).closest('svg')!.getBoundingClientRect();
							const svgEl = e.currentTarget as SVGRectElement;
							const svgRect = svgEl.getBoundingClientRect();
							tooltipX = svgRect.left - rect.left + svgRect.width / 2;
							tooltipY = svgRect.top - rect.top - 8;
						}}
						onmouseleave={() => (activeBar = null)}
						role="img"
						aria-label="{point.label} secondary: {fmt(point.secondary)}"
					/>
				{/if}

				<!-- X axis label -->
				<text
					x={xCenter(i)}
					y={height - marginBottom + 14}
					text-anchor="middle"
					font-size="9"
					fill={point.highlight ? '#EA580C' : '#9CA3AF'}
					font-weight={point.highlight ? '700' : '400'}
					font-family="Inter, sans-serif"
				>
					{point.label}
				</text>
			{/each}
		</svg>

		<!-- Tooltip -->
		{#if activeBar !== null && data[activeBar]}
			{@const pt = data[activeBar]}
			<div
				class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-white px-3 py-2 shadow-lg text-xs"
				style="left: {tooltipX}px; top: {tooltipY}px;"
			>
				<p class="font-semibold text-gray-700 mb-0.5">{pt.label}</p>
				<p class="font-mono font-bold text-gray-900">{fmt(pt.primary)}</p>
				{#if showSecondary && pt.secondary !== undefined}
					<p class="font-mono text-status-green">{fmt(pt.secondary)}</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>
