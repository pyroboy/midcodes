import { saveSession, loadSession, clearSession } from '$lib/utils/decomposeSession';
import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';

export class LayerManager {
	// Global State
	activeSide = $state<'front' | 'back'>('front');
	saveState = $state<'saved' | 'saving' | 'unsaved'>('saved');

	// Layer Data
	frontLayers = $state<DecomposedLayer[]>([]);
	backLayers = $state<DecomposedLayer[]>([]);
	selections = $state<Map<string, LayerSelection>>(new Map());

	// UI State
	opacity = $state<Map<string, number>>(new Map());
	expandedIds = $state<Set<string>>(new Set());
	mergeMode = $state(false);
	selectedForMerge = $state<Set<string>>(new Set());
	showOriginalLayer = $state(true);

	// Derived
	currentLayers = $derived(this.activeSide === 'front' ? this.frontLayers : this.backLayers);

	constructor(initialSide: 'front' | 'back' = 'front') {
		this.activeSide = initialSide;
	}

	setSide(side: 'front' | 'back') {
		this.activeSide = side;
	}

	// --- Core Layer Operations ---

	addLayer(layer: DecomposedLayer, selection: LayerSelection) {
		if (layer.side === 'front') this.frontLayers.push(layer);
		else this.backLayers.push(layer);

		this.selections.set(layer.id, selection);
		this.selections = new Map(this.selections); // Trigger reactivity
		this.markUnsaved();
	}

	removeLayer(layerId: string) {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const index = list.findIndex((l) => l.id === layerId);
		if (index === -1) return;

		list.splice(index, 1);
		// Re-index zIndex
		list.forEach((l, i) => (l.zIndex = i));

		this.selections.delete(layerId);
		this.selections = new Map(this.selections);
		this.markUnsaved();
	}

	moveLayer(layerId: string, direction: 'up' | 'down') {
		const list = this.activeSide === 'front' ? this.frontLayers : this.backLayers;
		const index = list.findIndex((l) => l.id === layerId);

		if (direction === 'up' && index > 0) {
			[list[index - 1], list[index]] = [list[index], list[index - 1]];
		} else if (direction === 'down' && index < list.length - 1) {
			[list[index], list[index + 1]] = [list[index + 1], list[index]];
		} else {
			return;
		}

		list.forEach((l, i) => (l.zIndex = i));
		this.markUnsaved();
	}

	// --- Selection & Metadata ---

	updateSelection(layerId: string, updates: Partial<LayerSelection>) {
		const current = this.selections.get(layerId);
		if (!current) return;
		this.selections.set(layerId, { ...current, ...updates });
		this.selections = new Map(this.selections);
		this.markUnsaved();
	}

	setOpacity(layerId: string, value: number) {
		this.opacity.set(layerId, value);
		this.opacity = new Map(this.opacity);
	}

	toggleMergeSelection(layerId: string) {
		if (this.selectedForMerge.has(layerId)) this.selectedForMerge.delete(layerId);
		else this.selectedForMerge.add(layerId);
		this.selectedForMerge = new Set(this.selectedForMerge);
	}

	// --- Session Management ---

	markUnsaved() {
		this.saveState = 'unsaved';
	}

	saveToStorage(assetId: string) {
		this.saveState = 'saving';
		saveSession({
			assetId,
			frontLayers: this.frontLayers,
			backLayers: this.backLayers,
			layerSelections: Object.fromEntries(this.selections),
			layerOpacity: Object.fromEntries(this.opacity),
			currentSide: this.activeSide,
			showOriginalLayer: this.showOriginalLayer,
			savedAt: new Date().toISOString()
		});
		this.saveState = 'saved';
	}

	loadFromStorage(assetId: string) {
		const session = loadSession(assetId);
		if (session) {
			this.frontLayers = session.frontLayers || [];
			this.backLayers = session.backLayers || [];
			this.selections = new Map(Object.entries(session.layerSelections || {}));
			this.opacity = new Map(Object.entries(session.layerOpacity || {}));
			this.activeSide = session.currentSide || 'front';
			this.showOriginalLayer = session.showOriginalLayer ?? true;
			this.saveState = 'saved';
			return true;
		}
		return false;
	}

	clearCurrentSide() {
		if (this.activeSide === 'front') {
			this.frontLayers.forEach((l) => this.selections.delete(l.id));
			this.frontLayers = [];
		} else {
			this.backLayers.forEach((l) => this.selections.delete(l.id));
			this.backLayers = [];
		}
		this.selections = new Map(this.selections);
		this.markUnsaved();
	}

	addFromHistory(historyLayer: any) {
		// Handle full history item (with layers)
		if (historyLayer.layers && historyLayer.layers.length > 0) {
			// It's a decompose history item with sub-layers
			historyLayer.layers.forEach((l: any, i: number) => {
				const { layer, selection } = this.createLayerObj(
					l.imageUrl,
					l.name || `History Layer ${i}`,
					l.bounds || { x: 0, y: 0, width: 100, height: 100 },
					this.activeSide,
					this.currentLayers.length
				);
				this.addLayer(layer, selection);
			});
		} else {
			// Single layer or history item without layers
			const imageUrl =
				historyLayer.imageUrl || historyLayer.resultUrl || historyLayer.inputImageUrl;
			if (!imageUrl) return;

			const { layer, selection } = this.createLayerObj(
				imageUrl,
				historyLayer.name || historyLayer.model || 'AI Result',
				historyLayer.bounds || { x: 0, y: 0, width: 100, height: 100 },
				this.activeSide,
				this.currentLayers.length
			);
			this.addLayer(layer, selection);
		}
	}

	// Helper to create objects
	createLayerObj(url: string, name: string, bounds: any, side: 'front' | 'back', zIndex: number) {
		const id = crypto.randomUUID();
		const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
		return {
			layer: {
				id,
				name,
				imageUrl: url,
				zIndex,
				suggestedType: 'unknown',
				side,
				bounds
			} as DecomposedLayer,
			selection: {
				layerId: id,
				included: true,
				elementType: 'image',
				variableName: `layer_${safeName}`,
				bounds,
				layerImageUrl: url,
				side
			} as LayerSelection
		};
	}
}
