<script lang="ts">
	import type { PageData } from './$types';
	import { decomposeImage, saveLayers } from '$lib/remote/index.remote';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Layers, Wand2, Save, ArrowLeft, Loader2, Eye, EyeOff, ImageIcon } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';

	let { data }: { data: PageData } = $props();

	// State
	let activeSide = $state<'front' | 'back'>('front');
	let isDecomposing = $state(false);
	let isSaving = $state(false);
	let numLayers = $state(4);

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

	async function handleDecompose() {
		if (!currentImageUrl) {
			toast.error('No image available for this side');
			return;
		}

		isDecomposing = true;
		try {
			const result = await decomposeImage({
				imageUrl: currentImageUrl,
				numLayers
			});

			if (result.success) {
				// Convert to DecomposedLayer format
				const layers: DecomposedLayer[] = result.layers.map((layer, index) => ({
					id: crypto.randomUUID(),
					name: `Layer ${index + 1}`,
					imageUrl: layer.url,
					zIndex: layer.zIndex,
					suggestedType: index === 0 ? 'graphic' : 'unknown',
					side: activeSide,
					bounds: {
						x: 0,
						y: 0,
						width: layer.width,
						height: layer.height
					}
				}));

				// Initialize layer selections
				layers.forEach((layer) => {
					layerSelections.set(layer.id, {
						layerId: layer.id,
						included: true,
						elementType: 'image',
						variableName: `layer_${layer.zIndex + 1}`,
						bounds: layer.bounds || { x: 0, y: 0, width: 100, height: 100 },
						layerImageUrl: layer.imageUrl
					});
				});

				if (activeSide === 'front') {
					frontLayers = layers;
				} else {
					backLayers = layers;
				}

				toast.success(`Detected ${layers.length} layers`);
			} else {
				toast.error(result.error || 'Failed to decompose image');
			}
		} catch (err) {
			console.error('Decompose error:', err);
			toast.error('Failed to decompose image');
		} finally {
			isDecomposing = false;
		}
	}

	function toggleLayerIncluded(layerId: string) {
		const selection = layerSelections.get(layerId);
		if (selection) {
			layerSelections.set(layerId, { ...selection, included: !selection.included });
			layerSelections = new Map(layerSelections);
		}
	}

	function updateLayerType(layerId: string, type: LayerSelection['elementType']) {
		const selection = layerSelections.get(layerId);
		if (selection) {
			layerSelections.set(layerId, { ...selection, elementType: type });
			layerSelections = new Map(layerSelections);
		}
	}

	function updateVariableName(layerId: string, name: string) {
		const selection = layerSelections.get(layerId);
		if (selection) {
			layerSelections.set(layerId, { ...selection, variableName: name });
			layerSelections = new Map(layerSelections);
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

	<!-- Main Content -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left Panel: Image Preview -->
		<div class="lg:col-span-2 space-y-4">
			<!-- Side Tabs -->
			<div class="flex gap-2">
				<button
					class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeSide === 'front'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					onclick={() => (activeSide = 'front')}
				>
					Front
					{#if frontLayers.length > 0}
						<span class="ml-1 text-xs opacity-80">({frontLayers.length})</span>
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
					{#if backLayers.length > 0}
						<span class="ml-1 text-xs opacity-80">({backLayers.length})</span>
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
					{#if currentImageUrl}
						<img
							src={currentImageUrl}
							alt="{data.asset.name} - {activeSide}"
							class="max-w-full max-h-full object-contain"
						/>

						<!-- Layer overlays when decomposed -->
						{#if currentLayers.length > 0}
							<div class="absolute inset-0 pointer-events-none">
								{#each currentLayers as layer, index (layer.id)}
									{@const selection = layerSelections.get(layer.id)}
									{#if selection?.included}
										<div
											class="absolute inset-0 border-2 transition-opacity {selectedLayerId ===
											layer.id
												? 'border-primary opacity-100'
												: 'border-transparent opacity-0'}"
											style="mix-blend-mode: multiply;"
										></div>
									{/if}
								{/each}
							</div>
						{/if}
					{:else}
						<div class="text-center text-muted-foreground">
							<ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-30" />
							<p class="text-sm">No image available</p>
						</div>
					{/if}
				</div>

				<!-- Controls -->
				<div class="p-4 border-t border-border flex items-center gap-4">
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
						{/if}
					</Button>
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
		</div>
	</div>
</div>
