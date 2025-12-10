/**
 * Shared types for TemplateCard3D components
 */

import type * as THREE from 'three';

/**
 * Template element overlay for 3D rendering
 * NOTE: Database stores 'font' and 'size', but newer code uses 'fontFamily' and 'fontSize'
 * We support both for backwards compatibility
 */
export interface TemplateElementOverlay {
	id: string;
	type: 'text' | 'image' | 'qr' | 'photo' | 'signature' | 'selection';
	x: number;
	y: number;
	width: number;
	height: number;
	side: 'front' | 'back';
	variableName?: string;
	content?: string;
	// Font styling - support both old (font/size) and new (fontFamily/fontSize) field names
	fontSize?: number;
	size?: number; // Legacy field name
	fontFamily?: string;
	font?: string; // Legacy field name
	fontWeight?: string;
	fontStyle?: string;
	color?: string;
	alignment?: 'left' | 'center' | 'right';
}

/**
 * Showcase image for morphing display
 */
export interface ShowcaseImage {
	image_url: string;
	width_pixels?: number;
	height_pixels?: number;
	orientation?: 'landscape' | 'portrait';
}

/**
 * Cached geometry set for morph shapes
 */
export interface CachedGeometry {
	front: THREE.BufferGeometry;
	back: THREE.BufferGeometry;
	edge: THREE.BufferGeometry;
	dims: { width: number; height: number };
}

/**
 * Morph shape definition (pixel dimensions)
 */
export interface MorphShape {
	w: number;
	h: number;
}

/**
 * Texture load result
 */
export interface TextureLoadResult {
	texture: THREE.Texture | null;
	error: boolean;
}

/**
 * Preload progress callback data
 */
export interface PreloadProgress {
	progress: number;
	loaded: number;
	total: number;
	isReady: boolean;
}

/**
 * Card dimensions in 3D space
 */
export interface CardDimensions {
	width: number;
	height: number;
}

/**
 * 3D position and size for element overlay
 */
export interface Element3DPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}
