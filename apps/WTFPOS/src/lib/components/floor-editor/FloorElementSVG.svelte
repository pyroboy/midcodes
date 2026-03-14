<script lang="ts">
	import type { FloorElement } from '$lib/types';

	interface Props {
		element: FloorElement;
		selected?: boolean;
		onclick?: (e: MouseEvent) => void;
		onpointerdown?: (e: PointerEvent) => void;
		onrotatestart?: (e: PointerEvent) => void;
		onresizestart?: (corner: 'nw' | 'ne' | 'sw' | 'se', e: PointerEvent) => void;
	}

	let { element, selected = false, onclick, onpointerdown, onrotatestart, onresizestart }: Props = $props();

	const ACCENT_COLOR = '#EA580C';
	const H_SIZE = 8;
	const H_HALF = H_SIZE / 2;
	const ROT_OFFSET = 24;

	const cx = $derived(element.x + element.width / 2);
	const cy = $derived(element.y + element.height / 2);
	const rotation = $derived(element.rotation ?? 0);
	const color = $derived(element.color ?? elementDefaultColor(element.type));
	const opacity = $derived(element.opacity ?? 0.7);

	function elementDefaultColor(type: string): string {
		switch (type) {
			case 'wall':     return '#374151';
			case 'divider':  return '#6b7280';
			case 'entrance': return '#10b981';
			case 'exit':     return '#ef4444';
			case 'bar':      return '#8b5cf6';
			case 'kitchen':  return '#f59e0b';
			case 'stairs':   return '#3b82f6';
			case 'furniture': return '#92400e';
			case 'label':    return '#1e293b';
			default:         return '#9ca3af';
		}
	}

	function elementEmoji(type: string): string {
		switch (type) {
			case 'entrance': return '🚪';
			case 'exit':     return '🚪';
			case 'bar':      return '🍺';
			case 'kitchen':  return '🍳';
			case 'stairs':   return '🪜';
			default:         return '';
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<g
	role="button"
	tabindex="0"
	transform="rotate({rotation} {cx} {cy})"
	onclick={onclick}
	onpointerdown={onpointerdown}
	style="cursor: grab;"
>
	<!-- Invisible hit area so the entire bounding box is draggable -->
	<rect
		x={element.x} y={element.y}
		width={element.width} height={element.height}
		fill="transparent"
		stroke="none"
	/>

	{#if element.shape === 'rect'}
		<rect
			x={element.x} y={element.y}
			width={element.width} height={element.height}
			fill="none"
			stroke={selected ? '#EA580C' : color}
			stroke-width={selected ? 2 : 1.5}
			stroke-dasharray="6 3"
			{opacity}
			rx="4"
			pointer-events="none"
		/>
	{:else if element.shape === 'circle'}
		<ellipse
			cx={cx} cy={cy}
			rx={element.width / 2} ry={element.height / 2}
			fill="none"
			stroke={selected ? '#EA580C' : color}
			stroke-width={selected ? 2 : 1.5}
			stroke-dasharray="6 3"
			{opacity}
			pointer-events="none"
		/>
	{:else if element.shape === 'line'}
		<line
			x1={element.x} y1={element.y}
			x2={element.x + element.width} y2={element.y + element.height}
			stroke={color}
			stroke-width="2"
			stroke-dasharray="6 3"
			{opacity}
			pointer-events="none"
		/>
	{/if}

	{#if element.label}
		<text
			x={cx} y={cy}
			text-anchor="middle"
			dominant-baseline="middle"
			font-family="Inter, sans-serif"
			font-size="11"
			font-weight="600"
			fill={color}
			pointer-events="none"
		>{elementEmoji(element.type)} {element.label}</text>
	{/if}

	{#if selected}
		<rect
			x={element.x - 3} y={element.y - 3}
			width={element.width + 6} height={element.height + 6}
			rx="6"
			fill="none"
			stroke={ACCENT_COLOR}
			stroke-width="2"
			stroke-dasharray="5 3"
			opacity="0.8"
		/>

		<!-- Rotation stem line -->
		<line
			x1={cx} y1={element.y - 3}
			x2={cx} y2={element.y - ROT_OFFSET}
			stroke={ACCENT_COLOR} stroke-width="1.5" stroke-dasharray="3 2"
			pointer-events="none"
		/>

		<!-- Rotation handle circle -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<circle
			cx={cx} cy={element.y - ROT_OFFSET}
			r="5"
			fill={ACCENT_COLOR} stroke="white" stroke-width="1.5"
			style="cursor: crosshair;"
			onpointerdown={(e) => { e.stopPropagation(); onrotatestart?.(e); }}
		/>

		<!-- Corner resize handles -->
		{#each [
			{ id: 'nw', x: element.x,                y: element.y                 },
			{ id: 'ne', x: element.x + element.width, y: element.y                 },
			{ id: 'sw', x: element.x,                y: element.y + element.height },
			{ id: 'se', x: element.x + element.width, y: element.y + element.height },
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
</g>
