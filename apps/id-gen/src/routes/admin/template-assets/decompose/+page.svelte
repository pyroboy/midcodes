<script lang="ts">
	import type { PageData } from './$types';
	import {
		decomposeImage,
		upscaleImagePreview,
		saveLayers,
		getDecomposeHistoryWithStats,
		uploadProcessedImage,
		removeElementFromLayer,
		type HistoryStats
	} from '$lib/remote/index.remote';
	import { saveEnhancedImage } from '$lib/remote/enhance.remote';

	import { fileToImageData, processImageLSB, imageDataToBlob } from '$lib/utils/bye-synth-id';
	import { downscaleImage, fileToDataUrl } from '$lib/utils/imageProcessing';
	import { getProxiedUrl } from '$lib/utils/storage';
	import {
		saveSession,
		loadSession,
		clearSession,
		type DecomposeSession
	} from '$lib/utils/decomposeSession';
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
		AlertTriangle,
		ZoomIn,
		X,
		Trash2,
		Sparkles,
		Merge,
		Square,
		CheckSquare,
		GripVertical,
		Circle,
		Eraser,
		RotateCcw,
		ImageDown
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
	import * as Select from '$lib/components/ui/select';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';

	let { data }: { data: PageData } = $props();

	let activeSide = $state<'front' | 'back'>('front');
	let isDecomposing = $state(false);
	let isSaving = $state(false);

	// Decompose Settings
	let numLayers = $state(4);
	let prompt = $state('');
	let negativePrompt = $state('');
	let numInferenceSteps = $state(50);
	let guidanceScale = $state(1);
	let acceleration = $state('none');
	let showAdvancedSettings = $state(false);
	let removeWatermarks = $state(true);

	// Upscale state - separate for front and back
	let isUpscaling = $state(false);
	let upscaleModel = $state<'ccsr' | 'seedvr' | 'aurasr' | 'esrgan' | 'recraft-creative'>('ccsr');
	let frontUpscaledUrl = $state<string | null>(null);
	let backUpscaledUrl = $state<string | null>(null);
	let showUpscaleModal = $state(false);

	// Derived: current upscaled URL based on active side
	let currentUpscaledUrl = $derived(activeSide === 'front' ? frontUpscaledUrl : backUpscaledUrl);
	let hasUpscaledPreview = $derived(currentUpscaledUrl !== null);

	// Layers state - separate for front and back
	let frontLayers = $state<DecomposedLayer[]>([]);
	let backLayers = $state<DecomposedLayer[]>([]);

	// Local state for image URLs (allows reactivity when reset)
	let frontImageUrl = $state(data.asset.imageUrl);
	let backImageUrl = $state<string | null>(data.asset.backImageUrl);

	// Selected layer for highlighting
	let selectedLayerId = $state<string | null>(null);

	// Get current layers based on active side
	let currentLayers = $derived(activeSide === 'front' ? frontLayers : backLayers);
	let currentImageUrl = $derived(activeSide === 'front' ? frontImageUrl : backImageUrl);
	let hasBackImage = $derived(!!backImageUrl);

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
		provider?: string;
		resultUrl?: string; // For upscales
	}

	let history = $state<HistoryItem[]>([]);
	let historyStats = $state<HistoryStats | null>(null);
	let showHistory = $state(true);
	let isLoadingHistory = $state(false);

	// Active history tracking
	let activeHistoryId = $state<string | null>(null);
	let hasUnsavedChanges = $state(false);
	let lastUpdated = $state<string | null>(data.template?.updatedAt || null);

	// Confirmation dialog state
	let showConfirmDialog = $state(false);
	let pendingHistoryItem = $state<HistoryItem | null>(null);

	// Layer specific Loading states
	let processingLayerId = $state<string | null>(null);
	// Settings for layer upscale overlay
	let layerUpscaleSettings = $state<Map<string, { downscale: boolean }>>(new Map());

	// Global processing guard to prevent race conditions (must be after all dependencies)
	let isAnyProcessing = $derived(isDecomposing || isSaving || isUpscaling || !!processingLayerId);

	// Layer merge state
	let mergeMode = $state(false);
	let selectedForMerge = $state<Set<string>>(new Set());
	let mergeTargets = $state<Map<string, string>>(new Map()); // layerId -> targetLayerId to merge into
	let isMerging = $state(false);

	// Original file layer - shown at the top of layers list
	let showOriginalLayer = $state(true);

	// Pending action panel state (for action execution below preview)
	let pendingAction = $state<'upscale' | 'decompose' | 'remove' | null>(null);
	let pendingActionLayerId = $state<string | null>(null);
	let removePrompt = $state(''); // Prompt for what to remove from the image

	// Expanded history items - for uncollapse behavior
	let expandedHistoryItems = $state<Set<string>>(new Set());

	// Drag and drop state (from history)
	let isDraggingOverLayers = $state(false);

	// Drag and drop state (layer reordering)
	let draggedLayerId = $state<string | null>(null);
	let dragOverLayerId = $state<string | null>(null);

	// Session persistence state
	let saveState = $state<'saved' | 'saving' | 'unsaved'>('saved');
	let lastSavedAt = $state<Date | null>(null);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	// Layer opacity state
	let layerOpacity = $state<Map<string, number>>(new Map());

	// Layer card expansion state (for settings panel)
	let expandedLayerIds = $state<Set<string>>(new Set());

	// All layers visibility toggle
	let allLayersVisible = $state(true);

	function toggleLayerExpanded(layerId: string) {
		const newSet = new Set(expandedLayerIds);
		if (newSet.has(layerId)) {
			newSet.delete(layerId);
		} else {
			newSet.add(layerId);
		}
		expandedLayerIds = newSet;
	}

	function toggleAllLayersVisibility() {
		allLayersVisible = !allLayersVisible;
		// Update all layer selections
		for (const [layerId, selection] of layerSelections) {
			if (selection) {
				layerSelections.set(layerId, { ...selection, included: allLayersVisible });
			}
		}
		layerSelections = new Map(layerSelections);
		hasUnsavedChanges = true;
		saveState = 'unsaved';
	}

	function handleMenuAction(
		action: 'decompose' | 'upscale' | 'remove' | 'custom',
		layerId: string
	) {
		if (action === 'custom') {
			// TODO: Custom prompt action
			toast.info('Custom prompt coming soon');
		} else {
			setPendingAction(action, layerId);
		}
	}

	// Set layer as main image state
	let isSettingMain = $state(false);

	async function setAsMainImage(layerId: string) {
		// Find the layer
		const layer = currentLayers.find((l) => l.id === layerId);
		if (!layer) {
			toast.error('Layer not found');
			return;
		}

		// Confirm action
		if (
			!confirm(
				`Are you sure you want to set this layer as the ${activeSide} template background?\n\nThis will replace the current ${activeSide} image.`
			)
		) {
			return;
		}

		isSettingMain = true;
		try {
			const result = await saveEnhancedImage({
				assetId: data.asset.id,
				imageUrl: layer.imageUrl,
				side: activeSide
			});

			if (result.success) {
				toast.success(`Successfully set layer as ${activeSide} template background`);
				// Update local state
				if (activeSide === 'front') {
					frontImageUrl = result.url;
					if (data.template) {
						data.template.frontBackground = result.url;
					}
				} else {
					backImageUrl = result.url;
					if (data.template) {
						data.template.backBackground = result.url;
					}
				}
			}
		} catch (err) {
			console.error('Set as main error:', err);
			toast.error('Failed to set layer as main image');
		} finally {
			isSettingMain = false;
		}
	}

	let originalLayer = $derived({
		id: 'original-file',
		name: 'Original File',
		imageUrl: currentImageUrl || '',
		zIndex: -1, // Below all decomposed layers
		suggestedType: 'graphic' as const,
		side: activeSide,
		bounds: {
			x: 0,
			y: 0,
			width: data.asset.widthPixels || 1050,
			height: data.asset.heightPixels || 600
		},
		isOriginal: true,
		parentId: undefined
	});

	// Layer Group Expansion State
	let expandedLayerGroups = $state<Set<string>>(new Set(['original-file']));

	function toggleLayerGroup(layerId: string) {
		const newSet = new Set(expandedLayerGroups);
		if (newSet.has(layerId)) {
			newSet.delete(layerId);
		} else {
			newSet.add(layerId);
		}
		expandedLayerGroups = newSet;
	}

	// Tree View Rendering Logic
	interface DisplayLayerItem {
		layer: DecomposedLayer | typeof originalLayer;
		depth: number;
		hasChildren: boolean;
		isExpanded: boolean;
		isParent: boolean;
	}

	let displayLayers = $derived.by(() => {
		const result: DisplayLayerItem[] = [];
		const layers = currentLayers;

		// Map children to parents
		const childrenMap = new Map<string, typeof layers>();
		layers.forEach((l) => {
			if (l.parentId) {
				const existing = childrenMap.get(l.parentId) || [];
				existing.push(l);
				childrenMap.set(l.parentId, existing);
			}
		});

		// Also check original layer children
		const originalChildren = layers.filter((l) => l.parentId === 'original-file');
		if (originalChildren.length > 0) {
			childrenMap.set('original-file', originalChildren);
		}

		// Helper to recursively add layers
		const addNode = (layer: DecomposedLayer | typeof originalLayer, depth: number) => {
			const children = childrenMap.get(layer.id) || [];
			const hasChildren = children.length > 0;
			const isExpanded = expandedLayerGroups.has(layer.id);

			result.push({
				layer,
				depth,
				hasChildren,
				isExpanded,
				isParent: hasChildren // Treat as parent if it has children
			});

			if (hasChildren && isExpanded) {
				children.forEach((child) => addNode(child, depth + 1));
			}
		};

		// 1. Add Original Layer (Root if image exists AND visible)
		if (currentImageUrl && showOriginalLayer) {
			addNode(originalLayer, 0);
		}

		// 2. Add other Root layers (layers with no parentId, or orphaned children of hidden original)
		const trueRoots = layers.filter((l) => {
			if (!l.parentId) return true;
			// If parent is original-file but original is hidden, treat as root
			if (l.parentId === 'original-file' && !showOriginalLayer) return true;
			return false;
		});

		trueRoots.forEach((root) => {
			addNode(root, 0);
		});

		return result;
	});

	function toggleMergeMode() {
		mergeMode = !mergeMode;
		if (!mergeMode) {
			selectedForMerge = new Set();
			mergeTargets = new Map();
		}
	}

	function toggleMergeSelection(layerId: string) {
		const newSet = new Set(selectedForMerge);
		if (newSet.has(layerId)) {
			newSet.delete(layerId);
		} else {
			newSet.add(layerId);
		}
		selectedForMerge = newSet;
	}

	// Get eligible merge targets for a layer (other visible layers, excluding itself)
	function getMergeTargetOptions(layerId: string) {
		return currentLayers.filter(
			(l) =>
				l.id !== layerId &&
				l.id !== 'original-file' &&
				layerSelections.get(l.id)?.included !== false
		);
	}

	// Layer opacity functions
	function getLayerOpacity(layerId: string): number {
		return layerOpacity.get(layerId) ?? 100;
	}

	function setLayerOpacity(layerId: string, value: number) {
		const newMap = new Map(layerOpacity);
		newMap.set(layerId, value);
		layerOpacity = newMap;
	}

	// Set merge target for a layer
	function setMergeTarget(layerId: string, targetId: string | undefined) {
		const newMap = new Map(mergeTargets);
		if (targetId) {
			newMap.set(layerId, targetId);
			// Also add to selectedForMerge for the merge action
			selectedForMerge.add(layerId);
			selectedForMerge.add(targetId);
			selectedForMerge = new Set(selectedForMerge);
		} else {
			newMap.delete(layerId);
			// Remove from selectedForMerge if no other layer targets this one
			const stillTargeted = Array.from(newMap.values()).includes(layerId);
			const stillTargeting = newMap.has(layerId);
			if (!stillTargeted && !stillTargeting) {
				selectedForMerge.delete(layerId);
				selectedForMerge = new Set(selectedForMerge);
			}
		}
		mergeTargets = newMap;
	}

	async function handleMergeLayers() {
		if (selectedForMerge.size < 2) {
			toast.error('Select at least 2 layers to merge');
			return;
		}

		isMerging = true;
		try {
			const layers = activeSide === 'front' ? frontLayers : backLayers;
			const layersToMerge = layers.filter((l) => selectedForMerge.has(l.id));

			// Sort by zIndex for proper compositing order
			layersToMerge.sort((a, b) => a.zIndex - b.zIndex);

			// Create canvas for compositing
			const canvas = document.createElement('canvas');
			const width = data.asset.widthPixels || 1050;
			const height = data.asset.heightPixels || 600;
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Could not create canvas context');

			// Draw each layer onto the canvas
			for (const layer of layersToMerge) {
				const img = new Image();
				img.crossOrigin = 'anonymous';
				await new Promise<void>((resolve, reject) => {
					img.onload = () => {
						ctx.drawImage(img, 0, 0, width, height);
						resolve();
					};
					img.onerror = () => reject(new Error(`Failed to load layer: ${layer.name}`));
					img.src = getProxiedUrl(layer.imageUrl) || layer.imageUrl;
				});
			}

			// Convert to blob and upload
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					(b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
					'image/png'
				);
			});

			// Convert to base64
			const reader = new FileReader();
			const base64 = await new Promise<string>((resolve, reject) => {
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});

			// Upload merged image
			const uploadRes = await uploadProcessedImage({
				imageBase64: base64,
				mimeType: 'image/png'
			});

			if (!uploadRes.success || !uploadRes.url) {
				throw new Error(uploadRes.error || 'Failed to upload merged image');
			}

			// Find the insertion point (where the first merged layer was)
			const firstMergedIndex = layers.findIndex((l) => selectedForMerge.has(l.id));

			// Remove merged layers
			const remainingLayers = layers.filter((l) => !selectedForMerge.has(l.id));

			// Create new merged layer
			const mergedLayer = {
				id: crypto.randomUUID(),
				name: `Merged (${layersToMerge.length} layers)`,
				imageUrl: uploadRes.url,
				zIndex: firstMergedIndex,
				suggestedType: 'graphic' as const,
				side: activeSide,
				bounds: { x: 0, y: 0, width, height }
			};

			// Insert merged layer at the position of first merged layer
			remainingLayers.splice(firstMergedIndex, 0, mergedLayer);

			// Reindex zIndex
			remainingLayers.forEach((l, i) => {
				l.zIndex = i;
			});

			// Remove old selections
			selectedForMerge.forEach((id) => layerSelections.delete(id));

			// Add new selection for merged layer
			layerSelections.set(mergedLayer.id, {
				layerId: mergedLayer.id,
				included: true,
				elementType: 'image',
				variableName: `merged_layer_${mergedLayer.zIndex}`,
				bounds: mergedLayer.bounds,
				layerImageUrl: mergedLayer.imageUrl,
				side: activeSide
			});
			layerSelections = new Map(layerSelections);

			// Update layers
			if (activeSide === 'front') {
				frontLayers = remainingLayers;
			} else {
				backLayers = remainingLayers;
			}

			// Reset merge mode
			mergeMode = false;
			selectedForMerge = new Set();
			hasUnsavedChanges = true;

			toast.success(`Merged ${layersToMerge.length} layers into one`);
		} catch (err: any) {
			console.error('Merge error:', err);
			toast.error(err.message || 'Failed to merge layers');
		} finally {
			isMerging = false;
		}
	}

	// Toggle history item expanded/collapsed state
	function toggleHistoryExpanded(itemId: string) {
		const newSet = new Set(expandedHistoryItems);
		if (newSet.has(itemId)) {
			newSet.delete(itemId);
		} else {
			newSet.add(itemId);
		}
		expandedHistoryItems = newSet;
	}

	// Set pending action for a layer (action panel below preview)
	function setPendingAction(action: 'upscale' | 'decompose' | 'remove', layerId: string) {
		pendingAction = action;
		pendingActionLayerId = layerId;
		if (action !== 'remove') {
			removePrompt = ''; // Clear remove prompt if switching to another action
		}
	}

	// Clear pending action
	function clearPendingAction() {
		pendingAction = null;
		pendingActionLayerId = null;
		removePrompt = '';
	}

	// Execute pending action
	async function executePendingAction() {
		if (!pendingAction || !pendingActionLayerId) return;

		let layer;
		if (pendingActionLayerId === 'original-file') {
			layer = originalLayer;
		} else {
			const layers = activeSide === 'front' ? frontLayers : backLayers;
			layer = layers.find((l) => l.id === pendingActionLayerId);
		}

		if (!layer) {
			toast.error('Layer not found');
			clearPendingAction();
			return;
		}

		if (pendingAction === 'upscale') {
			if (layer.id === 'original-file') {
				await handleUpscale();
			} else {
				await handleLayerUpscale(layer);
			}
		} else if (pendingAction === 'decompose') {
			if (layer.id === 'original-file') {
				await handleDecompose();
			} else {
				await handleLayerDecompose(layer);
			}
		} else if (pendingAction === 'remove') {
			await handleLayerRemove(layer);
		}

		clearPendingAction();
	}

	// Drag and drop handlers for adding layers from history
	function handleDragStart(e: DragEvent, layer: any, historyItemId: string) {
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData(
			'application/json',
			JSON.stringify({
				type: 'history-layer',
				layer,
				historyItemId
			})
		);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
		isDraggingOverLayers = true;
	}

	function handleDragLeave() {
		isDraggingOverLayers = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDraggingOverLayers = false;

		if (!e.dataTransfer) return;

		try {
			const data = JSON.parse(e.dataTransfer.getData('application/json'));
			if (data.type !== 'history-layer') return;

			const layer = data.layer;
			const layers = activeSide === 'front' ? frontLayers : backLayers;

			// Create new layer with unique ID
			const newLayer: DecomposedLayer = {
				id: crypto.randomUUID(),
				name: layer.name || `Layer ${layers.length + 1}`,
				imageUrl: layer.imageUrl || layer.url,
				zIndex: layers.length, // Add at the end
				suggestedType: layer.suggestedType || 'unknown',
				side: activeSide,
				bounds: layer.bounds || {
					x: 0,
					y: 0,
					width: layer.width || 100,
					height: layer.height || 100
				}
			};

			// Add to layers
			if (activeSide === 'front') {
				frontLayers = [...frontLayers, newLayer];
			} else {
				backLayers = [...backLayers, newLayer];
			}

			// Add selection
			layerSelections.set(newLayer.id, {
				layerId: newLayer.id,
				included: true,
				elementType: 'image',
				variableName: `layer_${newLayer.zIndex + 1}`,
				bounds: newLayer.bounds || { x: 0, y: 0, width: 100, height: 100 },
				layerImageUrl: newLayer.imageUrl,
				side: activeSide
			});
			layerSelections = new Map(layerSelections);

			hasUnsavedChanges = true;
			toast.success(`Added "${newLayer.name}" to layers`);
		} catch (err) {
			console.error('Drop error:', err);
		}
	}

	function getLayerSettings(layerId: string) {
		return layerUpscaleSettings.get(layerId) ?? { downscale: false };
	}

	function toggleLayerDownscale(layerId: string) {
		const s = getLayerSettings(layerId);
		layerUpscaleSettings.set(layerId, { ...s, downscale: !s.downscale });
		layerUpscaleSettings = new Map(layerUpscaleSettings);
	}

	async function handleLayerUpscale(layer: DecomposedLayer) {
		if (processingLayerId) return;
		processingLayerId = layer.id;

		try {
			const settings = getLayerSettings(layer.id);
			let targetUrl = layer.imageUrl;

			// If downscale requested, process first
			if (settings.downscale) {
				const toastId = toast.loading('Downscaling image...');
				try {
					// 1. Fetch original
					const fetchUrl = getProxiedUrl(targetUrl);
					if (!fetchUrl) throw new Error('Invalid image URL');
					const response = await fetch(fetchUrl);
					const blob = await response.blob();

					// 2. Downscale (0.5x)
					const downscaledBlob = await downscaleImage(blob, 0.5);

					// 3. Upload
					const base64 = await fileToDataUrl(downscaledBlob);
					const uploadRes = await uploadProcessedImage({
						imageBase64: base64,
						mimeType: 'image/png'
					});

					if (!uploadRes.success || !uploadRes.url) {
						throw new Error(uploadRes.error || 'Failed to upload downscaled image');
					}
					targetUrl = uploadRes.url;
					toast.success('Image downscaled, starting upscale...', { id: toastId });
				} catch (e: any) {
					console.error('Downscale failed:', e);
					toast.error(`Downscale failed: ${e.message}`, { id: toastId });
					processingLayerId = null;
					return;
				}
			}

			toast.loading('Upscaling layer...', { id: 'layer-upscale' });
			const result = await upscaleImagePreview({
				imageUrl: targetUrl,
				model: upscaleModel, // Use global model selection
				side: activeSide,
				templateId: data.template?.id ?? null
			});

			if (result.success && result.upscaledUrl) {
				// Update layer URL
				const layersList = activeSide === 'front' ? frontLayers : backLayers;
				const index = layersList.findIndex((l) => l.id === layer.id);
				if (index !== -1) {
					const updatedLayer = { ...layersList[index], imageUrl: result.upscaledUrl };
					if (activeSide === 'front') {
						frontLayers[index] = updatedLayer;
						// frontLayers = [...frontLayers]; // Trigger reactivity if needed, $state array should be fine
					} else {
						backLayers[index] = updatedLayer;
					}

					// Update selection URL too if it exists
					const sel = layerSelections.get(layer.id);
					if (sel) {
						layerSelections.set(layer.id, { ...sel, layerImageUrl: result.upscaledUrl });
						layerSelections = new Map(layerSelections);
					}
				}
				toast.success('Layer upscaled successfully', { id: 'layer-upscale' });

				// Refresh history to show the new upscale
				loadHistory();
			} else {
				throw new Error(result.error || 'Upscale failed');
			}
		} catch (e: any) {
			console.error('Layer upscale error:', e);
			toast.error(e.message || 'Layer upscale failed', { id: 'layer-upscale' });
		} finally {
			processingLayerId = null;
		}
	}

	async function handleLayerDecompose(layer: DecomposedLayer) {
		if (processingLayerId) return;
		processingLayerId = layer.id;

		try {
			toast.loading(`Decomposing layer "${layer.name}"...`, { id: 'layer-decompose' });

			const result = await decomposeImage({
				imageUrl: layer.imageUrl,
				numLayers: numLayers,
				prompt: prompt,
				negative_prompt: negativePrompt,
				side: activeSide
			});

			if (result.success && result.layers) {
				const newLayers: DecomposedLayer[] = result.layers.map((l: any, i: number) => ({
					id: crypto.randomUUID(),
					name: `${layer.name} - Sub ${i + 1}`,
					imageUrl: l.url,
					zIndex: layer.zIndex, // Could adjust zIndex order if needed
					suggestedType: 'unknown',
					side: activeSide,
					bounds: { x: 0, y: 0, width: l.width, height: l.height },
					parentId: layer.id // Set parent relationship
				}));

				// Update Parent visibility
				// We don't remove the parent anymore, just hide it.
				const parentSelection = layerSelections.get(layer.id);
				if (parentSelection) {
					layerSelections.set(layer.id, { ...parentSelection, included: false }); // Hide parent
				}

				// Insert new layers after parent
				const layersList = activeSide === 'front' ? frontLayers : backLayers;
				const index = layersList.findIndex((l) => l.id === layer.id);

				if (index !== -1) {
					if (activeSide === 'front') {
						frontLayers.splice(index + 1, 0, ...newLayers); // Insert after
						frontLayers = frontLayers;
					} else {
						backLayers.splice(index + 1, 0, ...newLayers);
						backLayers = backLayers;
					}

					// Add new selections (visible by default)
					newLayers.forEach((newLayer) => {
						layerSelections.set(newLayer.id, {
							layerId: newLayer.id,
							included: true,
							elementType: 'image',
							variableName: `layer_${newLayer.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`,
							bounds: newLayer.bounds || { x: 0, y: 0, width: 100, height: 100 },
							layerImageUrl: newLayer.imageUrl,
							side: activeSide
						});
					});
					layerSelections = new Map(layerSelections);

					// Auto-expand the parent group
					toggleLayerGroup(layer.id);
					if (!expandedLayerGroups.has(layer.id)) toggleLayerGroup(layer.id);

					hasUnsavedChanges = true;
					toast.success(`Layer decomposed into ${newLayers.length} sub-layers`, {
						id: 'layer-decompose'
					});

					// Refresh history to show the new decomposition
					loadHistory();
				}
			} else {
				throw new Error(result.error || 'Decomposition failed');
			}
		} catch (e: any) {
			console.error('Layer decompose error:', e);
			toast.error(e.message || 'Layer decomposition failed', { id: 'layer-decompose' });
		} finally {
			processingLayerId = null;
		}
	}

	async function handleLayerRemove(layer: DecomposedLayer | typeof originalLayer) {
		if (processingLayerId) return;
		if (!removePrompt.trim()) {
			toast.error('Please enter what you want to remove from the image');
			return;
		}

		processingLayerId = layer.id;

		try {
			toast.loading(`Removing "${removePrompt}" from layer...`, { id: 'layer-remove' });

			const result = await removeElementFromLayer({
				imageUrl: layer.imageUrl,
				prompt: removePrompt,
				imageWidth: data.asset.widthPixels || undefined,
				imageHeight: data.asset.heightPixels || undefined,
				side: activeSide,
				templateId: data.template?.id ?? null
			});

			if (result.success && result.resultUrl) {
				// Update layer URL with the processed image
				if (layer.id === 'original-file') {
					// For original layer, we need to update the main preview or create a new layer
					const newLayer: DecomposedLayer = {
						id: crypto.randomUUID(),
						name: `Removed: ${removePrompt.substring(0, 20)}${removePrompt.length > 20 ? '...' : ''}`,
						imageUrl: result.resultUrl,
						zIndex: currentLayers.length,
						suggestedType: 'graphic',
						side: activeSide,
						bounds: {
							x: 0,
							y: 0,
							width: data.asset.widthPixels || 1050,
							height: data.asset.heightPixels || 600
						},
						parentId: 'original-file'
					};

					// Add to layers
					if (activeSide === 'front') {
						frontLayers = [...frontLayers, newLayer];
					} else {
						backLayers = [...backLayers, newLayer];
					}

					// Add selection
					layerSelections.set(newLayer.id, {
						layerId: newLayer.id,
						included: true,
						elementType: 'image',
						variableName: `removed_${newLayer.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`,
						bounds: newLayer.bounds || {
							x: 0,
							y: 0,
							width: data.asset.widthPixels || 1050,
							height: data.asset.heightPixels || 600
						},
						layerImageUrl: newLayer.imageUrl,
						side: activeSide
					});
					layerSelections = new Map(layerSelections);

					// Auto-expand original
					if (!expandedLayerGroups.has('original-file')) {
						toggleLayerGroup('original-file');
					}
				} else {
					// Update existing layer URL
					const layersList = activeSide === 'front' ? frontLayers : backLayers;
					const index = layersList.findIndex((l) => l.id === layer.id);
					if (index !== -1) {
						const updatedLayer = { ...layersList[index], imageUrl: result.resultUrl };
						if (activeSide === 'front') {
							frontLayers[index] = updatedLayer;
						} else {
							backLayers[index] = updatedLayer;
						}

						// Update selection URL too if it exists
						const sel = layerSelections.get(layer.id);
						if (sel) {
							layerSelections.set(layer.id, { ...sel, layerImageUrl: result.resultUrl });
							layerSelections = new Map(layerSelections);
						}
					}
				}

				hasUnsavedChanges = true;
				toast.success('Element removed successfully', { id: 'layer-remove' });

				// Refresh history
				loadHistory();
			} else {
				throw new Error(result.error || 'Remove element failed');
			}
		} catch (e: any) {
			console.error('Layer remove error:', e);
			toast.error(e.message || 'Failed to remove element', { id: 'layer-remove' });
		} finally {
			processingLayerId = null;
		}
	}

	// Filtered history for current side
	let filteredHistory = $derived(
		history.filter((item) => item.side === activeSide || item.side === 'unknown')
	);

	// Credit cost for decomposition
	const decomposeCost = CREDIT_COSTS.AI_DECOMPOSE;

	// Session persistence functions
	function saveSessionToStorage() {
		if (!data.asset?.id) return;

		saveState = 'saving';
		const session: DecomposeSession = {
			assetId: data.asset.id,
			frontLayers,
			backLayers,
			layerSelections: Object.fromEntries(layerSelections),
			layerOpacity: Object.fromEntries(layerOpacity),
			currentSide: activeSide,
			showOriginalLayer,
			savedAt: new Date().toISOString()
		};
		saveSession(session);
		saveState = 'saved';
		lastSavedAt = new Date();
	}

	function triggerAutoSave() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveState = 'unsaved';
		saveTimeout = setTimeout(() => {
			saveSessionToStorage();
		}, 2000); // 2 second debounce
	}

	function tryLoadSession(): boolean {
		if (!data.asset?.id) return false;

		const session = loadSession(data.asset.id);
		if (!session) return false;

		// Restore state from session
		frontLayers = session.frontLayers || [];
		backLayers = session.backLayers || [];
		layerSelections = new Map(Object.entries(session.layerSelections || {}));
		layerOpacity = new Map(Object.entries(session.layerOpacity || {}));
		activeSide = session.currentSide || 'front';
		showOriginalLayer = session.showOriginalLayer ?? true;
		lastSavedAt = session.savedAt ? new Date(session.savedAt) : null;
		saveState = 'saved';

		return true;
	}

	onMount(() => {
		loadHistory();

		// Try to restore session, otherwise load from template
		const restored = tryLoadSession();
		if (restored) {
			toast.success('Restored previous session');
		} else {
			loadExistingElements();
		}
	});

	// Auto-save effect - triggers on relevant state changes
	$effect(() => {
		// Track all state that should trigger auto-save
		const _ = [
			frontLayers,
			backLayers,
			layerSelections,
			layerOpacity,
			showOriginalLayer,
			activeSide
		];
		// Only trigger if we have layers or selections
		if (frontLayers.length > 0 || backLayers.length > 0 || layerSelections.size > 0) {
			triggerAutoSave();
		}
	});

	function loadExistingElements() {
		if (!data.template?.templateElements || data.template.templateElements.length === 0) return;

		const elements = data.template.templateElements;
		const frontList: DecomposedLayer[] = [];
		const backList: DecomposedLayer[] = [];

		elements.forEach((el: any) => {
			const side = el.side || 'front';
			const layer: DecomposedLayer = {
				id: el.id || crypto.randomUUID(),
				name: el.variableName || `Element ${el.id}`,
				imageUrl: el.src || '',
				zIndex: el.zIndex || 0,
				suggestedType: el.type || 'image',
				side: side,
				bounds: {
					x: el.x || 0,
					y: el.y || 0,
					width: el.width || 100,
					height: el.height || 100
				}
			};

			if (side === 'front') frontList.push(layer);
			else backList.push(layer);

			// Initialize selection
			layerSelections.set(layer.id, {
				layerId: layer.id,
				included: true,
				elementType: el.type || 'image',
				variableName: el.variableName || `layer_${layer.id}`,
				bounds: layer.bounds || { x: 0, y: 0, width: 100, height: 100 },
				layerImageUrl: layer.imageUrl,
				side: side
			});
		});

		frontLayers = frontList.sort((a, b) => a.zIndex - b.zIndex);
		backLayers = backList.sort((a, b) => a.zIndex - b.zIndex);
		layerSelections = new Map(layerSelections);
		hasUnsavedChanges = false;
	}

	async function loadHistory() {
		try {
			isLoadingHistory = true;
			// The query function gets session info server-side and filters by org_id
			const result = await getDecomposeHistoryWithStats({ templateId: data.template?.id });
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

	async function handleUpscale() {
		if (!currentImageUrl) {
			toast.error('No image available for this side');
			return;
		}

		isUpscaling = true;

		try {
			let targetUrl = currentImageUrl;

			if (removeWatermarks) {
				const toastId = toast.loading('Removing AI watermarks (this may take a moment)...');
				try {
					// 1. Fetch image as blob
					// Note: Requires CORS to be configured on the asset bucket, or use proxy
					const fetchUrl = getProxiedUrl(currentImageUrl);
					if (!fetchUrl) throw new Error('Invalid image URL');

					const response = await fetch(fetchUrl);
					if (!response.ok) throw new Error('Failed to fetch original image');
					const blob = await response.blob();
					const file = new File([blob], 'input.png', { type: blob.type });

					// 2. Process image
					const imageData = await fileToImageData(file);
					const result = processImageLSB(imageData, undefined, 'high');

					// 3. Convert back to blob
					const processedBlob = await imageDataToBlob(result.imageData, 'png');

					// 4. Convert to base64 for upload
					const reader = new FileReader();
					const base64Promise = new Promise<string>((resolve, reject) => {
						reader.onload = () => resolve(reader.result as string);
						reader.onerror = reject;
					});
					reader.readAsDataURL(processedBlob);
					const base64 = await base64Promise;

					// 5. Upload processed image
					const uploadRes = await uploadProcessedImage({
						imageBase64: base64,
						mimeType: 'image/png'
					});

					if (!uploadRes.success || !uploadRes.url) {
						throw new Error(uploadRes.error || 'Failed to upload processed image');
					}

					targetUrl = uploadRes.url;
					toast.success('Watermarks removed', { id: toastId });
				} catch (e: any) {
					console.error('Watermark removal failed:', e);
					toast.error(`Watermark removal failed: ${e.message}. Proceeding with original image...`, {
						id: toastId
					});
					// Fallback to original image
				}
			}

			const result = await upscaleImagePreview({
				imageUrl: targetUrl,
				model: upscaleModel,
				side: activeSide,
				templateId: data.template?.id ?? null
			});

			if (result.success && result.upscaledUrl) {
				// Store upscaled URL for the current side
				console.log('[Decompose UI] Upscale success, setting URL:', result.upscaledUrl);
				console.log('[Decompose UI] Active side:', activeSide);
				if (activeSide === 'front') {
					frontUpscaledUrl = result.upscaledUrl;
					console.log('[Decompose UI] Set frontUpscaledUrl:', frontUpscaledUrl);
				} else {
					backUpscaledUrl = result.upscaledUrl;
					console.log('[Decompose UI] Set backUpscaledUrl:', backUpscaledUrl);
				}

				toast.success('Image upscaled successfully! You can now decompose the upscaled version.');

				// Show warning if history save failed
				if (result.historyWarning) {
					toast.warning(result.historyWarning);
				}

				// Refresh history to show the new upscale
				loadHistory();
			} else {
				console.log('[Decompose UI] Upscale failed:', result);
				toast.error(result.error || 'Upscale failed');
			}
		} catch (err: unknown) {
			console.error('Upscale error:', err);
			const errorMessage = err instanceof Error ? err.message : 'Failed to upscale image';
			toast.error(errorMessage);
		} finally {
			isUpscaling = false;
		}
	}

	function clearUpscaledPreview() {
		if (activeSide === 'front') {
			frontUpscaledUrl = null;
		} else {
			backUpscaledUrl = null;
		}
		toast.info('Upscaled preview cleared. Will use original image.');
	}

	/**
	 * Reset the current side - clears layers and loads latest template image
	 */
	function resetCurrentSide() {
		// Clear layers for current side
		if (activeSide === 'front') {
			// Clear selections for front layers
			frontLayers.forEach((layer) => layerSelections.delete(layer.id));
			frontLayers = [];
			frontUpscaledUrl = null;

			// Update image URL from template if available (latest version)
			if (data.template?.frontBackground) {
				frontImageUrl = data.template.frontBackground;
			}
		} else {
			// Clear selections for back layers
			backLayers.forEach((layer) => layerSelections.delete(layer.id));
			backLayers = [];
			backUpscaledUrl = null;

			// Update image URL from template if available (latest version)
			if (data.template?.backBackground) {
				backImageUrl = data.template.backBackground;
			}
		}

		// Clear pending action
		pendingAction = null;
		pendingActionLayerId = null;

		// Mark as no unsaved changes for this side
		hasUnsavedChanges = false;

		toast.success(`Reset ${activeSide} side. Loaded latest template image.`);
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
		const isUpscale = item.provider === 'fal-ai-upscale' || (!item.layers.length && item.resultUrl);

		if (!isUpscale && (!item.layers || item.layers.length === 0)) {
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

		if (isUpscale && item.resultUrl) {
			if (activeSide === 'front') {
				frontUpscaledUrl = item.resultUrl;
			} else {
				backUpscaledUrl = item.resultUrl;
			}
			toast.success('Loaded upscaled image from history');
			return;
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
			}
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

		// Use upscaled URL if available, otherwise use original
		const imageToDecompose = currentUpscaledUrl || currentImageUrl;

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
				imageUrl: imageToDecompose,
				numLayers,
				prompt,
				negative_prompt: negativePrompt,
				num_inference_steps: numInferenceSteps,
				guidance_scale: guidanceScale,
				acceleration,
				seed: Math.floor(Math.random() * 1000000),
				templateId: data.asset?.templateId ?? undefined,
				side: activeSide
			});

			if (result.success && result.layers) {
				// ... (rest of function)
				const layers: DecomposedLayer[] = result.layers.map((layer: any, index: number) => ({
					id: crypto.randomUUID(),
					name: `Layer ${index + 1}`,
					imageUrl: layer.url,
					zIndex: index, // New layers start fresh
					suggestedType: 'unknown',
					side: activeSide,
					bounds: { x: 0, y: 0, width: layer.width, height: layer.height },
					parentId: 'original-file' // Parent is original file
				}));

				// We do NOT clear existing layers anymore, we append them?
				// Or if this is "Decompose Original", do we wipe slate?
				// User flow: "after i decopcompress a original file layer i want you to hide the parent layer then show the children layers"
				// If we decompose original, we probably want to keep any OTHER work?
				// But previously it replaced everything.
				// Let's assume we ADD to the list, treating Original as parent.
				// But since Original is not in the list array, we just add these layers to the array.

				// Hide Original Layer
				showOriginalLayer = false;

				// Append new layers
				if (activeSide === 'front') {
					frontLayers = [...frontLayers, ...layers];
				} else {
					backLayers = [...backLayers, ...layers];
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
						side: activeSide
					});
				});
				layerSelections = new Map(layerSelections);

				// Expand Original group
				if (!expandedLayerGroups.has('original-file')) toggleLayerGroup('original-file');

				// Select first new layer
				if (layers.length > 0) {
					selectedLayerId = layers[0].id;
				}

				// Reset tracking state
				activeHistoryId = null;
				hasUnsavedChanges = true; // Changed! from false. We made changes.

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

	// Layer Management Functions
	function moveLayerUp(layerId: string) {
		const layers = activeSide === 'front' ? frontLayers : backLayers;
		const index = layers.findIndex((l) => l.id === layerId);
		if (index <= 0) return; // Already at top

		// Swap with previous layer
		[layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];
		// Update zIndex values
		layers.forEach((l, i) => {
			l.zIndex = i;
		});

		if (activeSide === 'front') frontLayers = [...layers];
		else backLayers = [...layers];
		hasUnsavedChanges = true;
	}

	function moveLayerDown(layerId: string) {
		const layers = activeSide === 'front' ? frontLayers : backLayers;
		const index = layers.findIndex((l) => l.id === layerId);
		if (index >= layers.length - 1) return; // Already at bottom

		// Swap with next layer
		[layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
		// Update zIndex values
		layers.forEach((l, i) => {
			l.zIndex = i;
		});

		if (activeSide === 'front') frontLayers = [...layers];
		else backLayers = [...layers];
		hasUnsavedChanges = true;
	}

	// Drag and drop reordering handlers
	function handleLayerDragStart(e: DragEvent, layerId: string) {
		if (layerId === 'original-file') return; // Can't drag original
		draggedLayerId = layerId;
		e.dataTransfer?.setData('text/plain', layerId);
		e.dataTransfer!.effectAllowed = 'move';
	}

	function handleLayerDragOver(e: DragEvent, layerId: string) {
		if (!draggedLayerId || draggedLayerId === layerId || layerId === 'original-file') return;
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOverLayerId = layerId;
	}

	function handleLayerDragLeave() {
		dragOverLayerId = null;
	}

	function handleLayerDrop(e: DragEvent, targetLayerId: string) {
		e.preventDefault();
		if (!draggedLayerId || draggedLayerId === targetLayerId || targetLayerId === 'original-file') {
			draggedLayerId = null;
			dragOverLayerId = null;
			return;
		}

		const layers = activeSide === 'front' ? frontLayers : backLayers;
		const fromIdx = layers.findIndex((l) => l.id === draggedLayerId);
		const toIdx = layers.findIndex((l) => l.id === targetLayerId);

		if (fromIdx === -1 || toIdx === -1) {
			draggedLayerId = null;
			dragOverLayerId = null;
			return;
		}

		// Remove from original position and insert at new position
		const [removed] = layers.splice(fromIdx, 1);
		layers.splice(toIdx, 0, removed);

		// Update zIndex values
		layers.forEach((l, i) => {
			l.zIndex = i;
		});

		// Trigger reactivity
		if (activeSide === 'front') frontLayers = [...layers];
		else backLayers = [...layers];

		hasUnsavedChanges = true;
		draggedLayerId = null;
		dragOverLayerId = null;
	}

	function handleLayerDragEnd() {
		draggedLayerId = null;
		dragOverLayerId = null;
	}

	function deleteLayer(layerId: string) {
		const layers = activeSide === 'front' ? frontLayers : backLayers;
		const index = layers.findIndex((l) => l.id === layerId);
		if (index === -1) return;

		// Remove from layers
		layers.splice(index, 1);

		// Remove selection
		layerSelections.delete(layerId);
		layerSelections = new Map(layerSelections);

		// Reindex remaining layers
		layers.forEach((l, i) => {
			l.zIndex = i;
		});

		if (activeSide === 'front') frontLayers = [...layers];
		else backLayers = [...layers];

		// Clear selection if this was selected
		if (selectedLayerId === layerId) {
			selectedLayerId = layers[0]?.id ?? null;
		}
		hasUnsavedChanges = true;
		toast.success('Layer deleted');
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
				mode: 'replace',
				expectedUpdatedAt: lastUpdated
			});

			if (result.success) {
				toast.success(result.message);
				goto(`/templates?id=${data.template.id}`);
			}
		} catch (err: any) {
			console.error('Save error:', err);
			if (err.status === 409) {
				toast.error('Template was modified by another user. Please refresh and try again.');
			} else {
				toast.error(err.message || 'Failed to save layers');
			}
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
			<div class="flex gap-2 items-center">
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

				<!-- Spacer -->
				<div class="flex-1"></div>

				<!-- Reset Current Side Button -->
				{#if currentLayers.length > 0 || hasUpscaledPreview}
					<button
						class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors
							bg-destructive/10 text-destructive hover:bg-destructive/20
							flex items-center gap-1.5"
						onclick={resetCurrentSide}
						title="Clear layers and reload latest template image"
					>
						<RotateCcw class="h-3.5 w-3.5" />
						Reset
					</button>
				{/if}
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
							<!-- Original File Layer (shown behind all others when enabled) -->
							{#if showOriginalLayer && currentImageUrl}
								<img
									src={currentImageUrl}
									alt="Original file"
									class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
									style="z-index: -1; opacity: 0.5;"
								/>
							{/if}

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
						<Button
							variant="ghost"
							size="sm"
							class="h-8 text-xs text-muted-foreground"
							onclick={() => (showAdvancedSettings = !showAdvancedSettings)}
						>
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
								<Textarea
									id="prompt"
									bind:value={prompt}
									class="h-24 text-xs"
									placeholder="Describe the ID card structure..."
								/>
							</div>

							<!-- Negative Prompt -->
							<div class="grid gap-2">
								<Label for="negative_prompt">Negative Prompt</Label>
								<Textarea
									id="negative_prompt"
									bind:value={negativePrompt}
									class="h-16 text-xs"
									placeholder="What to avoid..."
								/>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<!-- Inference Steps -->
								<div class="grid gap-2">
									<div class="flex items-center justify-between">
										<Label for="steps">Inference Steps: {numInferenceSteps}</Label>
									</div>
									<Slider
										id="steps"
										min={10}
										max={50}
										step={1}
										value={[numInferenceSteps]}
										type="multiple"
										onValueChange={(v: number[]) => (numInferenceSteps = v[0])}
									/>
								</div>

								<!-- Guidance Scale -->
								<div class="grid gap-2">
									<div class="flex items-center justify-between">
										<Label for="guidance">Guidance Scale: {guidanceScale}</Label>
									</div>
									<Slider
										id="guidance"
										min={1}
										max={20}
										step={0.1}
										value={[guidanceScale]}
										type="multiple"
										onValueChange={(v: number[]) => (guidanceScale = v[0])}
									/>
								</div>
							</div>

							<!-- Acceleration -->
							<div class="grid gap-2">
								<Label>Acceleration</Label>
								<div class="flex items-center gap-4">
									<div class="flex items-center space-x-2">
										<input
											type="radio"
											id="acc_none"
											name="acceleration"
											value="none"
											bind:group={acceleration}
											class="radio"
										/>
										<Label for="acc_none" class="font-normal">None</Label>
									</div>
									<div class="flex items-center space-x-2">
										<input
											type="radio"
											id="acc_regular"
											name="acceleration"
											value="regular"
											bind:group={acceleration}
											class="radio"
										/>
										<Label for="acc_regular" class="font-normal">Regular</Label>
									</div>
									<div class="flex items-center space-x-2">
										<input
											type="radio"
											id="acc_high"
											name="acceleration"
											value="high"
											bind:group={acceleration}
											class="radio"
										/>
										<Label for="acc_high" class="font-normal">High</Label>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Upscale Preview Section -->
					{#if hasUpscaledPreview}
						<div class="mb-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
							<div class="flex items-start gap-3">
								<button
									onclick={() => (showUpscaleModal = true)}
									class="h-16 w-24 flex-shrink-0 overflow-hidden rounded border border-green-500/30 bg-muted cursor-pointer hover:border-green-500 transition-colors group relative"
									title="Click to view full size"
								>
									<img
										src={currentUpscaledUrl}
										alt="Upscaled preview"
										class="h-full w-full object-contain"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
									>
										<ZoomIn
											class="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</div>
								</button>
								<div class="flex-1 min-w-0">
									<p
										class="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2"
									>
										<ZoomIn class="h-4 w-4" />
										Upscaled Preview Ready
									</p>
									<p class="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
										Click thumbnail to view full size. Click "Decompose" to use this version.
									</p>
								</div>
								<button
									onclick={clearUpscaledPreview}
									class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
									title="Clear upscaled preview"
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						</div>
					{/if}

					<div class="flex items-center gap-4 flex-wrap">
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

						<!-- Upscale Model -->
						<div class="flex items-center gap-2">
							<label for="upscaleModel" class="text-sm text-muted-foreground">Model:</label>
							<select
								id="upscaleModel"
								bind:value={upscaleModel}
								class="rounded border border-border bg-background px-2 py-1 text-sm"
							>
								<option value="ccsr">CCSR (1.5x)</option>
								<option value="seedvr">SeedVR</option>
								<option value="aurasr">AuraSR</option>
								<option value="esrgan">ESRGAN</option>
								<option value="recraft-creative">Creative (Recraft)</option>
							</select>
						</div>

						<!-- SynthID Removal Toggle (stays here) -->
						<div class="flex items-center gap-2 border-l border-border pl-4 ml-2">
							<div class="flex items-center space-x-2">
								<Switch id="remove-watermarks" bind:checked={removeWatermarks} />
								<Label for="remove-watermarks" class="text-xs cursor-pointer">Remove SynthID</Label>
							</div>
						</div>
					</div>

					<!-- Pending Action Panel (shows when a layer action is selected) -->
					{#if pendingAction && pendingActionLayerId}
						{@const actionLayer =
							pendingActionLayerId === 'original-file'
								? originalLayer
								: (activeSide === 'front' ? frontLayers : backLayers).find(
										(l) => l.id === pendingActionLayerId
									)}
						{#if actionLayer}
							<div class="mt-4 rounded-lg border-2 border-green-500/50 bg-green-500/5 p-4">
								<div class="flex items-center justify-between gap-4">
									<div class="flex items-center gap-3">
										<div
											class="w-14 h-10 rounded border border-green-500/30 bg-muted overflow-hidden flex-shrink-0"
										>
											<img
												src={actionLayer.imageUrl}
												alt={actionLayer.name}
												class="w-full h-full object-contain"
											/>
										</div>
										<div>
											<p
												class="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2"
											>
												{#if pendingAction === 'upscale'}
													<ZoomIn class="h-4 w-4" />
													Upscale Layer: {actionLayer.name}
												{:else if pendingAction === 'decompose'}
													<Wand2 class="h-4 w-4" />
													Decompose Layer: {actionLayer.name}
												{:else if pendingAction === 'remove'}
													<Eraser class="h-4 w-4" />
													Remove from Layer: {actionLayer.name}
												{/if}
											</p>
											<p class="text-xs text-green-600/80 dark:text-green-400/80">
												{#if pendingAction === 'upscale'}
													Using {upscaleModel} model
												{:else if pendingAction === 'decompose'}
													Split into {numLayers} sub-layers ({decomposeCost} credits)
												{:else if pendingAction === 'remove'}
													Enter what to remove (e.g. "watermark", "person", "text")
												{/if}
											</p>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Button variant="ghost" size="sm" class="h-8" onclick={clearPendingAction}>
											Cancel
										</Button>
										<Button
											variant="default"
											size="sm"
											class="h-8 bg-green-600 hover:bg-green-700 text-white"
											onclick={executePendingAction}
											disabled={isAnyProcessing ||
												(pendingAction === 'remove' && !removePrompt.trim())}
										>
											{#if isAnyProcessing}
												<Loader2 class="mr-2 h-4 w-4 animate-spin" />
												Processing...
											{:else}
												<Check class="mr-2 h-4 w-4" />
												Proceed
											{/if}
										</Button>
									</div>
								</div>

								{#if pendingAction === 'remove'}
									<div class="mt-3 pt-3 border-t border-green-500/20">
										<label
											for="remove-prompt"
											class="block text-xs font-medium text-green-700 dark:text-green-300 mb-1.5"
										>
											What do you want to remove?
										</label>
										<input
											id="remove-prompt"
											type="text"
											bind:value={removePrompt}
											placeholder="e.g. watermark, logo, person, text, background clutter..."
											class="w-full rounded-md border border-green-500/30 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
										/>
										<p class="mt-1.5 text-[10px] text-green-600/60 dark:text-green-400/60">
											AI will cleanly remove the specified element while maintaining image
											consistency.
										</p>
									</div>
								{/if}
							</div>
						{/if}
					{/if}
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
								{data.template.templateElements?.length || 0} existing elements • {data.template
									.widthPixels}x{data.template.heightPixels}px
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
			<div class="rounded-xl border border-border bg-card shadow-sm">
				<!-- Redesigned Header -->
				<div class="p-4 border-b border-border">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<!-- Layers Icon with Background -->
							<div class="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
								<Layers class="h-5 w-5 text-muted-foreground" />
							</div>
							<div>
								<h2 class="font-semibold text-foreground flex items-center gap-2">
									Detected Layers
								</h2>
								<div class="flex items-center gap-2 text-sm">
									<span class="text-muted-foreground"
										>({currentLayers.length + (showOriginalLayer ? 1 : 0)})</span
									>
									<!-- Save Status Indicator -->
									{#if saveState === 'saving'}
										<span class="flex items-center gap-1 text-muted-foreground">
											<Loader2 class="h-3 w-3 animate-spin" />
											<span class="text-xs">Saving...</span>
										</span>
									{:else if saveState === 'saved'}
										<span class="flex items-center gap-1 text-green-600 dark:text-green-400">
											<Check class="h-3 w-3" />
											<span class="text-xs">Saved</span>
										</span>
									{:else}
										<span class="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
											<Circle class="h-3 w-3" />
											<span class="text-xs">Unsaved</span>
										</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<!-- Toggle All Visibility -->
							<button
								class="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
								onclick={toggleAllLayersVisibility}
								title={allLayersVisible ? 'Hide all layers' : 'Show all layers'}
							>
								{#if allLayersVisible}
									<Eye class="h-5 w-5" />
								{:else}
									<EyeOff class="h-5 w-5" />
								{/if}
							</button>
							<!-- Merge Mode Toggle -->
							{#if currentLayers.length > 1}
								<button
									class="p-2 rounded-lg transition-colors {mergeMode
										? 'bg-violet-500/20 text-violet-600'
										: 'hover:bg-muted text-muted-foreground hover:text-foreground'}"
									onclick={toggleMergeMode}
									title={mergeMode ? 'Cancel merge' : 'Merge layers'}
								>
									<Merge class="h-5 w-5" />
								</button>
							{/if}
						</div>
					</div>

					<!-- Merge Action Bar -->
					{#if mergeMode}
						<div class="mt-3 p-2 rounded-md bg-violet-500/10 border border-violet-500/30">
							<div class="flex items-center justify-between">
								<span class="text-xs text-violet-700 dark:text-violet-300">
									{selectedForMerge.size} layers selected
								</span>
								<Button
									variant="default"
									size="sm"
									class="h-7 text-xs bg-violet-600 hover:bg-violet-700"
									disabled={selectedForMerge.size < 2 || isMerging}
									onclick={handleMergeLayers}
								>
									{#if isMerging}
										<Loader2 class="h-3 w-3 mr-1 animate-spin" />
										Merging...
									{:else}
										<Merge class="h-3 w-3 mr-1" />
										Merge Selected
									{/if}
								</Button>
							</div>
						</div>
					{/if}
				</div>

				<div
					class="max-h-[600px] overflow-y-auto transition-colors {isDraggingOverLayers
						? 'bg-green-500/10 ring-2 ring-green-500/50 ring-inset'
						: ''}"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					role="region"
					aria-label="Layers list"
				>
					{#if displayLayers.length === 0 && !currentImageUrl}
						<div class="p-8 text-center text-muted-foreground">
							<Wand2 class="h-8 w-8 mx-auto mb-2 opacity-30" />
							<p class="text-sm">No image available</p>
						</div>
					{:else}
						<div class="divide-y divide-border/50">
							{#each displayLayers as { layer, depth, hasChildren, isExpanded, isParent } (layer.id)}
								{@const selection = layerSelections.get(layer.id)}
								{@const isOriginal = layer.id === 'original-file'}
								{@const visible = isOriginal ? showOriginalLayer : selection?.included}
								{@const isLayerExpanded = expandedLayerIds.has(layer.id)}

								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<!-- Layer Card -->
								<div
									class="relative bg-muted/30 transition-colors
										{draggedLayerId === layer.id ? 'opacity-50' : ''}
										{dragOverLayerId === layer.id ? 'border-t-2 border-primary' : ''}"
									draggable={!isOriginal}
									ondragstart={(e) => handleLayerDragStart(e, layer.id)}
									ondragover={(e) => handleLayerDragOver(e, layer.id)}
									ondragleave={handleLayerDragLeave}
									ondrop={(e) => handleLayerDrop(e, layer.id)}
									ondragend={handleLayerDragEnd}
								>
									<!-- Active/Selected Indicator Bar -->
									<div
										class="absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors {selectedLayerId ===
										layer.id
											? 'bg-cyan-500'
											: isLayerExpanded
												? 'bg-cyan-500/50'
												: 'bg-transparent'}"
									></div>

									<!-- Layer Row (Collapsed View) -->
									<div
										class="flex items-center gap-3 p-3 pl-4 cursor-pointer hover:bg-muted/50"
										onclick={() => {
											if (!isOriginal) selectedLayerId = layer.id;
										}}
										onkeydown={(e) =>
											e.key === 'Enter' && !isOriginal && (selectedLayerId = layer.id)}
										tabindex={isOriginal ? -1 : 0}
										role="button"
									>
										<!-- Drag Handle -->
										{#if !isOriginal}
											<div
												class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
											>
												<GripVertical class="h-4 w-4" />
											</div>
										{:else}
											<div class="w-4 flex-shrink-0"></div>
										{/if}

										<!-- Visibility Toggle -->
										{#if isOriginal}
											<button
												class="flex-shrink-0 text-muted-foreground hover:text-foreground"
												onclick={(e) => {
													e.stopPropagation();
													showOriginalLayer = !showOriginalLayer;
												}}
												title={showOriginalLayer ? 'Hide original' : 'Show original'}
											>
												{#if showOriginalLayer}
													<Eye class="h-4 w-4" />
												{:else}
													<EyeOff class="h-4 w-4 opacity-50" />
												{/if}
											</button>
										{:else if mergeMode}
											{@const mergeOptions = getMergeTargetOptions(layer.id)}
											{@const currentTarget = mergeTargets.get(layer.id)}
											<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
											<div
												class="flex items-center flex-shrink-0"
												onclick={(e) => e.stopPropagation()}
											>
												<Select.Root
													type="single"
													value={currentTarget}
													onValueChange={(v) => setMergeTarget(layer.id, v || undefined)}
												>
													<Select.Trigger class="h-6 w-24 text-[10px] px-2">
														{#if currentTarget}
															<span class="text-violet-600 truncate">
																→ {currentLayers.find((l) => l.id === currentTarget)?.name ||
																	'Layer'}
															</span>
														{:else}
															<span class="text-muted-foreground">Merge into...</span>
														{/if}
													</Select.Trigger>
													<Select.Content>
														{#if currentTarget}
															<Select.Item value="">
																<span class="text-muted-foreground">None</span>
															</Select.Item>
														{/if}
														{#each mergeOptions as target (target.id)}
															<Select.Item value={target.id}>
																{target.name}
															</Select.Item>
														{/each}
													</Select.Content>
												</Select.Root>
											</div>
										{:else}
											<button
												class="flex-shrink-0 text-muted-foreground hover:text-foreground"
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
										{/if}

										<!-- Layer Thumbnail (Larger, Square) -->
										<div
											class="w-14 h-14 rounded-lg border border-border bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center"
										>
											{#if isOriginal && selection?.elementType === 'qr'}
												<span class="text-[10px] text-muted-foreground font-medium"
													>QR<br />Code</span
												>
											{:else}
												<img
													src={layer.imageUrl}
													alt={layer.name}
													class="w-full h-full object-contain"
													style="opacity: {getLayerOpacity(layer.id) / 100}"
												/>
											{/if}
										</div>

										<!-- Layer Info -->
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-foreground truncate">
													{layer.name}
												</span>
												<!-- Type Badge -->
												<span
													class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0
														{isOriginal
														? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
														: 'bg-muted text-muted-foreground border border-border'}"
												>
													{isOriginal ? 'SOURCE' : getTypeIcon(selection?.elementType || 'image')}
												</span>
											</div>
											<div class="flex items-center gap-2 mt-0.5">
												<span class="text-xs text-muted-foreground">
													z-index: {layer.zIndex}
												</span>
												<!-- Status Dot -->
												{#if !isOriginal && selection?.included}
													<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
												{/if}
											</div>
										</div>

										<!-- Right Side Controls -->
										<div class="flex items-center gap-1 flex-shrink-0">
											<!-- Delete Button -->
											{#if !isOriginal}
												<button
													class="p-2 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
													onclick={(e) => {
														e.stopPropagation();
														deleteLayer(layer.id);
													}}
													title="Delete layer"
												>
													<Trash2 class="h-4 w-4" />
												</button>
											{/if}

											<!-- Expand/Collapse Chevron -->
											{#if !isOriginal}
												<button
													class="p-2 text-muted-foreground hover:text-foreground transition-colors"
													onclick={(e) => {
														e.stopPropagation();
														toggleLayerExpanded(layer.id);
													}}
													title={isLayerExpanded ? 'Collapse' : 'Expand settings'}
												>
													{#if isLayerExpanded}
														<ChevronUp class="h-4 w-4" />
													{:else}
														<ChevronDown class="h-4 w-4" />
													{/if}
												</button>
											{/if}
										</div>
									</div>

									<!-- Expanded Settings Panel -->
									{#if !isOriginal && isLayerExpanded && selection}
										<div class="px-4 pb-4 space-y-4 border-t border-border/30 bg-background/50">
											<!-- Variable Name -->
											<div class="pt-4">
												<label
													for="varName-{layer.id}"
													class="text-xs font-medium text-cyan-600 dark:text-cyan-400 block mb-2"
												>
													Variable Name
												</label>
												<input
													id="varName-{layer.id}"
													type="text"
													value={selection.variableName}
													oninput={(e) =>
														updateVariableName(layer.id, (e.target as HTMLInputElement).value)}
													class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
													placeholder="layer_1"
												/>
											</div>

											<!-- Element Type -->
											<div>
												<label
													for="type-{layer.id}"
													class="text-xs font-medium text-cyan-600 dark:text-cyan-400 block mb-2"
												>
													Element Type
												</label>
												<div class="relative">
													<select
														id="type-{layer.id}"
														value={selection.elementType}
														onchange={(e) =>
															updateLayerType(
																layer.id,
																(e.target as HTMLSelectElement)
																	.value as LayerSelection['elementType']
															)}
														class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm appearance-none pr-10"
													>
														<option value="image">Image (Static graphic)</option>
														<option value="text">Text (Dynamic field)</option>
														<option value="photo">Photo (User upload)</option>
														<option value="qr">QR Code</option>
														<option value="signature">Signature</option>
													</select>
													<ChevronDown
														class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
													/>
												</div>
											</div>

											<!-- Opacity Control -->
											<div>
												<div class="flex items-center justify-between mb-2">
													<label class="text-xs font-medium text-cyan-600 dark:text-cyan-400"
														>Opacity</label
													>
													<span class="text-sm font-medium text-foreground"
														>{getLayerOpacity(layer.id)}%</span
													>
												</div>
												<Slider
													min={0}
													max={100}
													step={1}
													value={[getLayerOpacity(layer.id)]}
													onValueChange={(v) => setLayerOpacity(layer.id, v[0])}
													class="w-full"
												/>
											</div>

											<!-- Pre-shrink Toggle -->
											<div
												class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
											>
												<div>
													<p class="text-sm font-medium text-foreground">
														Pre-shrink before upscale
													</p>
													<p class="text-xs text-muted-foreground">Make artificially low-res</p>
												</div>
												<Switch
													id="downscale-{layer.id}"
													checked={getLayerSettings(layer.id).downscale}
													onCheckedChange={() => toggleLayerDownscale(layer.id)}
												/>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Layer Actions Bar -->
			<div class="rounded-xl border border-border bg-card p-3">
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-medium text-muted-foreground">
						{selectedLayerId
							? `Selected: ${currentLayers.find((l) => l.id === selectedLayerId)?.name || 'Layer'}`
							: 'Select a layer to enable actions'}
					</span>
					{#if selectedLayerId}
						<button
							class="text-xs text-muted-foreground hover:text-foreground"
							onclick={() => (selectedLayerId = null)}
						>
							Clear
						</button>
					{/if}
				</div>
				<div class="grid grid-cols-4 gap-2">
					<button
						class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-violet-500/10 hover:border-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
						onclick={() => selectedLayerId && handleMenuAction('decompose', selectedLayerId)}
						disabled={!selectedLayerId || isAnyProcessing}
						title="Decompose layer"
					>
						<Wand2 class="h-5 w-5 text-violet-600" />
						<span class="text-[10px] font-medium">Decompose</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-green-500/10 hover:border-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
						onclick={() => selectedLayerId && handleMenuAction('upscale', selectedLayerId)}
						disabled={!selectedLayerId || isAnyProcessing}
						title="Upscale layer"
					>
						<ZoomIn class="h-5 w-5 text-green-600" />
						<span class="text-[10px] font-medium">Upscale</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-red-500/10 hover:border-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
						onclick={() => selectedLayerId && handleMenuAction('remove', selectedLayerId)}
						disabled={!selectedLayerId || isAnyProcessing}
						title="Remove element from layer"
					>
						<Eraser class="h-5 w-5 text-red-600" />
						<span class="text-[10px] font-medium">Remove</span>
					</button>
					<button
						class="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
						onclick={() => selectedLayerId && handleMenuAction('custom', selectedLayerId)}
						disabled={!selectedLayerId || isAnyProcessing}
						title="Custom AI prompt"
					>
						<Sparkles class="h-5 w-5 text-amber-600" />
						<span class="text-[10px] font-medium">Custom</span>
					</button>
				</div>
			</div>

			<!-- AI Generations Gallery (Sidebar Vertical Layout) -->
			{#if history.length > 0 || isLoadingHistory}
				<div class="rounded-lg border border-border bg-card overflow-hidden">
					<div class="p-4 border-b border-border flex items-center justify-between">
						<h2 class="font-medium text-foreground flex items-center gap-2">
							<Sparkles class="h-4 w-4 text-violet-500" />
							History
							<span class="text-xs text-muted-foreground">
								({history.length})
							</span>
						</h2>
					</div>

					<div class="p-3 max-h-[600px] overflow-y-auto custom-scrollbar">
						{#if isLoadingHistory}
							<div class="flex items-center justify-center py-8">
								<Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						{:else}
							<div class="flex flex-col gap-3">
								{#each history as item (item.id)}
									{@const isUpscale = item.provider === 'fal-ai-upscale'}
									{@const isRemove = item.provider === 'runware-remove-element'}
									{@const isSingleResult = isUpscale || isRemove}
									{@const isExpanded = expandedHistoryItems.has(item.id)}

									<div class="space-y-2">
										<!-- History Item Card -->
										<button
											class="w-full group relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2 overflow-hidden transition-all hover:border-primary/50 hover:shadow-md
												{activeHistoryId === item.id ? 'ring-2 ring-primary border-primary' : ''}"
											onclick={() => {
												if (isSingleResult) {
													requestLoadFromHistory(item);
												} else {
													toggleHistoryExpanded(item.id);
												}
											}}
										>
											<!-- Thumbnail (Left) -->
											<div
												class="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded border border-border bg-muted"
											>
												<img
													src={isSingleResult && item.resultUrl
														? item.resultUrl
														: item.inputImageUrl}
													alt="AI Generation"
													class="w-full h-full object-cover"
												/>

												<!-- Active Indicator Overlay -->
												{#if activeHistoryId === item.id}
													<div
														class="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none"
													>
														<Check
															class="h-4 w-4 text-primary bg-background/80 rounded-full p-0.5"
														/>
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
													<span
														class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium
															{isUpscale
															? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
															: isRemove
																? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20'
																: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20'}"
													>
														{isUpscale
															? 'Upscale'
															: isRemove
																? 'Remove'
																: `${item.layers?.length || 0} layers`}
													</span>

													<!-- Expand Indicator -->
													{#if !isSingleResult}
														<div
															class="text-muted-foreground group-hover:text-foreground transition-colors"
														>
															{#if isExpanded}
																<ChevronUp class="h-3 w-3" />
															{:else}
																<ChevronDown class="h-3 w-3" />
															{/if}
														</div>
													{/if}
												</div>
											</div>
										</button>

										<!-- Expanded Layers List (Draggable) (Stays same) -->
										{#if isExpanded && !isSingleResult && item.layers}
											<div class="pl-4 space-y-2 border-l-2 border-border/50">
												<p class="text-[10px] text-muted-foreground font-medium">
													Drag layers to add:
												</p>
												{#each item.layers as layer, i}
													<div
														class="flex items-center gap-2 p-2 rounded border border-border bg-background hover:border-primary/50 cursor-move transition-colors"
														draggable="true"
														ondragstart={(e) => handleDragStart(e, layer, item.id)}
														role="button"
														tabindex="0"
													>
														<div class="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
															<img
																src={layer.imageUrl || layer.url}
																alt="Layer"
																class="w-full h-full object-contain"
															/>
														</div>
														<div class="min-w-0 flex-1">
															<p class="text-xs truncate" title={layer.name || `Layer ${i + 1}`}>
																{layer.name || `Layer ${i + 1}`}
															</p>
															<p class="text-[9px] text-muted-foreground">
																{(layer.confidence * 100).toFixed(0)}% conf
															</p>
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
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

<!-- Upscale Preview Modal -->
<Dialog.Root bind:open={showUpscaleModal}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] overflow-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<ZoomIn class="h-5 w-5 text-green-500" />
				Upscaled Image Preview (2x)
			</Dialog.Title>
			<Dialog.Description>
				This is the upscaled version that will be used for decomposition.
			</Dialog.Description>
		</Dialog.Header>
		<div class="mt-4 flex items-center justify-center bg-muted/30 rounded-lg p-4 overflow-auto">
			{#if currentUpscaledUrl}
				<img
					src={currentUpscaledUrl}
					alt="Upscaled preview full size"
					class="max-w-full max-h-[70vh] object-contain rounded border border-border"
				/>
			{/if}
		</div>
		<Dialog.Footer class="mt-4">
			<Button variant="outline" onclick={() => (showUpscaleModal = false)}>Close</Button>
			<Button
				onclick={() => {
					showUpscaleModal = false;
					handleDecompose();
				}}
			>
				<Wand2 class="mr-2 h-4 w-4" />
				Decompose This Image
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
