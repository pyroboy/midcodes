<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Scissors, PaintBucket, Trash2, Loader2 } from 'lucide-svelte';

	type SelectionAction = 'copy' | 'fill' | 'delete';

	let {
		open = $bindable(false),
		position = { x: 50, y: 50 },
		isProcessing = false,
		showFill = false,
		showDelete = false,
		onAction
	}: {
		/** Whether the popover is open */
		open?: boolean;
		/** Position as percentage (0-100) relative to parent */
		position?: { x: number; y: number };
		/** Show loading spinner on buttons */
		isProcessing?: boolean;
		/** Show the Fill button (requires color context) */
		showFill?: boolean;
		/** Show the Delete button (for erasing selection) */
		showDelete?: boolean;
		/** Callback when an action is selected */
		onAction?: (action: SelectionAction) => void;
	} = $props();

	function handleAction(action: SelectionAction) {
		if (isProcessing) return;
		onAction?.(action);
	}
</script>

{#if open}
	<div
		class="absolute w-0 h-0 z-[10003]"
		style="left: {position.x}%; top: {position.y}%;"
		data-selection-popover
	>
		<Popover.Root bind:open>
			<Popover.Trigger class="w-0 h-0 opacity-0" />
			<Popover.Content
				side="top"
				sideOffset={10}
				class="w-auto p-1.5 bg-zinc-900/95 border-zinc-700/50 shadow-xl backdrop-blur-sm z-[10010] pointer-events-auto"
			>
				<div class="flex items-center gap-1">
					<!-- Copy to Layer -->
					<Button
						size="sm"
						variant="ghost"
						class="h-8 px-3 text-xs gap-1.5 text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50 disabled:opacity-50"
						onclick={() => handleAction('copy')}
						disabled={isProcessing}
						title="Copy selection to new layer"
					>
						{#if isProcessing}
							<Loader2 class="w-3.5 h-3.5 animate-spin" />
						{:else}
							<Scissors class="w-3.5 h-3.5" />
						{/if}
						<span class="font-medium">Copy</span>
					</Button>

					{#if showFill}
						<!-- Fill Selection -->
						<Button
							size="sm"
							variant="ghost"
							class="h-8 px-3 text-xs gap-1.5 text-zinc-50 hover:bg-zinc-800 hover:text-zinc-50 disabled:opacity-50"
							onclick={() => handleAction('fill')}
							disabled={isProcessing}
							title="Fill selection with current color"
						>
							<PaintBucket class="w-3.5 h-3.5" />
							<span class="font-medium">Fill</span>
						</Button>
					{/if}

					{#if showDelete}
						<!-- Delete/Erase Selection -->
						<Button
							size="sm"
							variant="ghost"
							class="h-8 px-3 text-xs gap-1.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
							onclick={() => handleAction('delete')}
							disabled={isProcessing}
							title="Delete selection (make transparent)"
						>
							<Trash2 class="w-3.5 h-3.5" />
							<span class="font-medium">Delete</span>
						</Button>
					{/if}
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
{/if}
