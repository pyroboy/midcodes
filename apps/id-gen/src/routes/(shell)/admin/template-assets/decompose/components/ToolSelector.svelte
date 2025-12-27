<script lang="ts">
	import {
		Move,
		Lasso,
		Square,
		Circle,
		Paintbrush,
		Eraser,
		PaintBucket,
		Pipette,
		Blend
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { TOOL_METADATA, type ToolName } from '$lib/logic/tools';

	let {
		activeTool = null,
		disabled = false,
		onToolChange
	}: {
		activeTool?: ToolName;
		disabled?: boolean;
		onToolChange?: (tool: ToolName) => void;
	} = $props();

	// Map icon names to components
	const iconMap: Record<string, typeof Lasso> = {
		Move,
		Lasso,
		Square,
		Circle,
		Paintbrush,
		Eraser,
		PaintBucket,
		Pipette,
		Blend
	};

	function selectTool(toolId: ToolName) {
		if (activeTool === toolId) {
			// Toggle off if already selected
			onToolChange?.(null);
		} else {
			onToolChange?.(toolId);
		}
	}

	// Group tools by category for visual separation
	const selectionTools = TOOL_METADATA.filter((t) => t.category === 'selection' && t.id !== 'move');
	const drawingTools = TOOL_METADATA.filter((t) => t.category === 'drawing');
	const fillTools = TOOL_METADATA.filter((t) => t.category === 'fill');
	const utilityTools = TOOL_METADATA.filter((t) => t.category === 'utility');
</script>

{#snippet ToolButton(tool: (typeof TOOL_METADATA)[0])}
	{@const Icon = iconMap[tool.icon]}
	<Tooltip.Root delayDuration={300}>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant={activeTool === tool.id ? 'secondary' : 'ghost'}
					size="icon"
					class="h-9 w-9 transition-all {activeTool === tool.id
						? 'ring-2 ring-primary/50 bg-primary/10'
						: 'hover:bg-muted'}"
					onclick={() => selectTool(tool.id)}
					{disabled}
				>
					{#if Icon}
						<Icon class="h-4 w-4 {activeTool === tool.id ? tool.color : 'text-muted-foreground'}" />
					{/if}
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom" class="flex items-center gap-2">
			<span>{tool.label}</span>
			<kbd class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
				{tool.shortcut}
			</kbd>
		</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<div
	class="flex items-center gap-1 rounded-lg border border-border bg-background/90 px-2 py-1.5 shadow-lg backdrop-blur-sm"
>
	<!-- Move Tool (Custom Icon) -->
	<Tooltip.Root delayDuration={300}>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant={activeTool === 'move' ? 'secondary' : 'ghost'}
					size="icon"
					class="w-10 h-10 {activeTool === 'move'
						? 'bg-primary/20 text-primary'
						: 'hover:bg-muted'}"
					{disabled}
					onclick={() => onToolChange?.('move')}
				>
					<!-- Custom Move Icon: Cursor + 4-Way Arrow -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide-icon"
					>
						<!-- Arrow Pointer -->
						<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
						<!-- 4-Way Move Arrows (small, bottom-right) -->
						<path d="M15 19l2 2 2-2" />
						<path d="M19 15l2 2-2 2" />
						<path d="M15 21l2-2 2 2" />
						<path d="M17 17v4" />
						<path d="M17 17h4" />
					</svg>
					<span class="sr-only">Move Tool</span>
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom" class="flex items-center gap-2">
			<span>Move</span>
			<kbd class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">V</kbd>
		</Tooltip.Content>
	</Tooltip.Root>

	<!-- Other Selection Tools -->
	{#each selectionTools as tool (tool.id)}
		{@render ToolButton(tool)}
	{/each}

	<!-- Divider -->
	<div class="mx-1 h-6 w-px bg-border"></div>

	<!-- Drawing Tools -->
	{#each drawingTools as tool (tool.id)}
		{@render ToolButton(tool)}
	{/each}

	<!-- Divider -->
	<div class="mx-1 h-6 w-px bg-border"></div>

	<!-- Fill & Utility Tools -->
	{#each [...fillTools, ...utilityTools] as tool (tool.id)}
		{@render ToolButton(tool)}
	{/each}
</div>
