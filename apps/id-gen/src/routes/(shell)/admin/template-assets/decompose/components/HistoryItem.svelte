<script lang="ts">
	import { Check, ChevronDown, ChevronUp, Download, RotateCcw } from 'lucide-svelte';
	import type { HistoryItem } from '$lib/schemas/decompose.schema';

	let {
		item,
		isActive = false,
		isExpanded = false,

		// Event Handlers
		onLoadRequest,
		onToggleExpanded,
		onDragStart // For single result items
		// For expanded sub-layers - if distinct from onDragStart
		// We can just use onDragStart with payload differentiation
	}: {
		item: HistoryItem;
		isActive?: boolean;
		isExpanded?: boolean;
		onLoadRequest: () => void;
		onToggleExpanded: () => void;
		onDragStart: (e: DragEvent) => void;
	} = $props();

	// Computed Logic
	let isSingleResult = $derived(!item.layers || item.layers.length === 0);

	let display = $derived.by(() => {
		// Handle pending/processing status
		if (item.status === 'pending') {
			return {
				label: 'QUEUED',
				color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse'
			};
		}
		if (item.status === 'processing') {
			return {
				label: 'PROCESSING',
				color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse'
			};
		}
		if (item.status === 'failed') {
			return {
				label: 'FAILED',
				color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
			};
		}

		// Determine label and color based on history type
		if (item.provider?.includes('upscale') || item.model?.includes('upscale')) {
			return {
				label: 'UPSCALE',
				color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
			};
		}
		if (item.layers?.length > 0) {
			return {
				label: `DECOMPOSE (${item.layers.length})`,
				color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
			};
				color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
			};
		}
		if (item.model === 'DRAW') {
			return {
				label: 'DRAW',
				color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
			};
		}
		if (item.model === 'ERASE') {
			return {
				label: 'ERASE',
				color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
			};
		}
		if (item.model === 'FILL') {
			return {
				label: 'FILL',
				color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
			};
		}
		if ((item as any).action === 'crop') {
			return {
				label: 'CROP',
				color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
			};
		}
		if (
			(item as any).action === 'lasso-cut' ||
			(item as any).action === 'lasso-copy' ||
			(item as any).action === 'copy'
		) {
			return {
				label: 'COPY',
				color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
			};
		}
		if (
			(item as any).action === 'remove' ||
			item.provider?.includes('remove') ||
			item.model?.includes('remove')
		) {
			return {
				label: 'REMOVE',
				color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
			};
		}
		return {
			label: 'GENERATION',
			color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
		};
	});
</script>

<div class="space-y-2">
	<!-- History Item Card -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="w-full group relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2 overflow-hidden transition-all hover:border-primary/50 hover:shadow-md
			{isActive ? 'ring-2 ring-primary border-primary' : ''}
			{isSingleResult ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}"
		onclick={(e) => {
			if (!isSingleResult) onToggleExpanded();
		}}
		draggable={isSingleResult}
		ondragstart={onDragStart}
	>
		<!-- Thumbnail (Left) -->
		<div
			class="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded border border-border bg-muted"
		>
			<img
				src={isSingleResult && item.resultUrl ? item.resultUrl : item.inputImageUrl}
				alt="AI Generation"
				class="w-full h-full object-cover"
			/>

			<!-- Active Indicator Overlay -->
			{#if isActive}
				<div
					class="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none"
				>
					<Check class="h-4 w-4 text-primary bg-background/80 rounded-full p-0.5" />
				</div>
			{/if}
		</div>

		<!-- Meta Info (Right) -->
		<div class="flex-1 min-w-0 text-left">
			<div class="flex items-center justify-between mb-1">
				<p class="text-[10px] font-mono font-medium text-foreground">
					{item.id.slice(0, 8)}
				</p>
				<span class="text-[9px] text-muted-foreground">
					{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
				</span>
			</div>

			<div class="flex items-center justify-between">
				<div class="flex flex-col">
					<span
						class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium self-start mb-0.5
							{display.color}"
					>
						{display.label}
					</span>
				</div>

				<!-- Actions -->
				<div
					class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
					onclick={(e) => e.stopPropagation()}
				>
					<button
						class="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
						title="Load this state"
						onclick={onLoadRequest}
						disabled={item.status === 'pending' ||
							item.status === 'processing' ||
							item.status === 'failed'}
					>
						<RotateCcw class="h-3 w-3" />
					</button>
					{#if !isSingleResult && item.status === 'completed'}
						<button
							class="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
							onclick={onToggleExpanded}
						>
							{#if isExpanded}
								<ChevronUp class="h-3 w-3" />
							{:else}
								<ChevronDown class="h-3 w-3" />
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Expanded Layers List (Draggable) -->
	{#if isExpanded && !isSingleResult && item.layers}
		<div class="pl-4 space-y-2 border-l-2 border-border/50">
			<p class="text-[10px] text-muted-foreground font-medium">Drag layers to add:</p>
			{#each item.layers as layer, i}
				<div
					class="flex items-center gap-2 p-2 rounded border border-border bg-background hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
					draggable="true"
					ondragstart={(e) => {
						e.stopPropagation();
						// Construct Drag Data for simple layer
						e.dataTransfer?.setData(
							'application/json',
							JSON.stringify({
								type: 'history-layer',
								layer: layer,
								imageUrl: layer.imageUrl || layer.url
							})
						);
					}}
					role="button"
					tabindex="0"
				>
					<div class="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
						<img src={layer.imageUrl || layer.url} alt="Layer" class="w-full h-full object-cover" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-xs font-medium truncate">{layer.name || `Layer ${i + 1}`}</p>
						<p class="text-[10px] text-muted-foreground">z-index: {layer.zIndex || i}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
