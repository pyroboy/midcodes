<script lang="ts">
	import { T, Canvas, useTask } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js';
	import * as THREE from 'three';
	import { NoToneMapping } from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';
	import { getCardDimensions, lerp } from '$lib/components/card3d/card3d-state.svelte';

	interface Props {
		widthPixels?: number;
		heightPixels?: number;
		sizeName?: string;
		imageUrl?: string | null;
		isPortrait?: boolean;
		showControls?: boolean;
		autoRotate?: boolean;
		height?: string;
	}

	let {
		widthPixels = 1013,
		heightPixels = 638,
		sizeName = '',
		imageUrl = null,
		isPortrait = false,
		showControls = true,
		autoRotate = false,
		height = '200px'
	}: Props = $props();

	// Geometry state
	let frontGeometry = $state<THREE.BufferGeometry | null>(null);
	let backGeometry = $state<THREE.BufferGeometry | null>(null);
	let edgeGeometry = $state<THREE.BufferGeometry | null>(null);

	// Ruler geometry state
	let horizontalRulerGeometry = $state<THREE.BufferGeometry | null>(null);
	let verticalRulerGeometry = $state<THREE.BufferGeometry | null>(null);
	let rulerLabelTextures = $state<
		{
			texture: THREE.CanvasTexture;
			position: [number, number, number];
			isHorizontal: boolean;
			isTotal: boolean;
		}[]
	>([]);

	// Ruler position state for animation (independent of card rotation)
	let currentRulerRotation = $state(0); // 0 = landscape, PI/2 = portrait
	let targetRulerRotation = 0;

	// Texture state - infoTexture needs to be reactive for re-renders
	let texture = $state<THREE.Texture | null>(null);
	let textureLoading = $state(false); // Track loading state to trigger reactivity
	let infoTexture = $state<THREE.CanvasTexture | null>(null);
	let textureLoader: THREE.TextureLoader | null = null;

	// DPI for pixel to inch conversion
	const DPI = 300;

	// Animation state for smooth morphing - using a ref object to avoid reactivity warnings
	// These are mutated in the animation loop, not tracked as reactive dependencies
	const animState = {
		currentWidth: 0,
		currentHeight: 0,
		targetWidth: 0,
		targetHeight: 0,
		baseWidth: 0, // Geometry is built for these dimensions
		baseHeight: 0,
		rotationY: 0,
		rotationZ: 0,
		targetRotationZ: 0,
		textureRotation: 0,
		targetTextureRotation: 0,
		textureScaleX: 1, // Counter-scale X for texture to prevent distortion
		textureScaleY: 1, // Counter-scale Y for texture to prevent distortion
		isAnimating: false,
		isRotating: false,
		prevWidthPixels: 0,
		prevHeightPixels: 0,
		prevIsPortrait: false,
		prevSizeName: '',
		frameCount: 0 // For throttling updates
	};

	// Animation frame ID for cleanup
	let animationFrameId: number | null = null;

	// Reactive state for rendering - these trigger template updates
	let renderRotationY = $state(0);
	let renderRotationZ = $state(0);
	// Scale factors for animation (1 = original geometry size)
	let renderScaleX = $state(1);
	let renderScaleY = $state(1);
	// Texture counter-scale to prevent distortion during size morphing
	let renderTextureScaleX = $state(1);
	let renderTextureScaleY = $state(1);
	// Reactive dimensions for derived values in template
	// Initialized with defaults, actual values set in onMount
	let currentWidth = $state(0);
	let currentHeight = $state(0);

	// OrbitControls reference for programmatic reset
	let orbitControlsRef = $state<OrbitControlsImpl | undefined>(undefined);

	// Cached background canvas for performance
	let cachedBackgroundCanvas: HTMLCanvasElement | null = null;
	let cachedBackgroundSize = { w: 0, h: 0 };

	// Create or get cached background canvas
	function getBackgroundCanvas(width: number, height: number): HTMLCanvasElement {
		// Ensure valid dimensions (at least 1px)
		const safeWidth = Math.max(1, Math.floor(width || 100));
		const safeHeight = Math.max(1, Math.floor(height || 60));

		if (
			cachedBackgroundCanvas &&
			cachedBackgroundSize.w === safeWidth &&
			cachedBackgroundSize.h === safeHeight
		) {
			return cachedBackgroundCanvas;
		}

		console.log(`[3D Preview] Creating background canvas: ${safeWidth}x${safeHeight}`);

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		canvas.width = safeWidth;
		canvas.height = safeHeight;

		// Background gradient
		const gradient = ctx.createLinearGradient(0, 0, safeWidth, safeHeight);
		gradient.addColorStop(0, '#f8fafc');
		gradient.addColorStop(1, '#e2e8f0');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, safeWidth, safeHeight);

		// Subtle pattern (reduced density for performance)
		ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
		ctx.lineWidth = 1;
		for (let i = 0; i < safeWidth; i += 30) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, safeHeight);
			ctx.stroke();
		}
		for (let i = 0; i < safeHeight; i += 30) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(safeWidth, i);
			ctx.stroke();
		}

		// Border - scale proportionally to canvas size for seamless low-res/high-res transition
		const sizeScale = safeWidth / 256; // 256 is base size
		ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
		ctx.lineWidth = 4 * sizeScale;
		const borderOffset = 8 * sizeScale;
		ctx.strokeRect(
			borderOffset,
			borderOffset,
			safeWidth - borderOffset * 2,
			safeHeight - borderOffset * 2
		);

		cachedBackgroundCanvas = canvas;
		cachedBackgroundSize = { w: safeWidth, h: safeHeight };
		return canvas;
	}

	// Create info texture with card details - OPTIMIZED
	// contentRotation: rotation angle in radians for the text content (to counter card rotation)
	// highRes: use higher resolution for final/static rendering
	function createInfoTexture(
		w: number,
		h: number,
		sName: string,
		contentRotation: number = 0,
		highRes: boolean = false
	): THREE.CanvasTexture {
		// Validations to prevent 0x0 canvas errors
		const safeW = Number.isFinite(w) && w > 0 ? w : 100;
		const safeH = Number.isFinite(h) && h > 0 ? h : 60;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		// Use 256 for animation (performance), 512 for final render (quality)
		const baseSize = highRes ? 512 : 256;
		canvas.width = baseSize;
		// Ensure height is at least 1px
		canvas.height = Math.max(1, Math.round(baseSize * (safeH / safeW)));

		// Draw cached background (no gradient/pattern recalculation)
		const bg = getBackgroundCanvas(canvas.width, canvas.height);
		ctx.drawImage(bg, 0, 0);

		// Save context before rotation
		ctx.save();

		// Apply content rotation (to counter the card's rotation)
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(contentRotation);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);

		// Text settings
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		const isInPortrait = Math.abs(contentRotation) > Math.PI / 4;

		// Font size scaling for high-res texture
		// Scale fonts proportionally to canvas size (512/256 = 2x) for seamless low-res to high-res transition
		// This ensures text appears the same visual size on the 3D card, just with higher pixel quality
		const fontScale = highRes ? 2 : 1;

		// Size name
		if (sName) {
			ctx.fillStyle = '#1e293b';
			ctx.font = `bold ${Math.round(18 * fontScale)}px system-ui, -apple-system, sans-serif`;
			ctx.fillText(sName, centerX, centerY - 12 * fontScale);
		}

		// Dimensions
		ctx.fillStyle = '#64748b';
		ctx.font = `${Math.round(12 * fontScale)}px monospace`;
		const displayW = isInPortrait ? safeH : safeW;
		const displayH = isInPortrait ? safeW : safeH;
		ctx.fillText(
			`${Math.round(displayW)} × ${Math.round(displayH)} px`,
			centerX,
			centerY + 10 * fontScale
		);

		// Orientation
		ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
		ctx.font = `${Math.round(10 * fontScale)}px system-ui, -apple-system, sans-serif`;
		ctx.fillText(isInPortrait ? 'PORTRAIT' : 'LANDSCAPE', centerX, centerY + 28 * fontScale);

		ctx.restore();

		const canvasTexture = new THREE.CanvasTexture(canvas);
		canvasTexture.colorSpace = THREE.SRGBColorSpace;
		canvasTexture.needsUpdate = true;

		return canvasTexture;
	}

	// Load geometry for current dimensions
	async function loadGeometry(w: number, h: number) {
		console.log('[3D Preview] loadGeometry called with:', { w, h });
		const dims = getCardDimensions(w, h);
		console.log('[3D Preview] Card dimensions:', dims);
		const radius = Math.min(dims.width, dims.height) * 0.04;
		const cardGeometry = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		console.log('[3D Preview] Geometry created:', {
			frontGeometry: !!cardGeometry.frontGeometry,
			backGeometry: !!cardGeometry.backGeometry,
			edgeGeometry: !!cardGeometry.edgeGeometry
		});
		frontGeometry = cardGeometry.frontGeometry;
		backGeometry = cardGeometry.backGeometry;
		edgeGeometry = cardGeometry.edgeGeometry;

		// Update rulers when geometry changes - USE ROTATION-AWARE version
		// This ensures portrait mode is correctly detected
		updateRulersForRotation(w, h, currentRulerRotation);
	}

	// Create a text label texture with high resolution
	function createLabelTexture(text: string, isTotal: boolean = false): THREE.CanvasTexture {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		// High resolution canvas for crisp text
		const scale = 2; // 2x resolution
		canvas.width = (isTotal ? 200 : 120) * scale;
		canvas.height = (isTotal ? 80 : 60) * scale;

		ctx.scale(scale, scale);

		ctx.fillStyle = 'transparent';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Total labels get a subtle background
		if (isTotal) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
			ctx.roundRect(4, 4, canvas.width / scale - 8, canvas.height / scale - 8, 6);
			ctx.fill();
			ctx.strokeStyle = '#64748b';
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		ctx.fillStyle = isTotal ? '#0f172a' : '#334155';
		ctx.font = isTotal ? 'bold 36px system-ui, sans-serif' : 'bold 28px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, canvas.width / scale / 2, canvas.height / scale / 2);

		const tex = new THREE.CanvasTexture(canvas);
		tex.needsUpdate = true;
		return tex;
	}

	// Create ruler geometry and labels
	function updateRulers(wPixels: number, hPixels: number) {
		const dims = getCardDimensions(wPixels, hPixels);
		const widthInches = wPixels / DPI;
		const heightInches = hPixels / DPI;

		// Scale-aware offsets based on card size
		const cardScale = Math.max(dims.width, dims.height);
		const rulerOffset = cardScale * 0.08;
		const tickLength = cardScale * 0.04;
		const labelOffset = cardScale * 0.12;
		const totalLabelOffset = cardScale * 0.15;

		const halfWidth = dims.width / 2;
		const halfHeight = dims.height / 2;

		// Scale factor: 3D units per inch
		const scaleX = dims.width / widthInches;
		const scaleY = dims.height / heightInches;

		// Clean up old label textures
		rulerLabelTextures.forEach((item) => item.texture.dispose());

		const newLabels: {
			texture: THREE.CanvasTexture;
			position: [number, number, number];
			isHorizontal: boolean;
			isTotal: boolean;
		}[] = [];

		// Format inches with appropriate decimal places
		const formatInches = (val: number) => {
			const formatted = val.toFixed(2).replace(/\.?0+$/, '');
			return formatted + '"';
		};

		// --- Horizontal ruler (top of card) ---
		const hPoints: number[] = [];
		// Main ruler line
		hPoints.push(-halfWidth, halfHeight + rulerOffset, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset, 0.01);

		// Tick marks only (no labels for individual inches)
		const fullInchesW = Math.floor(widthInches);
		for (let i = 0; i <= fullInchesW; i++) {
			const x = -halfWidth + i * scaleX;
			// Full inch tick
			hPoints.push(x, halfHeight + rulerOffset, 0.01);
			hPoints.push(x, halfHeight + rulerOffset + tickLength, 0.01);

			// Half-inch tick (smaller)
			if (i < fullInchesW) {
				const halfX = x + scaleX / 2;
				if (halfX < halfWidth) {
					hPoints.push(halfX, halfHeight + rulerOffset, 0.01);
					hPoints.push(halfX, halfHeight + rulerOffset + tickLength * 0.6, 0.01);
				}
			}
		}

		// End tick at actual width
		hPoints.push(halfWidth, halfHeight + rulerOffset, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset + tickLength, 0.01);

		// Only add total width label (no individual inch labels) - CENTERED
		newLabels.push({
			texture: createLabelTexture(formatInches(widthInches), true),
			position: [0, halfHeight + rulerOffset + totalLabelOffset, 0.01],
			isHorizontal: true,
			isTotal: true
		});

		// End caps
		hPoints.push(-halfWidth, halfHeight + rulerOffset - tickLength * 0.5, 0.01);
		hPoints.push(-halfWidth, halfHeight + rulerOffset + tickLength * 0.5, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset - tickLength * 0.5, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset + tickLength * 0.5, 0.01);

		horizontalRulerGeometry?.dispose();
		horizontalRulerGeometry = new THREE.BufferGeometry();
		horizontalRulerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hPoints, 3));

		// --- Vertical ruler (left of card) ---
		const vPoints: number[] = [];
		// Main ruler line
		vPoints.push(-halfWidth - rulerOffset, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset, halfHeight, 0.01);

		// Tick marks only (no labels for individual inches)
		const fullInchesH = Math.floor(heightInches);
		for (let i = 0; i <= fullInchesH; i++) {
			const y = -halfHeight + i * scaleY;
			// Full inch tick
			vPoints.push(-halfWidth - rulerOffset, y, 0.01);
			vPoints.push(-halfWidth - rulerOffset - tickLength, y, 0.01);

			// Half-inch tick (smaller)
			if (i < fullInchesH) {
				const halfY = y + scaleY / 2;
				if (halfY < halfHeight) {
					vPoints.push(-halfWidth - rulerOffset, halfY, 0.01);
					vPoints.push(-halfWidth - rulerOffset - tickLength * 0.6, halfY, 0.01);
				}
			}
		}

		// End tick at actual height
		vPoints.push(-halfWidth - rulerOffset, halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset - tickLength, halfHeight, 0.01);

		// Only add total height label (no individual inch labels) - CENTERED
		newLabels.push({
			texture: createLabelTexture(formatInches(heightInches), true),
			position: [-halfWidth - rulerOffset - totalLabelOffset, 0, 0.01],
			isHorizontal: false,
			isTotal: true
		});

		// End caps
		vPoints.push(-halfWidth - rulerOffset - tickLength * 0.5, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset + tickLength * 0.5, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset - tickLength * 0.5, halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset + tickLength * 0.5, halfHeight, 0.01);

		verticalRulerGeometry?.dispose();
		verticalRulerGeometry = new THREE.BufferGeometry();
		verticalRulerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vPoints, 3));

		rulerLabelTextures = newLabels;
	}

	// Update rulers with rotation - for animated transitions
	// Rulers stay in fixed positions (top and left) but measurements update based on rotation
	// rotation: 0 = landscape (top=width, left=height), PI/2 = portrait (top=height, left=width)

	// FAST: Update only ruler line geometry (no texture creation)
	function updateRulerGeometry(wPixels: number, hPixels: number, rotation: number) {
		const dims = getCardDimensions(wPixels, hPixels);
		const widthInches = wPixels / DPI;
		const heightInches = hPixels / DPI;

		// Interpolation factor: 0 = landscape, 1 = portrait
		const t = Math.min(1, Math.abs(rotation) / (Math.PI / 2));

		// Interpolate what each ruler measures
		const topMeasureInches = lerp(widthInches, heightInches, t);
		const leftMeasureInches = lerp(heightInches, widthInches, t);

		// The visual dimensions of the rotated card on screen
		const visualWidth = lerp(dims.width, dims.height, t);
		const visualHeight = lerp(dims.height, dims.width, t);

		// Scale-aware offsets based on card size
		const cardScale = Math.max(dims.width, dims.height);
		const rulerOffset = cardScale * 0.08;
		const tickLength = cardScale * 0.04;

		const halfWidth = visualWidth / 2;
		const halfHeight = visualHeight / 2;

		// --- Horizontal ruler geometry ---
		const hPoints: number[] = [];
		hPoints.push(-halfWidth, halfHeight + rulerOffset, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset, 0.01);

		const scaleTop = visualWidth / topMeasureInches;
		const fullInchesTop = Math.floor(topMeasureInches);

		for (let i = 0; i <= fullInchesTop; i++) {
			const x = -halfWidth + i * scaleTop;
			hPoints.push(x, halfHeight + rulerOffset, 0.01);
			hPoints.push(x, halfHeight + rulerOffset + tickLength, 0.01);

			if (i < fullInchesTop) {
				const halfX = x + scaleTop / 2;
				if (halfX < halfWidth) {
					hPoints.push(halfX, halfHeight + rulerOffset, 0.01);
					hPoints.push(halfX, halfHeight + rulerOffset + tickLength * 0.6, 0.01);
				}
			}
		}

		hPoints.push(halfWidth, halfHeight + rulerOffset, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset + tickLength, 0.01);
		hPoints.push(-halfWidth, halfHeight + rulerOffset - tickLength * 0.5, 0.01);
		hPoints.push(-halfWidth, halfHeight + rulerOffset + tickLength * 0.5, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset - tickLength * 0.5, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset + tickLength * 0.5, 0.01);

		horizontalRulerGeometry?.dispose();
		horizontalRulerGeometry = new THREE.BufferGeometry();
		horizontalRulerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hPoints, 3));

		// --- Vertical ruler geometry ---
		const vPoints: number[] = [];
		vPoints.push(-halfWidth - rulerOffset, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset, halfHeight, 0.01);

		const scaleLeft = visualHeight / leftMeasureInches;
		const fullInchesLeft = Math.floor(leftMeasureInches);

		for (let i = 0; i <= fullInchesLeft; i++) {
			const y = -halfHeight + i * scaleLeft;
			vPoints.push(-halfWidth - rulerOffset, y, 0.01);
			vPoints.push(-halfWidth - rulerOffset - tickLength, y, 0.01);

			if (i < fullInchesLeft) {
				const halfY = y + scaleLeft / 2;
				if (halfY < halfHeight) {
					vPoints.push(-halfWidth - rulerOffset, halfY, 0.01);
					vPoints.push(-halfWidth - rulerOffset - tickLength * 0.6, halfY, 0.01);
				}
			}
		}

		vPoints.push(-halfWidth - rulerOffset, halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset - tickLength, halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset - tickLength * 0.5, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset + tickLength * 0.5, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset - tickLength * 0.5, halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset + tickLength * 0.5, halfHeight, 0.01);

		verticalRulerGeometry?.dispose();
		verticalRulerGeometry = new THREE.BufferGeometry();
		verticalRulerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vPoints, 3));
	}

	// SLOW: Update ruler labels (creates textures - expensive)
	function updateRulerLabels(wPixels: number, hPixels: number, rotation: number) {
		const dims = getCardDimensions(wPixels, hPixels);
		const widthInches = wPixels / DPI;
		const heightInches = hPixels / DPI;

		const t = Math.min(1, Math.abs(rotation) / (Math.PI / 2));
		const topMeasureInches = lerp(widthInches, heightInches, t);
		const leftMeasureInches = lerp(heightInches, widthInches, t);
		const visualWidth = lerp(dims.width, dims.height, t);
		const visualHeight = lerp(dims.height, dims.width, t);

		const cardScale = Math.max(dims.width, dims.height);
		const rulerOffset = cardScale * 0.08;
		const labelOffset = cardScale * 0.12;
		const totalLabelOffset = cardScale * 0.15;

		const halfWidth = visualWidth / 2;
		const halfHeight = visualHeight / 2;

		// Clean up old label textures
		rulerLabelTextures.forEach((item) => item.texture.dispose());

		const newLabels: {
			texture: THREE.CanvasTexture;
			position: [number, number, number];
			isHorizontal: boolean;
			isTotal: boolean;
		}[] = [];

		const formatInches = (val: number) => {
			const formatted = val.toFixed(2).replace(/\.?0+$/, '');
			return formatted + '"';
		};

		// Only add total measurement labels (no individual inch markers)
		// Horizontal ruler - total width
		newLabels.push({
			texture: createLabelTexture(formatInches(topMeasureInches), true),
			position: [0, halfHeight + rulerOffset + totalLabelOffset, 0.01],
			isHorizontal: true,
			isTotal: true
		});

		// Vertical ruler - total height
		newLabels.push({
			texture: createLabelTexture(formatInches(leftMeasureInches), true),
			position: [-halfWidth - rulerOffset - totalLabelOffset, 0, 0.01],
			isHorizontal: false,
			isTotal: true
		});

		rulerLabelTextures = newLabels;
	}

	// Combined function for when we need full update (non-animated)
	function updateRulersForRotation(wPixels: number, hPixels: number, rotation: number) {
		updateRulerGeometry(wPixels, hPixels, rotation);
		updateRulerLabels(wPixels, hPixels, rotation);
	}

	// Route R2 URLs through proxy to avoid CORS issues
	function getProxiedUrl(url: string): string {
		if (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com')) {
			return `/api/image-proxy?url=${encodeURIComponent(url)}`;
		}
		return url;
	}

	// Load texture from URL
	function loadTexture(url: string) {
		console.log('[3D Preview] loadTexture called with URL:', url, 'isPortrait:', isPortrait);
		textureLoading = true; // Start loading

		if (!textureLoader) {
			textureLoader = new THREE.TextureLoader();
			textureLoader.crossOrigin = 'anonymous';
		}

		textureLoader.load(
			getProxiedUrl(url),
			(loadedTexture) => {
				console.log('[3D Preview] Texture loaded successfully!', {
					url,
					width: loadedTexture.image?.width,
					height: loadedTexture.image?.height,
					format: loadedTexture.format,
					isPortrait
				});
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

				// Get image dimensions
				const imgWidth = loadedTexture.image?.width || 1;
				const imgHeight = loadedTexture.image?.height || 1;
				const imgAspect = imgWidth / imgHeight;

				// Card geometry aspect ratio (always landscape internally, width > height)
				const cardAspect = widthPixels / heightPixels;

				// When in portrait mode:
				// - The card mesh is rotated 90° clockwise (rotationZ = PI/2)
				// - The texture needs to be counter-rotated to appear upright
				// - AND the aspect ratio needs to match the visual portrait dimensions
				if (isPortrait) {
					// Rotate texture 90° counter-clockwise to compensate for card rotation
					loadedTexture.center.set(0.5, 0.5); // Rotate around center
					loadedTexture.rotation = -Math.PI / 2;

					// In portrait mode, the visual aspect is height/width (inverted)
					// The image should fill the portrait view
					const visualAspect = heightPixels / widthPixels; // Visual card aspect when rotated

					// Adjust repeat to fit the rotated view
					if (imgAspect > visualAspect) {
						// Image is wider than portrait card view - scale down width
						const scale = visualAspect / imgAspect;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					} else {
						// Image is taller than portrait card view - scale down height
						const scale = imgAspect / visualAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					}
					console.log('[3D Preview] Applied PORTRAIT texture transform', {
						rotation: -Math.PI / 2,
						imgAspect,
						visualAspect,
						repeat: loadedTexture.repeat.toArray(),
						offset: loadedTexture.offset.toArray()
					});
				} else {
					// Landscape mode - standard aspect ratio correction
					loadedTexture.rotation = 0;
					loadedTexture.center.set(0.5, 0.5);

					if (imgAspect > cardAspect) {
						// Image is wider than card - crop width
						const scale = cardAspect / imgAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					} else {
						// Image is taller than card - crop height
						const scale = imgAspect / cardAspect;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					}
					console.log('[3D Preview] Applied LANDSCAPE texture transform', {
						imgAspect,
						cardAspect,
						repeat: loadedTexture.repeat.toArray(),
						offset: loadedTexture.offset.toArray()
					});
				}

				loadedTexture.needsUpdate = true;
				texture = loadedTexture;
				textureLoading = false; // Done loading - triggers reactivity!
				console.log(
					'[3D Preview] texture state updated, texture is now:',
					texture ? 'SET' : 'NULL',
					'loading:',
					textureLoading
				);
			},
			(progress) => {
				console.log('[3D Preview] Texture loading progress:', progress);
			},
			(err) => {
				console.error('[ModalCard3DPreview] Texture load error:', err, 'URL was:', url);
				textureLoading = false; // Done loading (with error)
			}
		);
	}

	// Update info texture with current rotation (low-res for animation)
	function updateInfoTexture(rotation: number = animState.textureRotation) {
		if (infoTexture) {
			infoTexture.dispose();
		}
		infoTexture = createInfoTexture(
			animState.currentWidth,
			animState.currentHeight,
			sizeName,
			rotation,
			false
		);
	}

	// Update info texture with high resolution (for final frame after animation)
	function updateInfoTextureHighRes(rotation: number = animState.textureRotation) {
		if (infoTexture) {
			infoTexture.dispose();
		}
		infoTexture = createInfoTexture(
			animState.currentWidth,
			animState.currentHeight,
			sizeName,
			rotation,
			true
		);
	}

	// Animation loop using requestAnimationFrame
	function animate() {
		let needsContinue = false;
		animState.frameCount++;

		// Smooth morph animation for size changes
		if (animState.isAnimating) {
			const lerpFactor = 0.12; // Slightly faster size morphing
			animState.currentWidth = lerp(animState.currentWidth, animState.targetWidth, lerpFactor);
			animState.currentHeight = lerp(animState.currentHeight, animState.targetHeight, lerpFactor);

			// Sync to reactive state for template
			currentWidth = animState.currentWidth;
			currentHeight = animState.currentHeight;

			// Calculate scale factors relative to base geometry
			// This avoids recreating geometry on every frame!
			if (animState.baseWidth > 0 && animState.baseHeight > 0) {
				const baseDims = getCardDimensions(animState.baseWidth, animState.baseHeight);
				const currentDims = getCardDimensions(animState.currentWidth, animState.currentHeight);
				renderScaleX = currentDims.width / baseDims.width;
				renderScaleY = currentDims.height / baseDims.height;

				// Counter-scale texture to prevent distortion during morphing
				// When card scales up, texture UVs need to scale down (and vice versa)
				animState.textureScaleX = 1 / renderScaleX;
				animState.textureScaleY = 1 / renderScaleY;
				renderTextureScaleX = animState.textureScaleX;
				renderTextureScaleY = animState.textureScaleY;
			}

			// Update ruler geometry during size animation for proper sync
			updateRulerGeometry(animState.currentWidth, animState.currentHeight, currentRulerRotation);

			// Throttle label and texture updates during animation
			if (animState.frameCount % 3 === 0) {
				// Update texture with current dimensions to prevent distortion during morphing
				updateInfoTexture(animState.textureRotation);
			}
			// Update ruler labels more frequently for smoother measurement display
			if (animState.frameCount % 2 === 0) {
				updateRulerLabels(animState.currentWidth, animState.currentHeight, currentRulerRotation);
			}

			// Check if animation is complete
			const widthDiff = Math.abs(animState.currentWidth - animState.targetWidth);
			const heightDiff = Math.abs(animState.currentHeight - animState.targetHeight);
			if (widthDiff < 1 && heightDiff < 1) {
				animState.currentWidth = animState.targetWidth;
				animState.currentHeight = animState.targetHeight;
				currentWidth = animState.currentWidth;
				currentHeight = animState.currentHeight;
				animState.isAnimating = false;

				// Only rebuild geometry at animation END
				animState.baseWidth = animState.targetWidth;
				animState.baseHeight = animState.targetHeight;
				renderScaleX = 1;
				renderScaleY = 1;
				// Reset texture counter-scale
				animState.textureScaleX = 1;
				animState.textureScaleY = 1;
				renderTextureScaleX = 1;
				renderTextureScaleY = 1;
				loadGeometry(animState.targetWidth, animState.targetHeight);
				// Final high-resolution texture for crisp static display
				updateInfoTextureHighRes();
				// Final ruler update with exact values
				updateRulersForRotation(
					animState.currentWidth,
					animState.currentHeight,
					currentRulerRotation
				);
			} else {
				needsContinue = true;
			}
		}

		// Smooth rotation animation for orientation changes
		// Fast rotation to complete within ~1 second (0.2 lerp factor = ~15 frames to 99%)
		if (animState.isRotating) {
			const rotLerpFactor = 0.2;
			animState.rotationZ = lerp(animState.rotationZ, animState.targetRotationZ, rotLerpFactor);
			renderRotationZ = animState.rotationZ;

			// Animate texture counter-rotation (opposite direction to keep text upright)
			animState.textureRotation = lerp(
				animState.textureRotation,
				animState.targetTextureRotation,
				rotLerpFactor
			);

			// Animate ruler rotation (they rotate to follow the card edges)
			currentRulerRotation = lerp(currentRulerRotation, targetRulerRotation, rotLerpFactor);

			// Update ruler GEOMETRY every frame for smooth animation (fast operation)
			updateRulerGeometry(animState.currentWidth, animState.currentHeight, currentRulerRotation);

			// Update texture EVERY FRAME for perfect sync with card rotation
			updateInfoTexture(animState.textureRotation);

			// Update ruler labels more frequently for smoother measurement display
			if (animState.frameCount % 2 === 0) {
				updateRulerLabels(animState.currentWidth, animState.currentHeight, currentRulerRotation);
			}

			// Check if rotation is complete
			const rotDiff = Math.abs(animState.rotationZ - animState.targetRotationZ);
			if (rotDiff < 0.01) {
				animState.rotationZ = animState.targetRotationZ;
				renderRotationZ = animState.rotationZ;
				animState.textureRotation = animState.targetTextureRotation;
				currentRulerRotation = targetRulerRotation;
				animState.isRotating = false;
				// Final high-resolution texture for crisp static display
				updateInfoTextureHighRes(animState.textureRotation);
				updateRulersForRotation(
					animState.currentWidth,
					animState.currentHeight,
					currentRulerRotation
				);
			} else {
				needsContinue = true;
			}
		}

		// Auto rotate if enabled
		if (autoRotate) {
			animState.rotationY += 0.005;
			renderRotationY = animState.rotationY;
			needsContinue = true;
		}

		// Continue animation loop if needed
		if (needsContinue) {
			animationFrameId = requestAnimationFrame(animate);
		} else {
			animationFrameId = null;
		}
	}

	// Start animation loop if not running
	function startAnimationLoop() {
		if (animationFrameId === null) {
			animationFrameId = requestAnimationFrame(animate);
		}
	}

	onMount(() => {
		// Validated dimensions
		const validWidth = Number.isFinite(widthPixels) && widthPixels > 0 ? widthPixels : 1013;
		const validHeight = Number.isFinite(heightPixels) && heightPixels > 0 ? heightPixels : 638;

		console.log('[3D Preview] onMount - Props (Validated):', {
			widthPixels,
			heightPixels,
			validWidth,
			validHeight,
			sizeName,
			isPortrait
		});

		// Initialize animation state from props
		animState.currentWidth = validWidth;
		animState.currentHeight = validHeight;
		animState.targetWidth = validWidth;
		animState.targetHeight = validHeight;
		animState.baseWidth = validWidth; // Geometry base size
		animState.baseHeight = validHeight;
		animState.prevWidthPixels = validWidth;
		animState.prevHeightPixels = validHeight;
		animState.prevIsPortrait = isPortrait;
		animState.prevSizeName = sizeName;

		// Apply initial portrait rotation if starting in portrait mode
		// This is critical - without this, the card would start in landscape even if isPortrait=true
		if (isPortrait) {
			animState.rotationZ = Math.PI / 2;
			animState.targetRotationZ = Math.PI / 2;
			animState.textureRotation = Math.PI / 2;
			animState.targetTextureRotation = Math.PI / 2;
			renderRotationZ = Math.PI / 2;
			currentRulerRotation = Math.PI / 2;
			targetRulerRotation = Math.PI / 2;
			console.log('[3D Preview] Initialized with PORTRAIT orientation');
		} else {
			animState.rotationZ = 0;
			animState.targetRotationZ = 0;
			animState.textureRotation = 0;
			animState.targetTextureRotation = 0;
			renderRotationZ = 0;
			currentRulerRotation = 0;
			targetRulerRotation = 0;
			console.log('[3D Preview] Initialized with LANDSCAPE orientation');
		}

		// Sync reactive state (no warning since this is in onMount callback)
		currentWidth = validWidth;
		currentHeight = validHeight;
		console.log('[3D Preview] Initial state:', {
			currentWidth,
			currentHeight,
			renderScaleX,
			renderScaleY,
			isPortrait,
			renderRotationZ
		});

		loadGeometry(validWidth, validHeight);
		// Use high-resolution texture for initial render (crisp first impression)
		updateInfoTextureHighRes(animState.textureRotation);
		if (imageUrl) {
			loadTexture(imageUrl);
		}
	});

	onDestroy(() => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}
		if (texture) {
			texture.dispose();
		}
		if (infoTexture) {
			infoTexture.dispose();
		}
		if (frontGeometry) frontGeometry.dispose();
		if (backGeometry) backGeometry.dispose();
		if (edgeGeometry) edgeGeometry.dispose();
		// Clean up ruler resources
		if (horizontalRulerGeometry) horizontalRulerGeometry.dispose();
		if (verticalRulerGeometry) verticalRulerGeometry.dispose();
		rulerLabelTextures.forEach((item) => item.texture.dispose());
	});

	// Watch for dimension changes and trigger morph animation
	$effect(() => {
		const validW = Number.isFinite(widthPixels) && widthPixels > 0;
		const validH = Number.isFinite(heightPixels) && heightPixels > 0;

		if (
			validW &&
			validH &&
			(widthPixels !== animState.prevWidthPixels || heightPixels !== animState.prevHeightPixels)
		) {
			animState.targetWidth = widthPixels;
			animState.targetHeight = heightPixels;
			animState.isAnimating = true;
			// Don't update prev* immediately here if we want to allow re-triggering? 
			// Actually it's fine as long as we use isAnimating to drive the loop.
			animState.prevWidthPixels = widthPixels;
			animState.prevHeightPixels = heightPixels;
			
			startAnimationLoop();

			// Reset OrbitControls to center when dimensions change
			if (orbitControlsRef) {
				orbitControlsRef.target.set(0, 0, 0);
				orbitControlsRef.update();
			}
		} else if (!validW || !validH) {
			console.warn('[3D Preview] Received invalid dimensions update:', {
				widthPixels,
				heightPixels
			});
		}
	});

	// Watch for orientation changes and trigger rotation animation
	$effect(() => {
		if (isPortrait !== animState.prevIsPortrait) {
			// Rotate card 90 degrees: clockwise for portrait, back to 0 for landscape
			if (isPortrait) {
				animState.targetRotationZ = Math.PI / 2; // 90 degrees clockwise
				animState.targetTextureRotation = Math.PI / 2; // Rotate texture same direction to keep text upright
				targetRulerRotation = Math.PI / 2; // Rulers follow card edges
			} else {
				animState.targetRotationZ = 0; // Back to landscape
				animState.targetTextureRotation = 0; // Texture back to normal
				targetRulerRotation = 0; // Rulers back to landscape position
			}
			animState.isRotating = true;
			animState.prevIsPortrait = isPortrait;
			startAnimationLoop();
		}
	});

	// Watch for sizeName changes
	$effect(() => {
		if (sizeName !== animState.prevSizeName) {
			animState.prevSizeName = sizeName;
			updateInfoTexture(animState.textureRotation);
		}
	});

	// Watch for image URL changes
	let prevImageUrl: string | null = null;
	$effect(() => {
		// Access imageUrl to register the dependency
		const currentUrl = imageUrl;
		console.log(
			'[3D Preview] imageUrl $effect triggered, currentUrl:',
			currentUrl,
			'prevUrl:',
			prevImageUrl
		);

		if (currentUrl !== prevImageUrl) {
			console.log('[3D Preview] URL changed! Disposing old texture and loading new one');
			// Dispose old texture if exists
			if (texture) {
				console.log('[3D Preview] Disposing old texture');
				texture.dispose();
				texture = null;
			}

			// Load new texture if URL provided
			if (currentUrl) {
				console.log('[3D Preview] Calling loadTexture with:', currentUrl);
				loadTexture(currentUrl);
			}

			prevImageUrl = currentUrl;
		} else {
			console.log('[3D Preview] URL unchanged, skipping');
		}
	});

	// Start auto-rotate animation if enabled
	$effect(() => {
		if (autoRotate) {
			startAnimationLoop();
		}
	});

	// Computed dimensions for 3D space
	const cardDimensions = $derived(getCardDimensions(currentWidth, currentHeight));

	// Calculate optimal camera distance to fit card + rulers in both orientations
	// The card can rotate 90°, so we need to fit the larger dimension
	const cameraFOV = 45; // degrees
	const cameraDistance = $derived(() => {
		const dims = getCardDimensions(currentWidth, currentHeight);
		// When rotated 90°, width becomes height and vice versa
		// So we need to fit the maximum of both dimensions
		// Add extra space for rulers (about 0.4 units on each side)
		const rulerSpace = 0.4;
		const maxDimension = Math.max(dims.width, dims.height) + rulerSpace * 2;
		// Add padding factor for comfortable viewing
		const paddingFactor = 1.5;
		// Calculate distance: D = (size/2) / tan(FOV/2)
		const fovRad = (cameraFOV * Math.PI) / 180;
		const distance = (maxDimension * paddingFactor) / (2 * Math.tan(fovRad / 2));
		// Clamp to reasonable range
		return Math.max(2, Math.min(12, distance));
	});
</script>

<div class="modal-3d-preview" style="height: {height};">
	<Canvas toneMapping={NoToneMapping}>
		<!-- Camera with dynamic distance based on card size -->
		<T.PerspectiveCamera makeDefault position={[0, 0, cameraDistance()]} fov={cameraFOV}>
			{#if showControls}
				<OrbitControls
					bind:ref={orbitControlsRef}
					enableZoom={true}
					enablePan={false}
					target={[0, 0, 0]}
					enableDamping={true}
					dampingFactor={0.1}
					minDistance={cameraDistance() * 0.6}
					maxDistance={cameraDistance() * 2}
					maxPolarAngle={Math.PI / 2 + 0.5}
					minPolarAngle={Math.PI / 2 - 0.5}
				/>
			{/if}
		</T.PerspectiveCamera>

		<!-- Subtle ambient lighting -->
		<T.AmbientLight intensity={0.8} />
		<T.DirectionalLight position={[5, 5, 5]} intensity={0.6} />
		<T.DirectionalLight position={[-3, -3, 3]} intensity={0.3} />

		<!-- Card mesh with scale-based animation -->
		{#if frontGeometry && backGeometry && edgeGeometry}
			<T.Group
				rotation.y={renderRotationY}
				rotation.x={-0.1}
				rotation.z={renderRotationZ}
				scale.x={renderScaleX}
				scale.y={renderScaleY}
			>
				<!-- Front face - key block forces re-render when texture changes -->
				{#key texture}
					<T.Mesh geometry={frontGeometry}>
						{#if textureLoading}
							<!-- Show loading state while texture loads -->
							<T.MeshStandardMaterial
								color="#e2e8f0"
								side={THREE.FrontSide}
								metalness={0.05}
								roughness={0.6}
							/>
						{:else if texture}
							<!-- Loaded texture from URL -->
							<T.MeshStandardMaterial
								map={texture}
								side={THREE.FrontSide}
								metalness={0.05}
								roughness={0.6}
							/>
						{:else if infoTexture}
							<!-- Default info texture -->
							<T.MeshStandardMaterial
								map={infoTexture}
								side={THREE.FrontSide}
								metalness={0.05}
								roughness={0.6}
							/>
						{:else}
							<!-- Fallback solid color -->
							<T.MeshStandardMaterial
								color="#f1f5f9"
								side={THREE.FrontSide}
								metalness={0.05}
								roughness={0.6}
							/>
						{/if}
					</T.Mesh>
				{/key}

				<!-- Back face -->
				<T.Mesh geometry={backGeometry}>
					<T.MeshStandardMaterial
						color="#e2e8f0"
						side={THREE.FrontSide}
						metalness={0.05}
						roughness={0.7}
					/>
				</T.Mesh>

				<!-- Edge -->
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial color="#cbd5e1" metalness={0.1} roughness={0.5} />
				</T.Mesh>
			</T.Group>

			<!-- Rulers - OUTSIDE rotating group, fixed to viewport -->
			<!-- Rulers measure the visual top and left of the card as seen on screen -->
			{@const baseScale = Math.max(cardDimensions.width, cardDimensions.height) * 0.12}

			{#if horizontalRulerGeometry}
				<T.LineSegments geometry={horizontalRulerGeometry}>
					<T.LineBasicMaterial color="#94a3b8" linewidth={1} />
				</T.LineSegments>
			{/if}

			{#if verticalRulerGeometry}
				<T.LineSegments geometry={verticalRulerGeometry}>
					<T.LineBasicMaterial color="#94a3b8" linewidth={1} />
				</T.LineSegments>
			{/if}

			<!-- Ruler labels - scaled relative to card size -->
			{#each rulerLabelTextures as label}
				<T.Sprite
					position={label.position}
					scale={label.isTotal
						? [baseScale * 1.6, baseScale * 0.7, 1]
						: [baseScale, baseScale * 0.5, 1]}
				>
					<T.SpriteMaterial map={label.texture} transparent={true} depthTest={false} />
				</T.Sprite>
			{/each}
		{/if}
	</Canvas>
</div>

<style>
	.modal-3d-preview {
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		background: transparent;
	}

	.modal-3d-preview :global(canvas) {
		background: transparent !important;
	}
</style>
