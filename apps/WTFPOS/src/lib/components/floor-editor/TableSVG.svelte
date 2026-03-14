<script lang="ts">
	import type { Table, ChairSide } from '$lib/types';

	interface Props {
		table: Table;
		selected?: boolean;
		mode?: 'editor' | 'display';
		onclick?: (e: MouseEvent) => void;
		onpointerdown?: (e: PointerEvent) => void;
		onresizestart?: (corner: 'nw' | 'ne' | 'sw' | 'se', e: PointerEvent) => void;
		onrotatestart?: (e: PointerEvent) => void;
		onchairsideclick?: (side: 'top' | 'bottom' | 'left' | 'right', e: MouseEvent) => void;
	}

	let { table, selected = false, mode = 'editor', onclick, onpointerdown, onresizestart, onrotatestart, onchairsideclick }: Props = $props();

	// Handle constants (canvas units — visually consistent at default zoom)
	const H_SIZE = 8;   // corner handle square side
	const H_HALF = H_SIZE / 2;
	const ROT_OFFSET = 30; // px above table top for rotation handle

	const DEFAULT_TABLE_SIZE = 112;
	const ACCENT_COLOR = '#EA580C';

	const W = $derived(table.width ?? DEFAULT_TABLE_SIZE);
	const H = $derived(table.height ?? DEFAULT_TABLE_SIZE);
	const cx = $derived(table.x + W / 2);
	const cy = $derived(table.y + H / 2);
	const rx = $derived(table.borderRadius ?? 10);
	const fill = $derived(table.color ?? '#ffffff');
	const opacity = $derived(table.opacity ?? 1);
	const borderWidth = $derived(table.borderWidth ?? 1.5);
	const rotation = $derived(table.rotation ?? 0);

	// Chair rendering helpers
	const CHAIR_THICKNESS = 14;
	const CHAIR_GAP = 6;

	function chairRects(side: ChairSide, side_name: 'top' | 'bottom' | 'left' | 'right'): Array<{ x: number; y: number; w: number; h: number }> {
		if (side.type === 'none') return [];

		const isHoriz = side_name === 'top' || side_name === 'bottom';
		const sideSpan = isHoriz ? W : H;

		// Bench types: lounge, l-shape (legacy), diner (legacy → renders as lounge)
		if (side.type === 'lounge' || side.type === 'l-shape' || side.type === 'diner') {
			const cw = isHoriz ? sideSpan - CHAIR_GAP * 2 : CHAIR_THICKNESS;
			const ch = isHoriz ? CHAIR_THICKNESS : sideSpan - CHAIR_GAP * 2;
			const chairX = isHoriz ? table.x + CHAIR_GAP : (side_name === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP);
			const chairY = isHoriz ? (side_name === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP) : table.y + CHAIR_GAP;
			return [{ x: chairX, y: chairY, w: cw, h: ch }];
		}

		if (side.type === 'individual') {
			const count = Math.max(1, side.count);
			const chairW = isHoriz ? Math.min(28, (sideSpan - CHAIR_GAP * (count + 1)) / count) : CHAIR_THICKNESS;
			const chairH = isHoriz ? CHAIR_THICKNESS : Math.min(28, (sideSpan - CHAIR_GAP * (count + 1)) / count);
			const totalSpan = isHoriz ? chairW * count + CHAIR_GAP * (count - 1) : chairH * count + CHAIR_GAP * (count - 1);
			const startOffset = isHoriz ? table.x + (W - totalSpan) / 2 : table.y + (H - totalSpan) / 2;

			return Array.from({ length: count }, (_, i) => {
				const stepPrimary = isHoriz ? chairW + CHAIR_GAP : chairH + CHAIR_GAP;
				const x = isHoriz
					? startOffset + i * stepPrimary
					: (side_name === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP);
				const y = isHoriz
					? (side_name === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP)
					: startOffset + i * stepPrimary;
				return { x, y, w: chairW, h: chairH };
			});
		}

		return [];
	}

	// ─── Auto corner-fill: bench + bench on adjacent sides → curved connector ─
	function isBenchType(s: ChairSide): boolean {
		return s.type === 'lounge' || s.type === 'l-shape' || s.type === 'diner';
	}

	type CornerFill = { d: string; color: string; opacity: number };

	/**
	 * Generate quarter-ring SVG paths that wrap around each table corner
	 * where two adjacent bench sides meet. The ring curvature matches the
	 * table's borderRadius so the bench seating looks like one continuous
	 * piece wrapping around the corner.
	 *
	 * rInner = rx + GAP  (follows the table edge offset by the gap)
	 * rOuter = rx + GAP + THICKNESS  (outer edge of the bench)
	 */
	function cornerFillPaths(): CornerFill[] {
		if (!table.chairConfig) return [];
		const cfg = table.chairConfig;
		const fills: CornerFill[] = [];

		// Clamp rx to half the smallest dimension (SVG clamps internally too)
		const crx = Math.min(rx, W / 2, H / 2);
		const ri = crx + CHAIR_GAP;
		const ro = crx + CHAIR_GAP + CHAIR_THICKNESS;

		// NE: top bench meets right bench
		if (isBenchType(cfg.top) && isBenchType(cfg.right)) {
			const acx = table.x + W - crx;
			const acy = table.y + crx;
			fills.push({
				d: `M${acx},${acy - ro} A${ro},${ro} 0 0,1 ${acx + ro},${acy} L${acx + ri},${acy} A${ri},${ri} 0 0,0 ${acx},${acy - ri} Z`,
				color: cfg.top.color ?? '#9ca3af',
				opacity: Math.min(cfg.top.opacity ?? 0.85, cfg.right.opacity ?? 0.85)
			});
		}

		// SE: right bench meets bottom bench
		if (isBenchType(cfg.right) && isBenchType(cfg.bottom)) {
			const acx = table.x + W - crx;
			const acy = table.y + H - crx;
			fills.push({
				d: `M${acx + ro},${acy} A${ro},${ro} 0 0,1 ${acx},${acy + ro} L${acx},${acy + ri} A${ri},${ri} 0 0,0 ${acx + ri},${acy} Z`,
				color: cfg.right.color ?? '#9ca3af',
				opacity: Math.min(cfg.right.opacity ?? 0.85, cfg.bottom.opacity ?? 0.85)
			});
		}

		// SW: bottom bench meets left bench
		if (isBenchType(cfg.bottom) && isBenchType(cfg.left)) {
			const acx = table.x + crx;
			const acy = table.y + H - crx;
			fills.push({
				d: `M${acx},${acy + ro} A${ro},${ro} 0 0,1 ${acx - ro},${acy} L${acx - ri},${acy} A${ri},${ri} 0 0,0 ${acx},${acy + ri} Z`,
				color: cfg.bottom.color ?? '#9ca3af',
				opacity: Math.min(cfg.bottom.opacity ?? 0.85, cfg.left.opacity ?? 0.85)
			});
		}

		// NW: left bench meets top bench
		if (isBenchType(cfg.left) && isBenchType(cfg.top)) {
			const acx = table.x + crx;
			const acy = table.y + crx;
			fills.push({
				d: `M${acx - ro},${acy} A${ro},${ro} 0 0,1 ${acx},${acy - ro} L${acx},${acy - ri} A${ri},${ri} 0 0,0 ${acx - ri},${acy} Z`,
				color: cfg.left.color ?? '#9ca3af',
				opacity: Math.min(cfg.left.opacity ?? 0.85, cfg.top.opacity ?? 0.85)
			});
		}

		return fills;
	}

	// ─── Chair hover zones ──────────────────────────────────────────────────
	const ZONE_THICK = 22;
	const ZONE_GAP = 4;

	let hoveredChairSide = $state<'top' | 'bottom' | 'left' | 'right' | null>(null);

	function getChairZone(s: 'top' | 'bottom' | 'left' | 'right') {
		switch (s) {
			case 'top':
				return { x: table.x, y: table.y - ZONE_GAP - ZONE_THICK, w: W, h: ZONE_THICK, cx: table.x + W / 2, cy: table.y - ZONE_GAP - ZONE_THICK / 2 };
			case 'bottom':
				return { x: table.x, y: table.y + H + ZONE_GAP, w: W, h: ZONE_THICK, cx: table.x + W / 2, cy: table.y + H + ZONE_GAP + ZONE_THICK / 2 };
			case 'left':
				return { x: table.x - ZONE_GAP - ZONE_THICK, y: table.y, w: ZONE_THICK, h: H, cx: table.x - ZONE_GAP - ZONE_THICK / 2, cy: table.y + H / 2 };
			case 'right':
				return { x: table.x + W + ZONE_GAP, y: table.y, w: ZONE_THICK, h: H, cx: table.x + W + ZONE_GAP + ZONE_THICK / 2, cy: table.y + H / 2 };
		}
	}

	function hasChairsOnSide(s: 'top' | 'bottom' | 'left' | 'right'): boolean {
		return !!table.chairConfig && table.chairConfig[s].type !== 'none';
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<g
	role="button"
	tabindex="0"
	transform="rotate({rotation} {cx} {cy})"
	onclick={onclick}
	onpointerdown={onpointerdown}
	style="cursor: {mode === 'editor' ? 'grab' : 'pointer'};"
>
	<!-- Chairs — rendered behind table body -->
	{#if table.chairConfig}
		{#each (['top','bottom','left','right'] as const) as side_name}
			{@const side = table.chairConfig[side_name]}
			{#if side.type !== 'none'}
				{#each chairRects(side, side_name) as r}
					<rect
						x={r.x} y={r.y} width={r.w} height={r.h}
						rx="4"
						fill={side.color ?? '#9ca3af'}
						opacity={side.opacity ?? 0.85}
					/>
				{/each}
			{/if}
		{/each}

		<!-- Auto corner-fill: curved connector where adjacent bench sides meet -->
		{#each cornerFillPaths() as cf}
			<path d={cf.d} fill={cf.color} opacity={cf.opacity} />
		{/each}
	{/if}

	<!-- Table body -->
	<rect
		x={table.x} y={table.y}
		width={W} height={H}
		rx={rx}
		fill={fill}
		{opacity}
		stroke={selected ? ACCENT_COLOR : '#9ca3af'}
		stroke-width={selected ? 3 : borderWidth}
	/>

	<!-- Selection highlight ring -->
	{#if selected}
		<rect
			x={table.x - 4} y={table.y - 4}
			width={W + 8} height={H + 8}
			rx={rx + 4}
			fill="none"
			stroke={ACCENT_COLOR}
			stroke-width="2"
			stroke-dasharray="6 3"
			opacity="0.7"
		/>
	{/if}

	<!-- Resize + rotate handles (editor mode only) -->
	{#if selected && mode === 'editor'}
		<!-- Rotation stem line -->
		<line
			x1={cx} y1={table.y - 4}
			x2={cx} y2={table.y - ROT_OFFSET}
			stroke={ACCENT_COLOR} stroke-width="1.5" stroke-dasharray="3 2"
			pointer-events="none"
		/>

		<!-- Rotation handle circle -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<circle
			cx={cx} cy={table.y - ROT_OFFSET}
			r="6"
			fill={ACCENT_COLOR} stroke="white" stroke-width="1.5"
			style="cursor: crosshair;"
			onpointerdown={(e) => { e.stopPropagation(); onrotatestart?.(e); }}
		/>

		<!-- Corner resize handles: NW NE SW SE -->
		{#each [
			{ id: 'nw', x: table.x,     y: table.y     },
			{ id: 'ne', x: table.x + W, y: table.y     },
			{ id: 'sw', x: table.x,     y: table.y + H },
			{ id: 'se', x: table.x + W, y: table.y + H },
		] as h (h.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<rect
				x={h.x - H_HALF} y={h.y - H_HALF}
				width={H_SIZE} height={H_SIZE}
				rx="2"
				fill="white" stroke={ACCENT_COLOR} stroke-width="1.5"
				style="cursor: {h.id}-resize;"
				onpointerdown={(e) => { e.stopPropagation(); onresizestart?.(h.id as 'nw'|'ne'|'sw'|'se', e); }}
			/>
		{/each}

		<!-- Chair side hover zones — click to open inline editor -->
		{#each (['top', 'bottom', 'left', 'right'] as const) as sideName}
			{@const zone = getChairZone(sideName)}
			{@const isHovered = hoveredChairSide === sideName}
			{@const configured = hasChairsOnSide(sideName)}

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<rect
				x={zone.x} y={zone.y} width={zone.w} height={zone.h}
				fill={isHovered ? 'rgba(234, 88, 12, 0.08)' : 'transparent'}
				stroke={isHovered ? ACCENT_COLOR : configured ? 'rgba(234, 88, 12, 0.25)' : '#e5e7eb'}
				stroke-width={isHovered ? 1.5 : 1}
				stroke-dasharray={configured || isHovered ? '' : '4 3'}
				rx="4"
				style="cursor: pointer;"
				onpointerenter={() => hoveredChairSide = sideName}
				onpointerleave={() => hoveredChairSide = null}
				onpointerdown={(e) => e.stopPropagation()}
				onclick={(e) => { e.stopPropagation(); onchairsideclick?.(sideName, e); }}
			/>

			<!-- "+" indicator on hover for unconfigured sides -->
			{#if isHovered && !configured}
				<text
					x={zone.cx} y={zone.cy}
					text-anchor="middle" dominant-baseline="central"
					font-size="13" font-weight="bold" fill={ACCENT_COLOR}
					font-family="Inter, sans-serif"
					pointer-events="none"
				>+</text>
			{/if}
		{/each}
	{/if}

	<!-- Label -->
	<text
		x={cx} y={cy - 6}
		text-anchor="middle"
		dominant-baseline="middle"
		font-family="Inter, sans-serif"
		font-size="16"
		font-weight="700"
		fill="#111827"
		pointer-events="none"
	>{table.label}</text>

	<!-- Capacity -->
	<text
		x={cx} y={cy + 12}
		text-anchor="middle"
		dominant-baseline="middle"
		font-family="Inter, sans-serif"
		font-size="10"
		fill="#6b7280"
		pointer-events="none"
	>{table.capacity}p</text>
</g>
