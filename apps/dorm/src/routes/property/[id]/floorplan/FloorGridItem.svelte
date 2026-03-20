<script lang="ts">
	import type { FloorLayoutItem } from './types';
	import { ITEM_TYPE_LABELS, ITEM_TYPE_COLORS } from './types';

	let {
		item,
		cellSize,
		selected = false,
		unitName = '',
		onSelect,
		onDragStart,
		onResizeStart
	}: {
		item: FloorLayoutItem;
		cellSize: number;
		selected?: boolean;
		unitName?: string;
		onSelect: () => void;
		onDragStart: (item: FloorLayoutItem, e: DragEvent) => void;
		onResizeStart: (item: FloorLayoutItem, e: MouseEvent) => void;
	} = $props();

	let colors = $derived(ITEM_TYPE_COLORS[item.item_type] ?? ITEM_TYPE_COLORS.CUSTOM);
	let label = $derived(
		item.label || unitName || ITEM_TYPE_LABELS[item.item_type] || item.item_type
	);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	role="button"
	tabindex="0"
	class="absolute rounded border-2 cursor-pointer select-none overflow-hidden
		flex items-center justify-center text-xs font-medium
		transition-shadow hover:shadow-md
		{colors.bg} {colors.border} {colors.text}
		{selected ? 'ring-2 ring-primary ring-offset-1 z-10' : ''}"
	style="
		left: {item.grid_x * cellSize + 1}px;
		top: {item.grid_y * cellSize + 1}px;
		width: {item.grid_w * cellSize - 2}px;
		height: {item.grid_h * cellSize - 2}px;
	"
	onclick={() => onSelect()}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
	draggable="true"
	ondragstart={(e) => onDragStart(item, e)}
>
	<span class="text-center leading-tight px-1 truncate">{label}</span>

	{#if selected}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-tl cursor-se-resize"
			onmousedown={(e) => {
				e.stopPropagation();
				onResizeStart(item, e);
			}}
		></div>
	{/if}
</div>
