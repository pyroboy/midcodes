<script lang="ts">
	import { cn } from '$lib/utils';

	export interface VariancePoint {
		label: string;
		drift: number;      // positive = shortage, negative = surplus
		expected: number;
		unit: string;
		category: string;
	}

	/** Auto-promote units for chart labels (g→kg at 1000, ml→L at 1000) */
	function fmtDrift(qty: number, unit: string): string {
		const abs = Math.abs(qty);
		if (unit === 'g' && abs >= 1000) return `${(qty / 1000).toFixed(2)} kg`;
		if (unit === 'ml' && abs >= 1000) return `${(qty / 1000).toFixed(2)} L`;
		return `${qty.toFixed(qty % 1 === 0 ? 0 : 2)} ${unit}`;
	}

	/** Shorten item names for chart labels — prefer meaningful abbreviation over truncation */
	function shortLabel(name: string, maxLen: number = 18): string {
		if (name.length <= maxLen) return name;
		// Strip parenthetical suffixes first: "Tteok (Rice Cakes)" → "Tteok"
		const noParen = name.replace(/\s*\([^)]+\)$/, '');
		if (noParen.length <= maxLen) return noParen;
		// Take last two words for compound names
		const words = noParen.split(' ');
		if (words.length > 2) {
			const short = words.slice(-2).join(' ');
			if (short.length <= maxLen) return short;
		}
		return noParen.slice(0, maxLen - 1) + '\u2026';
	}

	interface Props {
		data: VariancePoint[];
		/** Max items to display (default 15) */
		maxItems?: number;
		/** SVG height per row */
		rowHeight?: number;
	}

	let {
		data,
		maxItems = 15,
		rowHeight = 32,
	}: Props = $props();

	// Filter items with drift != 0, sort by absolute drift descending
	const sorted = $derived(
		[...data]
			.filter(d => d.drift !== 0)
			.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
			.slice(0, maxItems)
	);

	const maxAbsDrift = $derived(
		sorted.length > 0 ? Math.max(...sorted.map(d => Math.abs(d.drift))) : 1
	);

	// SVG dimensions
	const labelWidth = 120;
	const valueWidth = 80;
	const chartPadding = 16;
	const totalWidth = 600;
	const barAreaWidth = $derived(totalWidth - labelWidth - valueWidth - chartPadding * 2);
	const barAreaCenter = $derived(labelWidth + chartPadding + barAreaWidth / 2);

	const svgHeight = $derived(Math.max(80, sorted.length * rowHeight + 24));

	function barX(d: VariancePoint): number {
		if (d.drift > 0) {
			// Shortage — bar goes LEFT from center
			return barAreaCenter - (d.drift / maxAbsDrift) * (barAreaWidth / 2);
		}
		// Surplus — bar starts at center
		return barAreaCenter;
	}

	function barW(d: VariancePoint): number {
		return Math.max(3, (Math.abs(d.drift) / maxAbsDrift) * (barAreaWidth / 2));
	}

	function rowY(i: number): number {
		return 12 + i * rowHeight;
	}

	// Category badge color
	function catColor(cat: string): string {
		switch (cat) {
			case 'Meats': return '#EF4444';
			case 'Sides': return '#F59E0B';
			case 'Drinks': return '#3B82F6';
			case 'Dishes': return '#8B5CF6';
			default: return '#6B7280';
		}
	}

	// Tooltip
	let activeIdx = $state<number | null>(null);
</script>

{#if sorted.length === 0}
	<div class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-400 min-h-[120px]">
		No variance detected — all counts match expected levels
	</div>
{:else}
	<div class="relative w-full overflow-x-auto">
		<svg
			viewBox="0 0 {totalWidth} {svgHeight}"
			width="100%"
			class="select-none"
			style="height: {svgHeight}px; min-height: 120px;"
		>
			<!-- Center zero line -->
			<line
				x1={barAreaCenter}
				y1={4}
				x2={barAreaCenter}
				y2={svgHeight - 4}
				stroke="#D1D5DB"
				stroke-width="1.5"
				stroke-dasharray="4 3"
			/>

			<!-- "0" label at top -->
			<text
				x={barAreaCenter}
				y={8}
				text-anchor="middle"
				font-size="9"
				fill="#9CA3AF"
				font-family="JetBrains Mono, monospace"
			>0</text>

			<!-- Axis labels -->
			<text
				x={barAreaCenter - barAreaWidth / 4}
				y={8}
				text-anchor="middle"
				font-size="8"
				fill="#EF4444"
				font-family="Inter, sans-serif"
				font-weight="600"
			>SHORTAGE</text>
			<text
				x={barAreaCenter + barAreaWidth / 4}
				y={8}
				text-anchor="middle"
				font-size="8"
				fill="#10B981"
				font-family="Inter, sans-serif"
				font-weight="600"
			>SURPLUS</text>

			{#each sorted as point, i}
				{@const y = rowY(i)}
				{@const isShortage = point.drift > 0}
				{@const isActive = activeIdx === i}

				<!-- Row hover zone -->
				<rect
					x={0}
					y={y}
					width={totalWidth}
					height={rowHeight}
					fill={isActive ? '#F9FAFB' : 'transparent'}
					onmouseenter={() => (activeIdx = i)}
					onmouseleave={() => (activeIdx = null)}
					role="img"
					aria-label="{point.label}: {isShortage ? 'short' : 'surplus'} {Math.abs(point.drift)} {point.unit}"
				/>

				<!-- Category dot -->
				<circle
					cx={8}
					cy={y + rowHeight / 2}
					r={3}
					fill={catColor(point.category)}
				/>

				<!-- Item label -->
				<text
					x={18}
					y={y + rowHeight / 2 + 4}
					font-size="11"
					fill={isActive ? '#111827' : '#4B5563'}
					font-weight={isActive ? '600' : '500'}
					font-family="Inter, sans-serif"
				>
					{shortLabel(point.label)}
				</text>

				<!-- Diverging bar -->
				<rect
					x={barX(point)}
					y={y + rowHeight / 2 - 6}
					width={barW(point)}
					height={12}
					rx={3}
					fill={isShortage ? '#EF4444' : '#10B981'}
					fill-opacity={isActive ? 1 : 0.7}
					class="transition-all duration-150"
					onmouseenter={() => (activeIdx = i)}
					onmouseleave={() => (activeIdx = null)}
					role="img"
					aria-label="{point.label} variance bar"
				/>

				<!-- Value label -->
				<text
					x={totalWidth - valueWidth + 4}
					y={y + rowHeight / 2 + 4}
					font-size="10"
					fill={isShortage ? '#EF4444' : '#10B981'}
					font-weight="700"
					font-family="JetBrains Mono, monospace"
				>
					{isShortage ? '−' : '+'}{fmtDrift(Math.abs(point.drift), point.unit)}
				</text>

				<!-- Row divider -->
				{#if i < sorted.length - 1}
					<line
						x1={18}
						y1={y + rowHeight}
						x2={totalWidth - 12}
						y2={y + rowHeight}
						stroke="#F3F4F6"
						stroke-width="0.5"
					/>
				{/if}
			{/each}
		</svg>
	</div>

	<!-- Legend -->
	<div class="mt-2 flex items-center justify-center gap-4 text-[10px] text-gray-400">
		{#each ['Meats', 'Sides', 'Drinks', 'Dishes'] as cat}
			<span class="flex items-center gap-1">
				<span class="inline-block h-2 w-2 rounded-full" style="background: {catColor(cat)}"></span>
				{cat}
			</span>
		{/each}
	</div>
{/if}
