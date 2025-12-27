<script lang="ts">
	import {
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
		activeTool = $bindable<ToolName>(null),
		disabled = false,
		onToolChange
	}: {
		activeTool?: ToolName;
		disabled?: boolean;
		onToolChange?: (tool: ToolName) => void;
	} = $props();

	// Map icon names to components
	const iconMap: Record<string, typeof Lasso> = {
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
			activeTool = null;
			onToolChange?.(null);
		} else {
			activeTool = toolId;
			onToolChange?.(toolId);
		}
	}

	// Group tools by category for visual separation
	const selectionTools = TOOL_METADATA.filter((t) => t.category === 'selection');
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
	<!-- Selection Tools -->
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
