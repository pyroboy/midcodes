<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Layers, Loader2, Save, RotateCcw } from 'lucide-svelte';

	let {
		assetName,
		activeSide = $bindable('front'),
		hasBackImage,
		frontLayersCount,
		backLayersCount,
		frontHistoryCount,
		backHistoryCount,
		hasUpscaledPreview,
		isSaving,
		onSave,
		onReset
	}: {
		assetName: string;
		activeSide: 'front' | 'back';
		hasBackImage: boolean;
		frontLayersCount: number;
		backLayersCount: number;
		frontHistoryCount: number;
		backHistoryCount: number;
		hasUpscaledPreview: boolean;
		isSaving: boolean;
		onSave: () => void;
		onReset: () => void;
	} = $props();

	let showResetButton = $derived(frontLayersCount > 0 || backLayersCount > 0 || hasUpscaledPreview);
</script>

<div class="mb-6 space-y-4">
	<!-- Top Header -->
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<a
					href="/admin/template-assets/manage"
					class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to Manage
				</a>
			</div>
			<h1 class="mt-2 flex items-center gap-3 text-2xl font-bold text-foreground">
				<Layers class="h-6 w-6 text-primary" />
				Decompose: {assetName}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Extract layers using AI for template element creation
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				onclick={onSave}
				disabled={isSaving || (frontLayersCount === 0 && backLayersCount === 0)}
			>
				{#if isSaving}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Save class="mr-2 h-4 w-4" />
					Save to Template
				{/if}
			</Button>
		</div>
	</div>

	<!-- Side Tabs -->
	<div class="flex gap-2 items-center">
		<button
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeSide === 'front'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			onclick={() => (activeSide = 'front')}
		>
			Front
			{#if frontLayersCount > 0 || frontHistoryCount > 0}
				<span class="ml-1 text-xs opacity-80">
					({frontLayersCount} layers{frontHistoryCount ? ` • ${frontHistoryCount} history` : ''})
				</span>
			{/if}
		</button>
		<button
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeSide === 'back'
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			disabled={!hasBackImage}
			onclick={() => (activeSide = 'back')}
		>
			Back
			{#if backLayersCount > 0 || backHistoryCount > 0}
				<span class="ml-1 text-xs opacity-80">
					({backLayersCount} layers{backHistoryCount ? ` • ${backHistoryCount} history` : ''})
				</span>
			{/if}
			{#if !hasBackImage}
				<span class="ml-1 text-xs opacity-50">(N/A)</span>
			{/if}
		</button>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Reset Current Side Button -->
		{#if showResetButton}
			<button
				class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors
					bg-destructive/10 text-destructive hover:bg-destructive/20
					flex items-center gap-1.5"
				onclick={onReset}
				title="Clear layers and reload latest template image"
			>
				<RotateCcw class="h-3.5 w-3.5" />
				Reset
			</button>
		{/if}
	</div>
</div>
