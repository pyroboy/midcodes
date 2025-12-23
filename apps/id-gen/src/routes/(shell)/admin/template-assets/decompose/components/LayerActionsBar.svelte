<script lang="ts">
	import { Wand2, ZoomIn, Eraser, Crop, ImageDown, Loader2 } from 'lucide-svelte';

	let {
		selectedLayerId,
		selectedLayerName,
		isAnyProcessing,
		isSettingMain,
		pendingHistoryAction,
		isOriginalLayer,
		onAction,
		onSetAsMain,
		onClearSelection
	}: {
		selectedLayerId: string | null;
		selectedLayerName: string | null;
		isAnyProcessing: boolean;
		isSettingMain: boolean;
		pendingHistoryAction: { type: string; layerId?: string } | null;
		isOriginalLayer: boolean;
		onAction: (action: 'decompose' | 'upscale' | 'remove' | 'crop', layerId: string) => void;
		onSetAsMain: (layerId: string) => void;
		onClearSelection: () => void;
	} = $props();
</script>

<div class="rounded-xl border border-border bg-card p-3">
	<div class="flex items-center justify-between mb-2">
		<span class="text-xs font-medium text-muted-foreground">
			{selectedLayerId
				? `Selected: ${selectedLayerName || 'Layer'}`
				: 'Select a layer to enable actions'}
		</span>
		{#if selectedLayerId}
			<button
				class="text-xs text-muted-foreground hover:text-foreground"
				onclick={onClearSelection}
			>
				Clear
			</button>
		{/if}
	</div>
	<div class="grid grid-cols-5 gap-2">
		<button
			class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-violet-500/10 hover:border-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
			onclick={() => selectedLayerId && onAction('decompose', selectedLayerId)}
			disabled={!selectedLayerId || isAnyProcessing}
			title="Decompose layer"
		>
			{#if pendingHistoryAction?.type === 'decompose' && pendingHistoryAction?.layerId === selectedLayerId}
				<Loader2 class="h-5 w-5 text-violet-600 animate-spin" />
			{:else}
				<Wand2 class="h-5 w-5 text-violet-600" />
			{/if}
			<span class="text-[10px] font-medium">Decompose</span>
		</button>
		<button
			class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-green-500/10 hover:border-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
			onclick={() => selectedLayerId && onAction('upscale', selectedLayerId)}
			disabled={!selectedLayerId || isAnyProcessing}
			title="Upscale layer"
		>
			{#if pendingHistoryAction?.type === 'upscale' && pendingHistoryAction?.layerId === selectedLayerId}
				<Loader2 class="h-5 w-5 text-green-600 animate-spin" />
			{:else}
				<ZoomIn class="h-5 w-5 text-green-600" />
			{/if}
			<span class="text-[10px] font-medium">Upscale</span>
		</button>
		<button
			class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:border-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
			onclick={() => selectedLayerId && onAction('remove', selectedLayerId)}
			disabled={!selectedLayerId || isAnyProcessing}
			title="Remove element from layer"
		>
			{#if pendingHistoryAction?.type === 'remove' && pendingHistoryAction?.layerId === selectedLayerId}
				<Loader2 class="h-5 w-5 text-red-600 animate-spin" />
			{:else}
				<Eraser class="h-5 w-5 text-red-600" />
			{/if}
			<span class="text-[10px] font-medium">Remove</span>
		</button>
		<button
			class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
			onclick={() => selectedLayerId && onAction('crop', selectedLayerId)}
			disabled={!selectedLayerId || isAnyProcessing}
			title="Crop layer"
		>
			{#if pendingHistoryAction?.type === 'crop' && pendingHistoryAction?.layerId === selectedLayerId}
				<Loader2 class="h-5 w-5 text-emerald-600 animate-spin" />
			{:else}
				<Crop class="h-5 w-5 text-emerald-600" />
			{/if}
			<span class="text-[10px] font-medium">Crop</span>
		</button>
		<button
			class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
			onclick={() => selectedLayerId && onSetAsMain(selectedLayerId)}
			disabled={!selectedLayerId || isAnyProcessing || isSettingMain || isOriginalLayer}
			title="Set layer as template background"
		>
			<ImageDown class="h-5 w-5 text-cyan-600" />
			<span class="text-[10px] font-medium">Set as BG</span>
		</button>
	</div>
</div>
