<script lang="ts">
	import type { PageData } from './$types';
	import {
		decomposeImage,
		saveLayers,
		getDecomposeHistoryWithStats,
		type HistoryStats
	} from '$lib/remote/index.remote';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		Layers,
		Wand2,
		Save,
		ArrowLeft,
		Loader2,
		Eye,
		EyeOff,
		ImageIcon,
		History,
		Clock,
		Check,
		AlertTriangle
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';
	import { onMount } from 'svelte';
	import { CREDIT_COSTS } from '$lib/config/credits';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
    import { Separator } from '$lib/components/ui/separator';
    import { ChevronDown, ChevronUp } from 'lucide-svelte';
    import * as Collapsible from '$lib/components/ui/collapsible';

	let { data }: { data: PageData } = $props();

	// State
	let activeSide = $state<'front' | 'back'>('front');
	let isDecomposing = $state(false);
	let isSaving = $state(false);
	
    // Decompose Settings
    let numLayers = $state(4);
    let prompt = $state("A professional portrait ID card composed of distinct layers. Foreground: A high-resolution realistic photograph of a person and sharp, legible sans-serif typography. Midground: Vector graphical elements, logos, and a high-contrast black and white QR code. Background: Clean flat geometric patterns, solid color blocks, and gradients. High contrast between the subject, text, and the background design.");
    let negativePrompt = $state("merged layers, text embedded in background, blurry text, jpeg artifacts, dirty edges around hair, transparent subject, distortion, grain, low contrast, fused elements");
    let numInferenceSteps = $state(28);
    let guidanceScale = $state(5);
    let acceleration = $state("regular");
    let showAdvancedSettings = $state(false);
    let shouldUpscale = $state(false);


	// Layers state - separate for front and back
	let frontLayers = $state<DecomposedLayer[]>([]);
	let backLayers = $state<DecomposedLayer[]>([]);

	// Selected layer for highlighting
	let selectedLayerId = $state<string | null>(null);

	// Get current layers based on active side
	let currentLayers = $derived(activeSide === 'front' ? frontLayers : backLayers);
	let currentImageUrl = $derived(
		activeSide === 'front' ? data.asset.imageUrl : data.asset.backImageUrl
	);
	let hasBackImage = $derived(!!data.asset.backImageUrl);

	// Layer selections for saving
	let layerSelections = $state<Map<string, LayerSelection>>(new Map());

	// History State
	interface HistoryItem {
		id: string;
		createdAt: Date | null;
		inputImageUrl: string;
		layers: any[];
		creditsUsed: number | null;
		side?: 'front' | 'back' | 'unknown';
	}

	let history = $state<HistoryItem[]>([]);
	let historyStats = $state<HistoryStats | null>(null);
	let isLoadingHistory = $state(false);

	// Active history tracking
	let activeHistoryId = $state<string | null>(null);
	let hasUnsavedChanges = $state(false);

	// Confirmation dialog state
	let showConfirmDialog = $state(false);
	let pendingHistoryItem = $state<HistoryItem | null>(null);

	// Filtered history for current side
	let filteredHistory = $derived(
		history.filter((item) => item.side === activeSide || item.side === 'unknown')
	);

	// Credit cost for decomposition
	const decomposeCost = CREDIT_COSTS.AI_DECOMPOSE;

	onMount(() => {
		loadHistory();
	});

	async function loadHistory() {
		try {
			isLoadingHistory = true;
			const result = await getDecomposeHistoryWithStats();
			if (result.success) {
				history = result.history as HistoryItem[];
				historyStats = result.stats;
			} else {
				toast.error(result.error || 'Failed to load history');
			}
		} catch (err) {
			console.error('Failed to load history:', err);
			toast.error('Failed to load history');
		} finally {
			isLoadingHistory = false;
		}
	}

	function requestLoadFromHistory(item: HistoryItem) {
		// Check if there are unsaved changes
		if (hasUnsavedChanges && currentLayers.length > 0) {
			pendingHistoryItem = item;
			showConfirmDialog = true;
		} else {
			loadFromHistory(item);
		}
	}

	function confirmLoadFromHistory() {
		if (pendingHistoryItem) {
			loadFromHistory(pendingHistoryItem);
			pendingHistoryItem = null;
		}
		showConfirmDialog = false;
	}

	function cancelLoadFromHistory() {
		pendingHistoryItem = null;
		showConfirmDialog = false;
	}

	function loadFromHistory(item: HistoryItem) {
		if (!item.layers || item.layers.length === 0) {
			toast.error('No layers found in this history item.');
			return;
		}

		// Determine which side this history item belongs to
		let targetSide = activeSide;
		if (item.side && (item.side === 'front' || item.side === 'back')) {
			targetSide = item.side;
		}

		// Switch to that side if not active
		if (activeSide !== targetSide) {
			activeSide = targetSide;
			toast.success(`Switched to ${targetSide} view for this history item`);
		}

		const layers: DecomposedLayer[] = item.layers.map((layer: any, index: number) => ({
			id: crypto.randomUUID(),
			name: layer.name || `Layer ${(layer.zIndex || index) + 1}`,
			imageUrl: layer.imageUrl,
			zIndex: layer.zIndex || index,
			suggestedType: layer.suggestedType || 'unknown',
			side: targetSide,
			bounds: layer.bounds || {
				x: 0,
				y: 0,
				width: layer.width || 100,
				height: layer.height || 100
			},
			confidence: layer.confidence || 1
		}));

		// Clear existing selections for the target side
		if (targetSide === 'front') {
			frontLayers.forEach((layer) => layerSelections.delete(layer.id));
			frontLayers = layers;
		} else {
			backLayers.forEach((layer) => layerSelections.delete(layer.id));
			backLayers = layers;
		}

		// Initialize layer selections for the loaded layers with side
		layers.forEach((layer) => {
			const type = layer.suggestedType;
			// Safe cast to valid element type
			let elementType: 'image' | 'signature' | 'text' | 'qr' | 'photo' = 'image';
			if (type === 'signature' || type === 'text' || type === 'qr' || type === 'photo') {
				elementType = type;
			}

			layerSelections.set(layer.id, {
				layerId: layer.id,
				included: true,
				elementType,
				variableName: `layer_${layer.zIndex + 1}`,
				bounds: layer.bounds || { x: 0, y: 0, width: 100, height: 100 },
				layerImageUrl: layer.imageUrl,
				side: targetSide // Include side in selection
			});
		});

		// Track active history
		activeHistoryId = item.id;
		hasUnsavedChanges = false;
		toast.success('Loaded layers from history');
	}

	async function handleDecompose() {
		if (!currentImageUrl) {
			toast.error('No image available for this side');
			return;
		}

		isDecomposing = true;
		// Clear current side's layers (can't assign to derived currentLayers)
		if (activeSide === 'front') {
			frontLayers = [];
		} else {
			backLayers = [];
		}
		selectedLayerId = null;

		try {
			const result = await decomposeImage({
				imageUrl: currentImageUrl,
				numLayers,
                prompt,
                negative_prompt: negativePrompt,
                num_inference_steps: numInferenceSteps,
                guidance_scale: guidanceScale,
                acceleration,
				seed: Math.floor(Math.random() * 1000000),
				templateId: data.asset?.templateId ?? undefined,
				side: activeSide,
                upscale: shouldUpscale
			});

			if (result.success && result.layers) {
                // ... (rest of function)
				const layers: DecomposedLayer[] = result.layers.map((layer: any, index: number) => ({
					id: crypto.randomUUID(),
					name: `Layer ${index + 1}`,
					imageUrl: layer.url,
					zIndex: layer.zIndex,
					suggestedType: 'unknown',
					side: activeSide,
					bounds: { x: 0, y: 0, width: layer.width, height: layer.height },
					confidence: 1
				}));

				// Clear existing selections for the active side
				if (activeSide === 'front') {
					frontLayers.forEach((l) => layerSelections.delete(l.id));
					frontLayers = layers;
				} else {
					backLayers.forEach((l) => layerSelections.delete(l.id));
					backLayers = layers;
				}

				// Select first layer
				if (layers.length > 0) {
					selectedLayerId = layers[0].id;
				}

				// Initialize selections with side
				layers.forEach((layer) => {
					layerSelections.set(layer.id, {
						layerId: layer.id,
						included: true,
						elementType: 'image',
						variableName: `layer_${layer.zIndex + 1}`,
						bounds: layer.bounds || { x: 0, y: 0, width: 100, height: 100 },
						layerImageUrl: layer.imageUrl,
						side: activeSide // Include side in selection
					});
				});

				// Reset tracking state
				activeHistoryId = null;
				hasUnsavedChanges = false;

				// Reload history to show the new item
				loadHistory();

				toast.success('Image decomposed successfully');
			} else {
				toast.error(result.error || 'Decomposition failed');
			}
		} catch (err: any) {
			console.error('Decompose error:', err);
			toast.error(err.message || 'Failed to decompose image');
		} finally {
			isDecomposing = false;
		}
	}

	function toggleLayerIncluded(layerId: string) {
		const selection = layerSelections.get(layerId);
		if (selection) {
			layerSelections.set(layerId, { ...selection, included: !selection.included });
			layerSelections = new Map(layerSelections);
			hasUnsavedChanges = true;
		}
	}

	function updateLayerType(layerId: string, type: LayerSelection['elementType']) {
		const selection = layerSelections.get(layerId);
		if (selection) {
			layerSelections.set(layerId, { ...selection, elementType: type });
			layerSelections = new Map(layerSelections);
			hasUnsavedChanges = true;
		}
	}

	function updateVariableName(layerId: string, name: string) {
		const selection = layerSelections.get(layerId);
		if (selection) {
			layerSelections.set(layerId, { ...selection, variableName: name });
			layerSelections = new Map(layerSelections);
			hasUnsavedChanges = true;
		}
	}

	async function handleSave() {
		if (!data.template?.id) {
			toast.error('No template linked to this asset');
			return;
		}

		const allLayers = [...frontLayers, ...backLayers];
		if (allLayers.length === 0) {
			toast.error('No layers to save. Run decomposition first.');
			return;
		}

		const selectionsArray = allLayers
			.map((layer) => layerSelections.get(layer.id))
			.filter((s): s is LayerSelection => !!s);

		isSaving = true;
		try {
			const result = await saveLayers({
				templateId: data.template.id,
				layers: selectionsArray,
				mode: 'replace'
			});

			if (result.success) {
				toast.success(result.message);
				goto(`/templates?id=${data.template.id}`);
			}
		} catch (err) {
			console.error('Save error:', err);
			toast.error('Failed to save layers');
		} finally {
			isSaving = false;
		}
	}

	function getTypeIcon(type: LayerSelection['elementType']) {
		switch (type) {
			case 'image':
				return 'IMG';
			case 'text':
				return 'TXT';
			case 'photo':
				return 'PHO';
			case 'qr':
				return 'QR';
			case 'signature':
				return 'SIG';
		}
	}
</script>

```html
<svelte:head>
	<title>Decompose: {data.asset.name} | Admin</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
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
				Decompose: {data.asset.name}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Extract layers using AI for template element creation
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button onclick={handleSave} disabled={isSaving || currentLayers.length === 0}>
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

	<!-- Main Content -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left Panel: Image Preview -->
		<div class="lg:col-span-2 space-y-4">
			<!-- Side Tabs with Stats -->
			<div class="flex gap-2">
				<button
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeSide === 'front'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					onclick={() => (activeSide = 'front')}
				>
					Front
					{#if frontLayers.length > 0 || (historyStats?.front.count ?? 0) > 0}
						<span class="ml-1 text-xs opacity-80">
							({frontLayers.length} layers{historyStats?.front.count
								? ` • ${historyStats.front.count} history`
								: ''})
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
					{#if backLayers.length > 0 || (historyStats?.back.count ?? 0) > 0}
						<span class="ml-1 text-xs opacity-80">
							({backLayers.length} layers{historyStats?.back.count
								? ` • ${historyStats.back.count} history`
								: ''})
						</span>
					{/if}
					{#if !hasBackImage}
						<span class="ml-1 text-xs opacity-50">(N/A)</span>
					{/if}
				</button>
			</div>

			<!-- Image Preview Card -->
			<div class="rounded-lg border border-border bg-card overflow-hidden">
				<div class="p-4 border-b border-border bg-muted/30">
					<h2 class="font-medium text-foreground">Template Preview</h2>
					<p class="text-xs text-muted-foreground">
						{data.asset.widthPixels} x {data.asset.heightPixels}px • {data.asset.orientation}
					</p>
				</div>

				<div class="relative aspect-[1.6/1] bg-muted/50 flex items-center justify-center">
					{#if currentLayers.length > 0}
						<!-- Render Decomposed Layers -->
						<div class="relative w-full h-full">
							{#each currentLayers as layer (layer.id)}
								{@const selection = layerSelections.get(layer.id)}
								<img
									src={layer.imageUrl}
									alt={layer.name}
									class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
									style="z-index: {layer.zIndex}; opacity: {selection?.included ? 1 : 0};"
								/>
							{/each}

							<!-- Selection Overlay (High Z-Index) -->
							<div class="absolute inset-0 pointer-events-none" style="z-index: 9999;">
								{#each currentLayers as layer (layer.id)}
									<div
										class="absolute inset-0 border-2 transition-opacity {selectedLayerId ===
										layer.id
											? 'border-primary opacity-100'
											: 'border-transparent opacity-0'}"
									></div>
								{/each}
							</div>
						</div>
					{:else if currentImageUrl}
						<img
							src={currentImageUrl}
							alt="{data.asset.name} - {activeSide}"
							class="max-w-full max-h-full object-contain"
						/>
					{:else}
						<div class="text-center text-muted-foreground">
							<ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-30" />
							<p class="text-sm">No image available</p>
						</div>
					{/if}
				</div>

				<!-- Controls -->
				<div class="p-4 border-t border-border space-y-4">
                    <!-- Advanced Settings Toggle -->
                    <div class="flex items-center justify-between">
                         <Button variant="ghost" size="sm" class="h-8 text-xs text-muted-foreground" onclick={() => showAdvancedSettings = !showAdvancedSettings}>
                            {#if showAdvancedSettings}
                                <ChevronUp class="mr-2 h-3 w-3" />
                                Hide Advanced Settings
                            {:else}
                                <ChevronDown class="mr-2 h-3 w-3" />
                                Show Advanced Settings
                            {/if}
                        </Button>
                    </div>

                    {#if showAdvancedSettings}
                        <div class="space-y-4 pt-2 pb-4 border-b border-border">
                            <!-- Prompt -->
                            <div class="grid gap-2">
                                <Label for="prompt">Prompt</Label>
                                <Textarea id="prompt" bind:value={prompt} class="h-24 text-xs" placeholder="Describe the ID card structure..." />
                            </div>

                            <!-- Negative Prompt -->
                            <div class="grid gap-2">
                                <Label for="negative_prompt">Negative Prompt</Label>
                                <Textarea id="negative_prompt" bind:value={negativePrompt} class="h-16 text-xs" placeholder="What to avoid..." />
                            </div>

                             <div class="grid grid-cols-2 gap-4">
                                <!-- Inference Steps -->
                                <div class="grid gap-2">
                                    <div class="flex items-center justify-between">
                                        <Label for="steps">Inference Steps: {numInferenceSteps}</Label>
                                    </div>
                                    <Slider id="steps" min={10} max={50} step={1} value={[numInferenceSteps]} onValueChange={(v) => numInferenceSteps = v[0]} />
                                </div>

                                <!-- Upscale -->
                                <div class="flex items-center justify-between space-x-2">
                                    <Label for="upscale" class="flex flex-col space-y-1">
                                        <span>Upscale 2x</span>
                                        <span class="font-normal text-xs text-muted-foreground">Upscale image before decomposition</span>
                                    </Label>
                                    <Switch id="upscale" checked={shouldUpscale} onCheckedChange={(v) => shouldUpscale = v} />
                                </div>

                                <Separator />

                                <!-- Guidance Scale -->
                                <div class="grid gap-2">
                                    <div class="flex items-center justify-between">
                                         <Label for="guidance">Guidance Scale: {guidanceScale}</Label>
                                    </div>
                                    <Slider id="guidance" min={1} max={20} step={0.1} value={[guidanceScale]} onValueChange={(v) => guidanceScale = v[0]} />
                                </div>
                             </div>
                             
                             <!-- Acceleration -->
                             <div class="grid gap-2">
                                <Label>Acceleration</Label>
                                <div class="flex items-center gap-4">
                                    <div class="flex items-center space-x-2">
                                         <input type="radio" id="acc_none" name="acceleration" value="none" bind:group={acceleration} class="radio" />
                                         <Label for="acc_none" class="font-normal">None</Label>
                                     </div>
                                    <div class="flex items-center space-x-2">
                                        <input type="radio" id="acc_regular" name="acceleration" value="regular" bind:group={acceleration} class="radio" />
                                        <Label for="acc_regular" class="font-normal">Regular</Label>
                                    </div>
                                     <div class="flex items-center space-x-2">
                                        <input type="radio" id="acc_high" name="acceleration" value="high" bind:group={acceleration} class="radio" />
                                        <Label for="acc_high" class="font-normal">High</Label>
                                    </div>
                                </div>
                             </div>
                        </div>
                    {/if}

                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <label for="numLayers" class="text-sm text-muted-foreground">Layers:</label>
                            <select
                                id="numLayers"
                                bind:value={numLayers}
                                class="rounded border border-border bg-background px-2 py-1 text-sm"
                            >
                                {#each [2, 3, 4, 5, 6, 8, 10] as n}
                                    <option value={n}>{n}</option>
                                {/each}
                            </select>
                        </div>

                        <Button
                            onclick={handleDecompose}
                            disabled={isDecomposing || !currentImageUrl}
                            variant="secondary"
                        >
                            {#if isDecomposing}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                Decomposing...
                            {:else}
                                <Wand2 class="mr-2 h-4 w-4" />
                                Decompose {activeSide === 'front' ? 'Front' : 'Back'}
                                <span class="ml-1 text-xs opacity-70">({decomposeCost} credits)</span>
                            {/if}
                        </Button>
                    </div>
                </div>
			</div>

			<!-- Linked Template Info -->
			{#if data.template}
				<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
					<div class="flex items-start gap-3">
						<div class="flex-1">
							<p class="text-sm font-medium text-blue-700 dark:text-blue-300">
								Linked Template: {data.template.name}
							</p>
							<p class="text-xs text-blue-600/80 dark:text-blue-400/80">
								{data.template.elementCount} existing elements • {data.template.widthPixels}x{data
									.template.heightPixels}px
							</p>
						</div>
						<a
							href="/templates?id={data.template.id}"
							class="text-xs text-blue-600 hover:underline"
							target="_blank"
						>
							Open Editor →
						</a>
					</div>
				</div>
			{:else}
				<div class="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
					<p class="text-sm text-yellow-700 dark:text-yellow-300">
						No template linked. Layers cannot be saved.
					</p>
				</div>
			{/if}
		</div>

		<!-- Right Panel: Layers List -->
		<div class="space-y-4">
			<div class="rounded-lg border border-border bg-card">
				<div class="p-4 border-b border-border">
					<h2 class="font-medium text-foreground flex items-center gap-2">
						<Layers class="h-4 w-4" />
						Detected Layers
						{#if currentLayers.length > 0}
							<span class="text-xs text-muted-foreground">({currentLayers.length})</span>
						{/if}
					</h2>
				</div>

				<div class="max-h-[600px] overflow-y-auto">
					{#if currentLayers.length === 0}
						<div class="p-8 text-center text-muted-foreground">
							<Wand2 class="h-8 w-8 mx-auto mb-2 opacity-30" />
							<p class="text-sm">Click "Decompose" to extract layers</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each currentLayers as layer (layer.id)}
								{@const selection = layerSelections.get(layer.id)}
								<div
									class="p-3 hover:bg-muted/50 transition-colors cursor-pointer {selectedLayerId ===
									layer.id
										? 'bg-primary/5 border-l-2 border-l-primary'
										: ''}"
									onclick={() => (selectedLayerId = layer.id)}
									onkeydown={(e) => e.key === 'Enter' && (selectedLayerId = layer.id)}
									tabindex="0"
									role="button"
								>
									<!-- Layer Header -->
									<div class="flex items-center gap-3">
										<!-- Visibility Toggle -->
										<button
											class="text-muted-foreground hover:text-foreground"
											onclick={(e) => {
												e.stopPropagation();
												toggleLayerIncluded(layer.id);
											}}
											title={selection?.included ? 'Exclude layer' : 'Include layer'}
										>
											{#if selection?.included}
												<Eye class="h-4 w-4" />
											{:else}
												<EyeOff class="h-4 w-4 opacity-50" />
											{/if}
										</button>

										<!-- Layer Preview Thumbnail -->
										<div
											class="w-12 h-8 rounded border border-border bg-muted overflow-hidden flex-shrink-0"
										>
											<img
												src={layer.imageUrl}
												alt={layer.name}
												class="w-full h-full object-contain"
											/>
										</div>

										<!-- Layer Info -->
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-foreground truncate">
													{layer.name}
												</span>
												<span
													class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary"
												>
													{getTypeIcon(selection?.elementType || 'image')}
												</span>
											</div>
											<p class="text-[10px] text-muted-foreground">
												z-index: {layer.zIndex}
											</p>
										</div>
									</div>

									<!-- Expanded Editor (when selected) -->
									{#if selectedLayerId === layer.id && selection}
										<div class="mt-3 pt-3 border-t border-border space-y-3">
											<!-- Variable Name -->
											<div>
												<label
													for="varName-{layer.id}"
													class="text-xs text-muted-foreground block mb-1"
												>
													Variable Name
												</label>
												<input
													id="varName-{layer.id}"
													type="text"
													value={selection.variableName}
													oninput={(e) =>
														updateVariableName(layer.id, (e.target as HTMLInputElement).value)}
													class="w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono"
													placeholder="layer_name"
												/>
											</div>

											<!-- Element Type -->
											<div>
												<label
													for="type-{layer.id}"
													class="text-xs text-muted-foreground block mb-1"
												>
													Element Type
												</label>
												<select
													id="type-{layer.id}"
													value={selection.elementType}
													onchange={(e) =>
														updateLayerType(
															layer.id,
															(e.target as HTMLSelectElement).value as LayerSelection['elementType']
														)}
													class="w-full rounded border border-border bg-background px-2 py-1 text-sm"
												>
													<option value="image">Image (Static graphic)</option>
													<option value="text">Text (Dynamic field)</option>
													<option value="photo">Photo (User upload)</option>
													<option value="qr">QR Code</option>
													<option value="signature">Signature</option>
												</select>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Help Text -->
			<div class="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
				<p>
					<strong>How it works:</strong>
				</p>
				<ol class="list-decimal list-inside space-y-1">
					<li>Click "Decompose" to analyze the template image</li>
					<li>Review and tag each detected layer</li>
					<li>Set variable names for dynamic elements</li>
					<li>Click "Save to Template" to create elements</li>
				</ol>
			</div>

			<!-- Inline History Section -->
			{#if filteredHistory.length > 0 || isLoadingHistory}
				<div class="rounded-lg border border-border bg-card">
					<div class="p-3 border-b border-border flex items-center justify-between">
						<h3 class="text-sm font-medium text-foreground flex items-center gap-2">
							<History class="h-4 w-4" />
							Generation History
							<span class="text-xs text-muted-foreground">
								({filteredHistory.length} for {activeSide})
							</span>
						</h3>
					</div>

					<div class="max-h-[240px] overflow-y-auto p-2 space-y-2">
						{#if isLoadingHistory}
							<div class="flex items-center justify-center py-4">
								<Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
							</div>
						{:else}
							{#each filteredHistory as item (item.id)}
								<button
									class="w-full text-left p-2 rounded-md transition-colors flex items-center gap-2
										{activeHistoryId === item.id
										? 'bg-primary/10 border border-primary/30'
										: 'bg-muted/30 hover:bg-muted/50 border border-transparent'}"
									onclick={() => requestLoadFromHistory(item)}
								>
									<div
										class="h-10 w-10 bg-muted rounded overflow-hidden flex-shrink-0 border border-border"
									>
										<img
											src={item.inputImageUrl}
											alt="Generation"
											class="w-full h-full object-cover"
										/>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-0.5">
											<span class="text-[10px] text-muted-foreground font-mono">
												{item.id.slice(0, 8)}
											</span>
											<span class="text-[10px] text-muted-foreground">
												{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
											</span>
										</div>
										<div class="text-xs font-medium text-foreground flex items-center gap-2">
											{item.layers.length} layers
											{#if item.creditsUsed && item.creditsUsed > 0}
												<span class="text-muted-foreground">• {item.creditsUsed} credits</span>
											{/if}
										</div>
									</div>
									{#if activeHistoryId === item.id}
										<Check class="h-4 w-4 text-primary flex-shrink-0" />
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Confirmation Dialog -->
<Dialog.Root bind:open={showConfirmDialog}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<AlertTriangle class="h-5 w-5 text-yellow-500" />
				Replace Current Layers?
			</Dialog.Title>
			<Dialog.Description>
				You have unsaved modifications to the current layer selections. Loading from history will
				replace all current selections.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="gap-2">
			<Button variant="outline" onclick={cancelLoadFromHistory}>Cancel</Button>
			<Button onclick={confirmLoadFromHistory}>Replace Layers</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
