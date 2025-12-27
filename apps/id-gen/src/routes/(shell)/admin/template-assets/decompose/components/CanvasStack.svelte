<script lang="ts">
	import { onMount } from 'svelte';
	import { getToolCursor, TOOL_SHORTCUTS, type ToolName } from '$lib/logic/tools';
	import type { LayerManager } from '$lib/logic/LayerManager.svelte';
	import type { ToolManager } from '$lib/logic/ToolManager.svelte';
	import type { HistoryManager } from '$lib/logic/HistoryManager.svelte';
	import ToolSelector from './ToolSelector.svelte';
	import ToolOptions from './ToolOptions.svelte';

	let {
		layerManager,
		toolManager,
		historyManager,
		children,
		disabled = false,
		onDuplicate,
		onDelete,
		onMoveLayer,
		selectedLayerId
	}: {
		layerManager: LayerManager;
		toolManager: ToolManager;
		historyManager: HistoryManager;
		children?: import('svelte').Snippet;
		disabled?: boolean;
		onDuplicate?: () => void;
		onDelete?: () => void;
		onMoveLayer?: (direction: 'up' | 'down') => void;
		selectedLayerId?: string | null;
	} = $props();

	// Derived cursor style from active tool
	const cursorStyle = $derived(getToolCursor(toolManager.activeTool));

	// Handle keyboard shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		const isCmdOrCtrl = e.metaKey || e.ctrlKey; // Added for Ctrl/Cmd check
		const isShift = e.shiftKey;

		// Ignore if typing in input
		const target = e.target as HTMLElement; // Modified input check
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
			return;
		}

		const key = e.key.toLowerCase();

		// Duplicate Layer (Ctrl+D)
		if (isCmdOrCtrl && key === 'd') {
			e.preventDefault();
			onDuplicate?.();
			return;
		}

		// Delete Layer (Delete / Backspace)
		if (key === 'delete' || key === 'backspace') {
			// Don't delete if we are actively drawing/selecting?
			// Check active tool state if needed, but usually safe.
			if (selectedLayerId) {
				e.preventDefault();
				onDelete?.();
				return;
			}
		}

		// Move Layer (Shift + [ / ])
		// [ = Down, ] = Up (visually in our bottom-to-top list)
		// But in array terms: "up" (higher Z) is later in array, "down" is earlier.
		// Our moveLayer handles 'up'/'down' semantics.
		if (isShift) {
			if (key === '[') {
				e.preventDefault();
				onMoveLayer?.('down');
				return;
			}
			if (key === ']') {
				e.preventDefault();
				onMoveLayer?.('up');
				return;
			}
		}

		// Tool shortcuts (only if no modifiers except shift for tools that might use it?)
		if (!isCmdOrCtrl && key in TOOL_SHORTCUTS) {
			e.preventDefault();
			const tool = TOOL_SHORTCUTS[key];
			toolManager.setTool(tool);
			return;
		}

		// Escape to deselect tool
		if (key === 'escape') {
			e.preventDefault();
			toolManager.setTool(null);
			return;
		}

		// Brush size shortcuts (+ / - and brackets)
		if (toolManager.activeTool === 'brush' || toolManager.activeTool === 'eraser') {
			// Decrease size
			if (key === '[' || key === '-' || key === '_') {
				e.preventDefault();
				const newSize = Math.max(1, toolManager.toolOptions.size - 5);
				toolManager.setToolOption('size', newSize);
				return;
			}
			// Increase size
			if (key === ']' || key === '=' || key === '+') {
				e.preventDefault();
				const newSize = Math.min(100, toolManager.toolOptions.size + 5);
				toolManager.setToolOption('size', newSize);
				return;
			}
		}
	}

	// Handle click outside to deselect tool
	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Only deselect if clicking on the canvas area background (not toolbar or content)
		if (target.closest('.canvas-stack-content') && !target.closest('.tool-interactive')) {
			// Don't deselect - this is where drawing/selection happens
			return;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div
	class="canvas-stack relative flex flex-col gap-3"
	role="application"
	aria-label="Canvas Editor"
>
	<!-- Toolbar Area -->
	<div class="flex items-center justify-center gap-3 flex-wrap">
		<ToolSelector
			activeTool={toolManager.activeTool}
			{disabled}
			onToolChange={(tool) => toolManager.setTool(tool)}
		/>
		<ToolOptions
			activeTool={toolManager.activeTool}
			toolOptions={toolManager.toolOptions}
			onOptionsChange={(opts) => toolManager.setToolOptions(opts)}
		/>
	</div>

	<!-- Canvas Content Area -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="canvas-stack-content relative touch-none"
		style="cursor: {cursorStyle}; touch-action: none;"
		onclick={handleOutsideClick}
		onkeydown={(e) => {
			// Handled by the global keydown listener
			if (e.key === 'Escape') handleOutsideClick(e as unknown as MouseEvent);
		}}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
