/**
 * Session persistence for decompose feature.
 * Saves layer state to localStorage for recovery across page reloads.
 */

import type { DecomposedLayer, LayerSelection } from '$lib/schemas/decompose.schema';
import type { ToolName, ToolOptions } from '$lib/logic/tools';

export interface DecomposeSession {
	assetId: string;
	frontLayers: DecomposedLayer[];
	backLayers: DecomposedLayer[];
	layerSelections: Record<string, LayerSelection>;
	layerOpacity: Record<string, number>;
	/** Mask data for non-destructive editing (Phase 6 eraser support) */
	layerMasks?: Record<string, { layerId: string; maskData: string; bounds: { x: number; y: number; width: number; height: number } }>;
	currentSide: 'front' | 'back';
	showOriginalLayer: boolean;
	/** Active tool state (Phase 2) */
	activeTool?: ToolName;
	/** Tool options like size, opacity, color (Phase 2) */
	toolOptions?: ToolOptions;
	savedAt: string;
}

const STORAGE_KEY = 'decompose-session';

/**
 * Save the current decompose session to localStorage.
 */
export function saveSession(session: DecomposeSession): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch (e) {
		console.error('[decomposeSession] Failed to save session:', e);
	}
}

/**
 * Load a previously saved session for the given asset.
 * Returns null if no session exists or if the session is for a different asset.
 */
export function loadSession(assetId: string): DecomposeSession | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const session = JSON.parse(raw) as DecomposeSession;

		// Only return if this session is for the current asset
		if (session.assetId !== assetId) {
			return null;
		}

		return session;
	} catch (e) {
		console.error('[decomposeSession] Failed to load session:', e);
		return null;
	}
}

/**
 * Clear the saved session.
 */
export function clearSession(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.error('[decomposeSession] Failed to clear session:', e);
	}
}

/**
 * Check if a session exists for the given asset.
 */
export function hasSession(assetId: string): boolean {
	const session = loadSession(assetId);
	return session !== null;
}
