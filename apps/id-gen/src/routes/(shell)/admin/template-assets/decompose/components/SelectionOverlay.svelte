<script lang="ts">
	import type { LassoTool } from '$lib/logic/tools/LassoTool.svelte';
	import type { RectangleTool } from '$lib/logic/tools/RectangleTool.svelte';
	import type { EllipseTool } from '$lib/logic/tools/EllipseTool.svelte';
	import type { ToolName } from '$lib/logic/tools';
	import SelectionActions from './SelectionActions.svelte';

	type SelectionAction = 'copy' | 'fill' | 'delete';

	let {
		activeTool,
		lassoTool,
		rectangleTool,
		ellipseTool,
		isProcessing = false,
		onAction
	}: {
		activeTool: ToolName;
		lassoTool?: LassoTool;
		rectangleTool?: RectangleTool;
		ellipseTool?: EllipseTool;
		isProcessing?: boolean;
		onAction?: (action: SelectionAction) => void;
	} = $props();

	// Derived states from each tool
	const lassoPoints = $derived(lassoTool?.points ?? []);
	const isLassoClosed = $derived(lassoTool?.isClosed ?? false);
	const lassoPopoverOpen = $derived(lassoTool?.isPopoverOpen ?? false);

	const rectBounds = $derived(rectangleTool?.getBounds());
	const isRectClosed = $derived(rectangleTool?.isClosed ?? false);
	const rectPopoverOpen = $derived(rectangleTool?.isPopoverOpen ?? false);

	const ellipseParams = $derived(ellipseTool?.getEllipseParams());
	const isEllipseClosed = $derived(ellipseTool?.isClosed ?? false);
	const ellipsePopoverOpen = $derived(ellipseTool?.isPopoverOpen ?? false);

	// Popover positions
	const lassoPopoverPos = $derived(lassoTool?.getPopoverPosition());
	const rectPopoverPos = $derived(rectangleTool?.getPopoverPosition());
	const ellipsePopoverPos = $derived(ellipseTool?.getPopoverPosition());
</script>

<!-- Lasso Overlay -->
{#if activeTool === 'lasso' && lassoPoints.length > 0}
	<svg
		class="absolute inset-0 w-full h-full pointer-events-none z-[10001]"
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
	>
		{#if isLassoClosed}
			<path
				d={`M0,0 H100 V100 H0 Z ` +
					`M${lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')} Z`}
				fill-rule="evenodd"
				fill="rgba(0,0,0,0.6)"
			/>
			<polygon
				points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
				fill="rgba(255,255,255,0.1)"
			/>
		{/if}

		{#if isLassoClosed}
			<polygon
				points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
				fill="none"
				stroke="white"
				stroke-width="1.5"
				vector-effect="non-scaling-stroke"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<polygon
				points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
				fill="none"
				stroke="black"
				stroke-width="1.5"
				stroke-dasharray="4 4"
				vector-effect="non-scaling-stroke"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="animate-march"
			/>
		{:else}
			<polyline
				points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
				fill="none"
				stroke="white"
				stroke-width="1.5"
				vector-effect="non-scaling-stroke"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<polyline
				points={lassoPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
				fill="none"
				stroke="black"
				stroke-width="1.5"
				stroke-dasharray="4 4"
				vector-effect="non-scaling-stroke"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="animate-march"
			/>
		{/if}
	</svg>

	<!-- Lasso Handles -->
	<svg class="absolute inset-0 w-full h-full pointer-events-none z-[10002]">
		{#each lassoPoints as p, i}
			<circle
				cx="{p.x * 100}%"
				cy="{p.y * 100}%"
				r="3"
				fill="white"
				stroke="black"
				stroke-width="1"
			/>
			{#if i === 0 && lassoPoints.length > 2 && !isLassoClosed}
				<circle
					cx="{p.x * 100}%"
					cy="{p.y * 100}%"
					r="5"
					fill="rgba(239, 68, 68, 0.4)"
					stroke="rgba(239, 68, 68, 0.9)"
					stroke-width="1"
					class="animate-pulse"
				/>
			{/if}
		{/each}
	</svg>

	{#if isLassoClosed && lassoPopoverOpen && lassoPopoverPos}
		<SelectionActions
			open={lassoPopoverOpen}
			position={lassoPopoverPos}
			{isProcessing}
			{onAction}
			showFill={true}
			showDelete={true}
		/>
	{/if}
{/if}

<!-- Rectangle Overlay -->
{#if activeTool === 'rectangle' && rectBounds}
	<svg
		class="absolute inset-0 w-full h-full pointer-events-none z-[10001]"
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
	>
		{#if isRectClosed}
			<!-- Dim area outside selection -->
			<path
				d={`M0,0 H100 V100 H0 Z M${rectBounds.x * 100},${rectBounds.y * 100} h${rectBounds.width * 100} v${rectBounds.height * 100} h-${rectBounds.width * 100} Z`}
				fill-rule="evenodd"
				fill="rgba(0,0,0,0.6)"
			/>
			<rect
				x={rectBounds.x * 100}
				y={rectBounds.y * 100}
				width={rectBounds.width * 100}
				height={rectBounds.height * 100}
				fill="rgba(255,255,255,0.1)"
			/>
		{/if}

		<!-- Border -->
		<rect
			x={rectBounds.x * 100}
			y={rectBounds.y * 100}
			width={rectBounds.width * 100}
			height={rectBounds.height * 100}
			fill="none"
			stroke="white"
			stroke-width="1.5"
			vector-effect="non-scaling-stroke"
		/>
		<rect
			x={rectBounds.x * 100}
			y={rectBounds.y * 100}
			width={rectBounds.width * 100}
			height={rectBounds.height * 100}
			fill="none"
			stroke="black"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			vector-effect="non-scaling-stroke"
			class="animate-march"
		/>
	</svg>

	{#if isRectClosed && rectPopoverOpen && rectPopoverPos}
		<SelectionActions
			open={rectPopoverOpen}
			position={rectPopoverPos}
			{isProcessing}
			{onAction}
			showFill={true}
			showDelete={true}
		/>
	{/if}
{/if}

<!-- Ellipse Overlay -->
{#if activeTool === 'ellipse' && ellipseParams}
	<svg
		class="absolute inset-0 w-full h-full pointer-events-none z-[10001]"
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
	>
		{#if isEllipseClosed}
			<!-- Dim area outside selection -->
			<defs>
				<mask id="ellipse-mask">
					<rect x="0" y="0" width="100" height="100" fill="white" />
					<ellipse
						cx={ellipseParams.cx * 100}
						cy={ellipseParams.cy * 100}
						rx={ellipseParams.rx * 100}
						ry={ellipseParams.ry * 100}
						fill="black"
					/>
				</mask>
			</defs>
			<rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#ellipse-mask)" />
			<ellipse
				cx={ellipseParams.cx * 100}
				cy={ellipseParams.cy * 100}
				rx={ellipseParams.rx * 100}
				ry={ellipseParams.ry * 100}
				fill="rgba(255,255,255,0.1)"
			/>
		{/if}

		<!-- Border -->
		<ellipse
			cx={ellipseParams.cx * 100}
			cy={ellipseParams.cy * 100}
			rx={ellipseParams.rx * 100}
			ry={ellipseParams.ry * 100}
			fill="none"
			stroke="white"
			stroke-width="1.5"
			vector-effect="non-scaling-stroke"
		/>
		<ellipse
			cx={ellipseParams.cx * 100}
			cy={ellipseParams.cy * 100}
			rx={ellipseParams.rx * 100}
			ry={ellipseParams.ry * 100}
			fill="none"
			stroke="black"
			stroke-width="1.5"
			stroke-dasharray="4 4"
			vector-effect="non-scaling-stroke"
			class="animate-march"
		/>
	</svg>

	{#if isEllipseClosed && ellipsePopoverOpen && ellipsePopoverPos}
		<SelectionActions
			open={ellipsePopoverOpen}
			position={ellipsePopoverPos}
			{isProcessing}
			{onAction}
			showFill={true}
			showDelete={true}
		/>
	{/if}
{/if}

<style>
	@keyframes march {
		to {
			stroke-dashoffset: -200;
		}
	}
	.animate-march {
		animation: march 5s linear infinite;
	}
</style>
