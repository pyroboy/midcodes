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
	}

	let { table, selected = false, mode = 'editor', onclick, onpointerdown, onresizestart, onrotatestart }: Props = $props();

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

		if (side.type === 'lounge') {
			// One rect spanning full side
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

		if (side.type === 'diner') {
			// Two lounge-width rects side by side (booth style)
			const halfSpan = (sideSpan - CHAIR_GAP * 3) / 2;
			if (isHoriz) {
				const y = side_name === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP;
				return [
					{ x: table.x + CHAIR_GAP, y, w: halfSpan, h: CHAIR_THICKNESS },
					{ x: table.x + CHAIR_GAP * 2 + halfSpan, y, w: halfSpan, h: CHAIR_THICKNESS }
				];
			} else {
				const x = side_name === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP;
				return [
					{ x, y: table.y + CHAIR_GAP, w: CHAIR_THICKNESS, h: halfSpan },
					{ x, y: table.y + CHAIR_GAP * 2 + halfSpan, w: CHAIR_THICKNESS, h: halfSpan }
				];
			}
		}

		if (side.type === 'l-shape') {
			// Full-width + one corner strip
			if (isHoriz) {
				const y = side_name === 'top' ? table.y - CHAIR_THICKNESS - CHAIR_GAP : table.y + H + CHAIR_GAP;
				return [
					{ x: table.x + CHAIR_GAP, y, w: W - CHAIR_GAP * 2, h: CHAIR_THICKNESS },
					// corner arm going down
					{ x: table.x + W - CHAIR_GAP - CHAIR_THICKNESS, y: y + CHAIR_THICKNESS, w: CHAIR_THICKNESS, h: CHAIR_THICKNESS }
				];
			} else {
				const x = side_name === 'left' ? table.x - CHAIR_THICKNESS - CHAIR_GAP : table.x + W + CHAIR_GAP;
				return [
					{ x, y: table.y + CHAIR_GAP, w: CHAIR_THICKNESS, h: H - CHAIR_GAP * 2 },
					{ x: x + CHAIR_THICKNESS, y: table.y + H - CHAIR_GAP - CHAIR_THICKNESS, w: CHAIR_THICKNESS, h: CHAIR_THICKNESS }
				];
			}
		}

		return [];
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
