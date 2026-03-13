/**
 * Floor Layout — reactive store for floor elements + canvas configs.
 * Used by POS FloorPlan and AllBranchesDashboard to render the real floor layout.
 */
import type { FloorElement, FloorCanvasConfig } from '$lib/types';
import { createStore } from '$lib/stores/create-store.svelte';

const _floorElements = createStore<FloorElement & { gridSize?: number }>('floor_elements', db =>
	db.floor_elements.find()
);

const DEFAULT_CANVAS: FloorCanvasConfig = {
	id: '',
	locationId: '',
	width: 900,
	height: 600,
	gridSize: 20,
	updatedAt: ''
};

export const floorLayout = {
	get initialized() { return _floorElements.initialized; },

	canvasFor(locationId: string): FloorCanvasConfig {
		const cfg = _floorElements.value.find(
			(e: any) => e.type === 'canvas_config' && e.locationId === locationId
		);
		if (!cfg) return { ...DEFAULT_CANVAS, id: locationId, locationId };
		return {
			id: cfg.id,
			locationId: cfg.locationId,
			width: cfg.width,
			height: cfg.height,
			gridSize: (cfg as any).gridSize ?? 20,
			updatedAt: cfg.updatedAt
		};
	},

	elementsFor(locationId: string): FloorElement[] {
		return _floorElements.value.filter(
			(e: any) => e.type !== 'canvas_config' && e.locationId === locationId
		);
	}
};
