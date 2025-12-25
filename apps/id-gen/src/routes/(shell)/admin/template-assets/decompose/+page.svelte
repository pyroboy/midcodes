<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Logic
	import { LayerManager } from '$lib/logic/LayerManager.svelte';
	import { ImageProcessor } from '$lib/logic/ImageProcessor.svelte';
	import { HistoryManager } from '$lib/logic/HistoryManager.svelte';
	import { getProxiedUrl } from '$lib/utils/storage';

	// Components
	import DecomposeHeader from './components/DecomposeHeader.svelte';
	import ImagePreview from './components/ImagePreview.svelte';
	import LayerCard from './components/LayerCard.svelte';
	import HistoryItemCard from './components/HistoryItem.svelte'; // Using refactored HistoryItem

	// Modals
	import DecomposeModal from './components/modals/DecomposeModal.svelte';
	import UpscaleActionModal from './components/modals/UpscaleActionModal.svelte';
	import RemoveModal from './components/modals/RemoveModal.svelte';
	import ImagePreviewModal from './components/modals/ImagePreviewModal.svelte';
	import CropModal from './CropModal.svelte'; // Note: check absolute path, usually alongside +page

	// UI Icons
	import {
		Layers,
		Wand2,
		Loader2,
		Check,
		Circle,
		Eye,
		EyeOff,
		Merge,
		Sparkles,
		ChevronUp,
		ChevronDown,
		ZoomIn,
		Eraser,
		Crop,
		ImageDown,
		ArrowUp,
		ArrowDown
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	let { data }: { data: PageData } = $props();

	// --- Initialize Logic ---
	const layerMgr = new LayerManager();
	const historyMgr = new HistoryManager(layerMgr, () => data.template?.id);
	const assetConfig = $derived({
		id: data.asset.id,
		width: data.asset.widthPixels || 1050,
		height: data.asset.heightPixels || 600,
		templateId: data.template?.id
	});
	const processor = new ImageProcessor(layerMgr, historyMgr, () => assetConfig);

	// --- Local UI State ---
	let selectedLayerId = $state<string | null>(null);
	// Track overridden background URLs after setAsMain completes
	let overriddenFrontUrl = $state<string | null>(null);
	let overriddenBackUrl = $state<string | null>(null);
	// Derived - use override if present, otherwise fall back to server data
	let currentImageUrl = $derived(
		layerMgr.activeSide === 'front'
			? (overriddenFrontUrl ?? data.asset.imageUrl)
			: (overriddenBackUrl ?? data.asset.backImageUrl ?? null)
	);

	// Settings & Modals
	let settings = $state({
		numLayers: 4,
		prompt: '',
		negativePrompt: '',
		steps: 50,
		guidance: 1,
		acceleration: 'none',
		// Upscale
		upscaleModel: 'ccsr' as 'ccsr' | 'seedvr' | 'aurasr' | 'esrgan' | 'recraft-creative',
		removeWatermark: false
	});

	let modals = $state({
		decompose: false,
		upscale: false,
		remove: false,
		preview: false,
		crop: false
	});

	let actionModalLayerId = $state<string | null>(null);
	let removePrompt = $state('');
	let previewData = $state({ url: '', title: '' });

	// --- Lifecycle & Effects ---
	onMount(() => {
		historyMgr.load();
		// Attempt session load
		layerMgr.loadFromStorage(data.asset.id);

		// Set up callback to auto-add completed job results to layers
		historyMgr.onJobComplete = (jobId: string, result: any, provider: string) => {
			console.log(`[Page] Job ${jobId} completed, provider: ${provider}`, result);

			if (provider === 'fal-ai-decompose' && result?.layers) {
				// Add decomposed layers
				result.layers.forEach((l: any, i: number) => {
					const { layer, selection } = layerMgr.createLayerObj(
						l.url || l.imageUrl,
						`Layer ${i + 1}`,
						{ x: 0, y: 0, width: l.width || 100, height: l.height || 100 },
						layerMgr.activeSide,
						layerMgr.currentLayers.length
					);
					layerMgr.addLayer(layer, selection);
				});
				toast.success(`Added ${result.layers.length} decomposed layers`);
			} else if (
				(provider.includes('upscale') || provider.includes('remove')) &&
				result?.resultUrl
			) {
				// Add single result image as layer
				const { layer, selection } = layerMgr.createLayerObj(
					result.resultUrl,
					provider.includes('upscale') ? 'Upscaled' : 'Removed',
					{ x: 0, y: 0, width: assetConfig.width, height: assetConfig.height },
					layerMgr.activeSide,
					layerMgr.currentLayers.length
				);
				layerMgr.addLayer(layer, selection);
				toast.success('Result added to layers');
			}
		};
	});

	$effect(() => {
		// Auto-save when relevant state changes
		const _0 = layerMgr.frontLayers.length;
		const _1 = layerMgr.backLayers.length;
		const _2 = layerMgr.saveState;

		if (layerMgr.saveState === 'unsaved') {
			layerMgr.saveToStorage(data.asset.id);
		}
	});

	// --- Handlers ---
	function handleMenuAction(action: 'decompose' | 'upscale' | 'remove' | 'crop', layerId: string) {
		actionModalLayerId = layerId;
		selectedLayerId = layerId;
		if (action === 'decompose') modals.decompose = true;
		if (action === 'upscale') modals.upscale = true;
		if (action === 'remove') {
			removePrompt = '';
			modals.remove = true;
		}
		if (action === 'crop') {
			const layerFound =
				layerId === 'original-file'
					? { imageUrl: currentImageUrl || '', name: 'Original' }
					: layerMgr.currentLayers.find((l) => l.id === layerId);

			if (layerFound && layerFound.imageUrl) {
				modals.crop = true;
			}
		}
	}

	async function onDecomposeSubmit() {
		modals.decompose = false;

		let targetUrl = currentImageUrl || '';
		if (actionModalLayerId && actionModalLayerId !== 'original-file') {
			const l = layerMgr.currentLayers.find((x) => x.id === actionModalLayerId);
			if (l) targetUrl = l.imageUrl;
		}

		if (!targetUrl) {
			toast.error('No image selected');
			return;
		}

		await processor.decompose({
			imageUrl: targetUrl,
			numLayers: settings.numLayers,
			prompt: settings.prompt,
			negativePrompt: settings.negativePrompt,
			settings: { num_inference_steps: settings.steps, guidance_scale: settings.guidance }
		});
	}

	async function onUpscaleSubmit() {
		modals.upscale = false;
		if (actionModalLayerId) {
			const layer = layerMgr.currentLayers.find((l) => l.id === actionModalLayerId);
			if (layer) {
				await processor.upscaleLayer(layer, settings.upscaleModel, settings.removeWatermark);
			} else if (actionModalLayerId === 'original-file') {
				// Handle upgrading original file separately if needed, or create a new layer from it
				const newLayer = { id: 'original-file', imageUrl: currentImageUrl || '' };
				const res = await processor.upscaleLayer(
					newLayer as any,
					settings.upscaleModel,
					settings.removeWatermark
				);
				if (res) {
					// Maybe add it as a new main layer?
					// For now just show toast done (handled in processor)
				}
			}
		}
	}

	// Drag & Drop for Sidebar
	function handleSidebarDragStart(e: DragEvent, layer: any) {
		e.dataTransfer?.setData('application/json', JSON.stringify({ type: 'history-layer', layer }));
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (!e.dataTransfer) return;
		const raw = e.dataTransfer.getData('application/json');
		if (raw) {
			try {
				const data = JSON.parse(raw);
				if (data.type === 'history-layer') {
					layerMgr.addFromHistory(data.layer);
					toast.success('Added from history');
				}
			} catch (e) {
				console.error(e);
			}
		}
	}
</script>

<div class="container mx-auto max-w-7xl px-4 py-6">
	<DecomposeHeader
		assetName={data.asset.name}
		bind:activeSide={layerMgr.activeSide}
		hasBackImage={!!data.asset.backImageUrl}
		frontLayersCount={layerMgr.frontLayers.length}
		backLayersCount={layerMgr.backLayers.length}
		frontHistoryCount={historyMgr.stats?.front?.count || 0}
		backHistoryCount={historyMgr.stats?.back?.count || 0}
		hasUpscaledPreview={layerMgr.currentLayers.some((l) => l.imageUrl.includes('upscaled'))}
		isSaving={processor.isProcessing}
		onSave={() => layerMgr.saveToStorage(data.asset.id)}
		onReset={() => layerMgr.clearCurrentSide()}
	/>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2 space-y-4">
			<ImagePreview
				{currentImageUrl}
				currentLayers={layerMgr.currentLayers}
				layerSelections={layerMgr.selections}
				showOriginalLayer={layerMgr.showOriginalLayer}
				{selectedLayerId}
				activeSide={layerMgr.activeSide}
				assetName={data.asset.name}
				widthPixels={data.asset.widthPixels || 1050}
				heightPixels={data.asset.heightPixels || 600}
				orientation={data.asset.orientation || 'horizontal'}
			/>

			<!-- Global Options / Quick Actions -->
			<div
				class="p-4 rounded-lg border border-border bg-card space-y-4 flex justify-between items-center"
			>
				<div class="flex items-center gap-4">
					<Label class="text-sm text-muted-foreground">Default Layers:</Label>
					<select
						bind:value={settings.numLayers}
						class="rounded border border-border bg-background px-2 py-1 text-sm h-8"
					>
						{#each [2, 3, 4, 6, 8] as n}<option value={n}>{n}</option>{/each}
					</select>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => handleMenuAction('crop', 'original-file')}
					>
						<Crop class="h-4 w-4 mr-2" /> Crop Original
					</Button>
				</div>
			</div>
		</div>

		<!-- Right Column -->
		<div class="space-y-4">
			<!-- Layers Panel -->
			<div class="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[500px]">
				<div class="p-4 border-b border-border flex justify-between items-center shrink-0">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
							<Layers class="h-5 w-5 text-muted-foreground" />
						</div>
						<div>
							<h2 class="font-semibold text-foreground">
								Layers ({layerMgr.currentLayers.length})
							</h2>
							<div class="flex items-center gap-2 text-sm">
								{#if layerMgr.saveState === 'saved'}
									<span class="flex items-center gap-1 text-green-600"
										><Check class="h-3 w-3" /> Saved</span
									>
								{:else}
									<span class="flex items-center gap-1 text-yellow-600"
										><Circle class="h-3 w-3" /> Unsaved</span
									>
								{/if}
							</div>
						</div>
					</div>
					<div class="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							onclick={() => (layerMgr.mergeMode = !layerMgr.mergeMode)}
						>
							<Merge class="h-4 w-4 {layerMgr.mergeMode ? 'text-violet-600' : ''}" />
						</Button>
					</div>
				</div>

				{#if layerMgr.mergeMode}
					<div
						class="p-2 bg-violet-500/10 border-b border-violet-500/20 flex justify-between items-center px-4 shrink-0"
					>
						<span class="text-xs text-violet-700">{layerMgr.selectedForMerge.size} selected</span>
						<Button
							size="sm"
							class="h-7 text-xs bg-violet-600"
							onclick={() => processor.mergeSelectedLayers()}
						>
							Merge
						</Button>
					</div>
				{/if}

				<div
					class="flex-1 overflow-y-auto p-2 space-y-2"
					ondrop={handleDrop}
					ondragover={(e) => e.preventDefault()}
					role="region"
					aria-label="Layer list"
				>
					{#if layerMgr.showOriginalLayer}
						<LayerCard
							layer={{
								id: 'original-file',
								name: 'Original Background',
								imageUrl: currentImageUrl || '',
								zIndex: -1,
								side: layerMgr.activeSide
							} as any}
							isOriginal={true}
							onSelect={() => (selectedLayerId = 'original-file')}
							isSelected={selectedLayerId === 'original-file'}
							selection={{ included: true } as any}
							onToggleOriginalLayer={() =>
								(layerMgr.showOriginalLayer = !layerMgr.showOriginalLayer)}
							visible={layerMgr.showOriginalLayer}
							onAction={(action) => handleMenuAction(action as any, 'original-file')}
							onPreviewImage={(url, title) => {
								previewData = { url, title };
								modals.preview = true;
							}}
						/>
					{/if}

					{#each layerMgr.currentLayers as layer (layer.id)}
						<LayerCard
							{layer}
							selection={layerMgr.selections.get(layer.id)}
							isSelected={selectedLayerId === layer.id}
							mergeMode={layerMgr.mergeMode}
							isSelectedForMerge={layerMgr.selectedForMerge.has(layer.id)}
							isProcessing={processor.processingLayerId === layer.id}
							onSelect={() => (selectedLayerId = layer.id)}
							onMergeSelect={() => layerMgr.toggleMergeSelection(layer.id)}
							onDelete={() => layerMgr.removeLayer(layer.id)}
							onMoveUp={() => layerMgr.moveLayer(layer.id, 'up')}
							onMoveDown={() => layerMgr.moveLayer(layer.id, 'down')}
							onUpdateVariableName={(name) =>
								layerMgr.updateSelection(layer.id, { variableName: name })}
							onUpdateType={(type) => layerMgr.updateSelection(layer.id, { elementType: type })}
							onSetOpacity={(val) => layerMgr.setOpacity(layer.id, val)}
							onToggleIncluded={() =>
								layerMgr.updateSelection(layer.id, {
									included: !layerMgr.selections.get(layer.id)?.included
								})}
							onAction={(action) => handleMenuAction(action, layer.id)}
							onPreviewImage={(url, title) => {
								previewData = { url, title };
								modals.preview = true;
							}}
						/>
					{/each}
				</div>

				<!-- Action Bar (External) -->
				<div class="p-3 border-t border-border grid grid-cols-5 gap-2 shrink-0">
					<button
						class="flex flex-col items-center gap-1 p-2 rounded hover:bg-violet-500/10 disabled:opacity-50 transition-colors"
						disabled={!selectedLayerId}
						onclick={() => selectedLayerId && handleMenuAction('decompose', selectedLayerId)}
					>
						<Sparkles class="h-4 w-4 text-violet-600" />
						<span class="text-[10px]">Decompose</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-2 rounded hover:bg-green-500/10 disabled:opacity-50 transition-colors"
						disabled={!selectedLayerId}
						onclick={() => selectedLayerId && handleMenuAction('upscale', selectedLayerId)}
					>
						<ZoomIn class="h-4 w-4 text-green-600" />
						<span class="text-[10px]">Upscale</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-2 rounded hover:bg-orange-500/10 disabled:opacity-50 transition-colors"
						disabled={!selectedLayerId}
						onclick={() => selectedLayerId && handleMenuAction('crop', selectedLayerId)}
					>
						<Crop class="h-4 w-4 text-orange-600" />
						<span class="text-[10px]">Crop</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-2 rounded hover:bg-red-500/10 disabled:opacity-50 transition-colors"
						disabled={!selectedLayerId}
						onclick={() => selectedLayerId && handleMenuAction('remove', selectedLayerId)}
					>
						<Eraser class="h-4 w-4 text-red-600" />
						<span class="text-[10px]">Remove</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-2 rounded hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
						disabled={!selectedLayerId}
						onclick={async () => {
							if (!selectedLayerId) return;
							const newUrl = await processor.setAsMain(selectedLayerId);
							if (newUrl) {
								// Update the override to reflect the new background immediately
								if (layerMgr.activeSide === 'front') {
									overriddenFrontUrl = newUrl;
								} else {
									overriddenBackUrl = newUrl;
								}
							}
						}}
					>
						<ImageDown class="h-4 w-4 text-cyan-600" />
						<span class="text-[10px]">Set BG</span>
					</button>
				</div>
			</div>

			<!-- History Panel -->
			<div class="rounded-lg border border-border bg-card">
				<div class="p-4 border-b border-border">
					<h2 class="font-medium text-foreground flex items-center gap-2">
						<Sparkles class="h-4 w-4 text-violet-500" /> History
					</h2>
				</div>
				<div class="p-3 max-h-[400px] overflow-y-auto space-y-2">
					{#if historyMgr.history.length === 0 && historyMgr.isLoading}
						<div class="flex justify-center p-4">
							<Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					{/if}

					{#each historyMgr.history as item (item.id)}
						<HistoryItemCard
							{item}
							onLoadRequest={() => historyMgr.restoreSession(item)}
							onDragStart={(e) => handleSidebarDragStart(e, item)}
							isExpanded={historyMgr.expandedItems.has(item.id)}
							onToggleExpanded={() => historyMgr.toggleExpand(item.id)}
						/>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Modals -->
	<DecomposeModal
		bind:open={modals.decompose}
		bind:prompt={settings.prompt}
		bind:negativePrompt={settings.negativePrompt}
		bind:numLayers={settings.numLayers}
		bind:numInferenceSteps={settings.steps}
		bind:guidanceScale={settings.guidance}
		bind:acceleration={settings.acceleration}
		onProceed={onDecomposeSubmit}
		isProcessing={processor.isProcessing}
		actionLayer={actionModalLayerId === 'original-file'
			? { id: 'original-file', name: 'Original', imageUrl: currentImageUrl || '' }
			: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId)}
	/>

	<UpscaleActionModal
		bind:open={modals.upscale}
		bind:upscaleModel={settings.upscaleModel}
		bind:removeWatermark={settings.removeWatermark}
		onProceed={onUpscaleSubmit}
		isProcessing={processor.isProcessing}
		actionLayer={actionModalLayerId === 'original-file'
			? { id: 'original-file', name: 'Original', imageUrl: currentImageUrl || '' }
			: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId)}
	/>

	<RemoveModal
		bind:open={modals.remove}
		bind:removePrompt
		isProcessing={processor.isProcessing}
		onProceed={async () => {
			modals.remove = false;
			const layer =
				actionModalLayerId === 'original-file'
					? {
							id: 'original-file',
							name: 'Original',
							imageUrl: currentImageUrl || '',
							side: layerMgr.activeSide
						}
					: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId);

			if (layer) {
				await processor.removeElement(layer as any, removePrompt);
			}
		}}
		actionLayer={actionModalLayerId === 'original-file'
			? { id: 'original-file', name: 'Original', imageUrl: currentImageUrl || '' }
			: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId)}
	/>

	<ImagePreviewModal
		bind:open={modals.preview}
		imageUrl={previewData.url}
		title={previewData.title}
		assetDimensions={{
			width: data.asset.widthPixels || 1050,
			height: data.asset.heightPixels || 600
		}}
	/>

	{#if modals.crop}
		<CropModal
			bind:isOpen={modals.crop}
			imageUrl={getProxiedUrl(
				actionModalLayerId === 'original-file'
					? currentImageUrl!
					: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId)?.imageUrl!
			) || ''}
			targetWidth={data.asset.widthPixels || 1050}
			targetHeight={data.asset.heightPixels || 600}
			aspectRatio={(data.asset.widthPixels || 1050) / (data.asset.heightPixels || 600)}
			onCropComplete={async (croppedUrl) => {
				modals.crop = false;
				if (actionModalLayerId) {
					const originalUrl =
						actionModalLayerId === 'original-file'
							? currentImageUrl
							: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId)?.imageUrl;
					const layerName =
						actionModalLayerId === 'original-file'
							? 'Original'
							: layerMgr.currentLayers.find((l) => l.id === actionModalLayerId)?.name || 'Layer';
					await processor.handleCrop(actionModalLayerId, croppedUrl, layerName, originalUrl || '');
				}
			}}
		/>
	{/if}
</div>
