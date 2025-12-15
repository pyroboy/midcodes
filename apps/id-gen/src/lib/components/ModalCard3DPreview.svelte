<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as THREE from 'three';
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
	let rulerLabelTextures = $state<{ texture: THREE.CanvasTexture; position: [number, number, number]; isHorizontal: boolean; isTotal: boolean }[]>([]);

	// Ruler position state for animation (independent of card rotation)
	let currentRulerRotation = $state(0); // 0 = landscape, PI/2 = portrait
	let targetRulerRotation = 0;

	// Texture state - infoTexture needs to be reactive for re-renders
	let texture: THREE.Texture | null = null;
	let infoTexture = $state<THREE.CanvasTexture | null>(null);
	let textureLoader: THREE.TextureLoader | null = null;

	// DPI for pixel to inch conversion
	const DPI = 300;

	// Animation state for smooth morphing
	let currentWidth = widthPixels;
	let currentHeight = heightPixels;
	let targetWidth = widthPixels;
	let targetHeight = heightPixels;

	// Rotation state
	let rotationY = 0;
	let rotationZ = 0;
	let targetRotationZ = 0;

	// Texture rotation state (counter-rotation for text)
	let textureRotation = 0;
	let targetTextureRotation = 0;

	// Animation flags
	let isAnimating = false;
	let isRotating = false;

	// Track previous values for change detection
	let prevWidthPixels = widthPixels;
	let prevHeightPixels = heightPixels;
	let prevIsPortrait = isPortrait;
	let prevSizeName = sizeName;

	// Animation frame ID for cleanup
	let animationFrameId: number | null = null;

	// Reactive state for rendering
	let renderRotationY = $state(0);
	let renderRotationZ = $state(0);

	// Create info texture with card details
	// contentRotation: rotation angle in radians for the text content (to counter card rotation)
	function createInfoTexture(w: number, h: number, sName: string, contentRotation: number = 0): THREE.CanvasTexture {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		// Set canvas size (higher res for crisp text)
		const baseSize = 512;
		canvas.width = baseSize;
		canvas.height = baseSize * (h / w);

		// Background gradient
		const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, '#f8fafc');
		gradient.addColorStop(1, '#e2e8f0');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Add subtle pattern
		ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
		ctx.lineWidth = 1;
		for (let i = 0; i < canvas.width; i += 20) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, canvas.height);
			ctx.stroke();
		}
		for (let i = 0; i < canvas.height; i += 20) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(canvas.width, i);
			ctx.stroke();
		}

		// Border
		ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
		ctx.lineWidth = 4;
		ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

		// Save context before rotation
		ctx.save();

		// Apply content rotation (to counter the card's rotation)
		// Rotate around the center of the canvas
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(contentRotation);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);

		// Text settings - same size regardless of orientation
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		// Determine if we're in portrait based on rotation (close to 90 degrees)
		const isInPortrait = Math.abs(contentRotation) > Math.PI / 4;

		// Size name (main focus - larger font)
		if (sName) {
			ctx.fillStyle = '#1e293b';
			ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
			ctx.fillText(sName, centerX, centerY - 15);
		}

		// Dimensions - show the actual final dimensions (swapped for portrait)
		ctx.fillStyle = '#64748b';
		ctx.font = '14px monospace';
		const displayW = isInPortrait ? h : w;
		const displayH = isInPortrait ? w : h;
		ctx.fillText(`${Math.round(displayW)} × ${Math.round(displayH)} px`, centerX, centerY + 15);

		// Orientation indicator at bottom
		ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
		ctx.font = '11px system-ui, -apple-system, sans-serif';
		ctx.fillText(isInPortrait ? 'PORTRAIT' : 'LANDSCAPE', centerX, centerY + 40);

		// Restore context
		ctx.restore();

		const canvasTexture = new THREE.CanvasTexture(canvas);
		canvasTexture.colorSpace = THREE.SRGBColorSpace;
		canvasTexture.needsUpdate = true;

		return canvasTexture;
	}

	// Load geometry for current dimensions
	async function loadGeometry(w: number, h: number) {
		const dims = getCardDimensions(w, h);
		const radius = Math.min(dims.width, dims.height) * 0.04;
		const cardGeometry = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		frontGeometry = cardGeometry.frontGeometry;
		backGeometry = cardGeometry.backGeometry;
		edgeGeometry = cardGeometry.edgeGeometry;

		// Update rulers when geometry changes
		updateRulers(w, h);
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
			ctx.roundRect(4, 4, (canvas.width / scale) - 8, (canvas.height / scale) - 8, 6);
			ctx.fill();
			ctx.strokeStyle = '#64748b';
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		ctx.fillStyle = isTotal ? '#0f172a' : '#334155';
		ctx.font = isTotal ? 'bold 36px system-ui, sans-serif' : 'bold 28px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, (canvas.width / scale) / 2, (canvas.height / scale) / 2);

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

		const newLabels: { texture: THREE.CanvasTexture; position: [number, number, number]; isHorizontal: boolean; isTotal: boolean }[] = [];

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

		// Tick marks and labels for each inch
		const fullInchesW = Math.floor(widthInches);
		for (let i = 0; i <= fullInchesW; i++) {
			const x = -halfWidth + i * scaleX;
			// Full inch tick
			hPoints.push(x, halfHeight + rulerOffset, 0.01);
			hPoints.push(x, halfHeight + rulerOffset + tickLength, 0.01);

			// Label for full inches (skip 0 and last if close to total)
			if (i > 0 && i < fullInchesW) {
				newLabels.push({
					texture: createLabelTexture(`${i}"`),
					position: [x, halfHeight + rulerOffset + labelOffset, 0.01],
					isHorizontal: true,
					isTotal: false
				});
			}

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

		// Total width label at end (positioned above)
		newLabels.push({
			texture: createLabelTexture(formatInches(widthInches), true),
			position: [halfWidth * 0.3, halfHeight + rulerOffset + totalLabelOffset, 0.01],
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

		// Tick marks and labels for each inch
		const fullInchesH = Math.floor(heightInches);
		for (let i = 0; i <= fullInchesH; i++) {
			const y = -halfHeight + i * scaleY;
			// Full inch tick
			vPoints.push(-halfWidth - rulerOffset, y, 0.01);
			vPoints.push(-halfWidth - rulerOffset - tickLength, y, 0.01);

			// Label for full inches (skip 0 and last if close to total)
			if (i > 0 && i < fullInchesH) {
				newLabels.push({
					texture: createLabelTexture(`${i}"`),
					position: [-halfWidth - rulerOffset - labelOffset, y, 0.01],
					isHorizontal: false,
					isTotal: false
				});
			}

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

		// Total height label (positioned to the left)
		newLabels.push({
			texture: createLabelTexture(formatInches(heightInches), true),
			position: [-halfWidth - rulerOffset - totalLabelOffset, halfHeight * 0.3, 0.01],
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
	function updateRulersForRotation(wPixels: number, hPixels: number, rotation: number) {
		const dims = getCardDimensions(wPixels, hPixels);
		const widthInches = wPixels / DPI;
		const heightInches = hPixels / DPI;

		// Interpolation factor: 0 = landscape, 1 = portrait
		const t = Math.min(1, Math.abs(rotation) / (Math.PI / 2));

		// Interpolate what each ruler measures:
		// - Horizontal (top): width -> height as we rotate
		// - Vertical (left): height -> width as we rotate
		const topMeasureInches = lerp(widthInches, heightInches, t);
		const leftMeasureInches = lerp(heightInches, widthInches, t);

		// The visual dimensions of the rotated card on screen
		// When rotated 90°, width and height swap visually
		const visualWidth = lerp(dims.width, dims.height, t);
		const visualHeight = lerp(dims.height, dims.width, t);

		// Scale-aware offsets based on card size
		const cardScale = Math.max(dims.width, dims.height);
		const rulerOffset = cardScale * 0.08;
		const tickLength = cardScale * 0.04;
		const labelOffset = cardScale * 0.12;
		const totalLabelOffset = cardScale * 0.15;

		const halfWidth = visualWidth / 2;
		const halfHeight = visualHeight / 2;

		// Clean up old label textures
		rulerLabelTextures.forEach((item) => item.texture.dispose());

		const newLabels: { texture: THREE.CanvasTexture; position: [number, number, number]; isHorizontal: boolean; isTotal: boolean }[] = [];

		// Format inches with appropriate decimal places
		const formatInches = (val: number) => {
			const formatted = val.toFixed(2).replace(/\.?0+$/, '');
			return formatted + '"';
		};

		// --- Horizontal ruler (top of card) - measures topMeasureInches ---
		const hPoints: number[] = [];
		// Main ruler line
		hPoints.push(-halfWidth, halfHeight + rulerOffset, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset, 0.01);

		// Scale factor for this ruler
		const scaleTop = visualWidth / topMeasureInches;
		const fullInchesTop = Math.floor(topMeasureInches);

		// Tick marks and labels for each inch
		for (let i = 0; i <= fullInchesTop; i++) {
			const x = -halfWidth + i * scaleTop;
			// Full inch tick
			hPoints.push(x, halfHeight + rulerOffset, 0.01);
			hPoints.push(x, halfHeight + rulerOffset + tickLength, 0.01);

			// Label for full inches (skip 0 and last if close to total)
			if (i > 0 && i < fullInchesTop) {
				newLabels.push({
					texture: createLabelTexture(`${i}"`),
					position: [x, halfHeight + rulerOffset + labelOffset, 0.01],
					isHorizontal: true,
					isTotal: false
				});
			}

			// Half-inch tick (smaller)
			if (i < fullInchesTop) {
				const halfX = x + scaleTop / 2;
				if (halfX < halfWidth) {
					hPoints.push(halfX, halfHeight + rulerOffset, 0.01);
					hPoints.push(halfX, halfHeight + rulerOffset + tickLength * 0.6, 0.01);
				}
			}
		}

		// End tick at actual measurement
		hPoints.push(halfWidth, halfHeight + rulerOffset, 0.01);
		hPoints.push(halfWidth, halfHeight + rulerOffset + tickLength, 0.01);

		// Total measurement label at center-top
		newLabels.push({
			texture: createLabelTexture(formatInches(topMeasureInches), true),
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

		// --- Vertical ruler (left of card) - measures leftMeasureInches ---
		const vPoints: number[] = [];
		// Main ruler line
		vPoints.push(-halfWidth - rulerOffset, -halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset, halfHeight, 0.01);

		// Scale factor for this ruler
		const scaleLeft = visualHeight / leftMeasureInches;
		const fullInchesLeft = Math.floor(leftMeasureInches);

		// Tick marks and labels for each inch
		for (let i = 0; i <= fullInchesLeft; i++) {
			const y = -halfHeight + i * scaleLeft;
			// Full inch tick
			vPoints.push(-halfWidth - rulerOffset, y, 0.01);
			vPoints.push(-halfWidth - rulerOffset - tickLength, y, 0.01);

			// Label for full inches (skip 0 and last if close to total)
			if (i > 0 && i < fullInchesLeft) {
				newLabels.push({
					texture: createLabelTexture(`${i}"`),
					position: [-halfWidth - rulerOffset - labelOffset, y, 0.01],
					isHorizontal: false,
					isTotal: false
				});
			}

			// Half-inch tick (smaller)
			if (i < fullInchesLeft) {
				const halfY = y + scaleLeft / 2;
				if (halfY < halfHeight) {
					vPoints.push(-halfWidth - rulerOffset, halfY, 0.01);
					vPoints.push(-halfWidth - rulerOffset - tickLength * 0.6, halfY, 0.01);
				}
			}
		}

		// End tick at actual measurement
		vPoints.push(-halfWidth - rulerOffset, halfHeight, 0.01);
		vPoints.push(-halfWidth - rulerOffset - tickLength, halfHeight, 0.01);

		// Total measurement label at center-left
		newLabels.push({
			texture: createLabelTexture(formatInches(leftMeasureInches), true),
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

	// Load texture from URL
	function loadTexture(url: string) {
		if (!textureLoader) {
			textureLoader = new THREE.TextureLoader();
			textureLoader.crossOrigin = 'anonymous';
		}

		textureLoader.load(
			url,
			(loadedTexture) => {
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
				loadedTexture.needsUpdate = true;
				texture = loadedTexture;
			},
			undefined,
			(err) => {
				console.error('[ModalCard3DPreview] Texture load error:', err);
			}
		);
	}

	// Update info texture with current rotation
	function updateInfoTexture(rotation: number = textureRotation) {
		if (infoTexture) {
			infoTexture.dispose();
		}
		infoTexture = createInfoTexture(currentWidth, currentHeight, sizeName, rotation);
	}

	// Animation loop using requestAnimationFrame
	function animate() {
		let needsContinue = false;

		// Smooth morph animation for size changes
		if (isAnimating) {
			const lerpFactor = 0.1;
			currentWidth = lerp(currentWidth, targetWidth, lerpFactor);
			currentHeight = lerp(currentHeight, targetHeight, lerpFactor);

			// Check if animation is complete
			const widthDiff = Math.abs(currentWidth - targetWidth);
			const heightDiff = Math.abs(currentHeight - targetHeight);
			if (widthDiff < 1 && heightDiff < 1) {
				currentWidth = targetWidth;
				currentHeight = targetHeight;
				isAnimating = false;
				updateInfoTexture();
			} else {
				needsContinue = true;
			}

			// Reload geometry during animation
			loadGeometry(currentWidth, currentHeight);
		}

		// Smooth rotation animation for orientation changes
		if (isRotating) {
			const rotLerpFactor = 0.12;
			rotationZ = lerp(rotationZ, targetRotationZ, rotLerpFactor);
			renderRotationZ = rotationZ;

			// Animate texture counter-rotation (opposite direction to keep text upright)
			textureRotation = lerp(textureRotation, targetTextureRotation, rotLerpFactor);
			// Update texture with current rotation angle
			updateInfoTexture(textureRotation);

			// Animate ruler rotation (they rotate to follow the card edges)
			currentRulerRotation = lerp(currentRulerRotation, targetRulerRotation, rotLerpFactor);
			// Update rulers with interpolated rotation
			updateRulersForRotation(currentWidth, currentHeight, currentRulerRotation);

			// Check if rotation is complete
			const rotDiff = Math.abs(rotationZ - targetRotationZ);
			if (rotDiff < 0.01) {
				rotationZ = targetRotationZ;
				renderRotationZ = rotationZ;
				textureRotation = targetTextureRotation;
				currentRulerRotation = targetRulerRotation;
				isRotating = false;
				// Final texture update with exact rotation
				updateInfoTexture(textureRotation);
				updateRulersForRotation(currentWidth, currentHeight, currentRulerRotation);
			} else {
				needsContinue = true;
			}
		}

		// Auto rotate if enabled
		if (autoRotate) {
			rotationY += 0.005;
			renderRotationY = rotationY;
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
		loadGeometry(widthPixels, heightPixels);
		updateInfoTexture();
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
		if (widthPixels !== prevWidthPixels || heightPixels !== prevHeightPixels) {
			targetWidth = widthPixels;
			targetHeight = heightPixels;
			isAnimating = true;
			prevWidthPixels = widthPixels;
			prevHeightPixels = heightPixels;
			startAnimationLoop();
		}
	});

	// Watch for orientation changes and trigger rotation animation
	$effect(() => {
		if (isPortrait !== prevIsPortrait) {
			// Rotate card 90 degrees: clockwise for portrait, back to 0 for landscape
			if (isPortrait) {
				targetRotationZ = Math.PI / 2; // 90 degrees clockwise
				targetTextureRotation = Math.PI / 2; // Rotate texture same direction to keep text upright
				targetRulerRotation = Math.PI / 2; // Rulers follow card edges
			} else {
				targetRotationZ = 0; // Back to landscape
				targetTextureRotation = 0; // Texture back to normal
				targetRulerRotation = 0; // Rulers back to landscape position
			}
			isRotating = true;
			prevIsPortrait = isPortrait;
			startAnimationLoop();
		}
	});

	// Watch for sizeName changes
	$effect(() => {
		if (sizeName !== prevSizeName) {
			prevSizeName = sizeName;
			updateInfoTexture(textureRotation);
		}
	});

	// Watch for image URL changes
	$effect(() => {
		if (imageUrl) {
			loadTexture(imageUrl);
		} else if (texture) {
			texture.dispose();
			texture = null;
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
	<Canvas>
		<!-- Camera with dynamic distance based on card size -->
		<T.PerspectiveCamera makeDefault position={[0, 0, cameraDistance()]} fov={cameraFOV}>
			{#if showControls}
				<OrbitControls
					enableZoom={true}
					enablePan={false}
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

		<!-- Card mesh -->
		{#if frontGeometry && backGeometry && edgeGeometry}
			<T.Group rotation.y={renderRotationY} rotation.x={-0.1} rotation.z={renderRotationZ}>
				<!-- Front face -->
				<T.Mesh geometry={frontGeometry}>
					{#if texture}
						<T.MeshStandardMaterial
							map={texture}
							side={THREE.FrontSide}
							metalness={0.05}
							roughness={0.6}
						/>
					{:else if infoTexture}
						<T.MeshStandardMaterial
							map={infoTexture}
							side={THREE.FrontSide}
							metalness={0.05}
							roughness={0.6}
						/>
					{:else}
						<T.MeshStandardMaterial
							color="#f1f5f9"
							side={THREE.FrontSide}
							metalness={0.05}
							roughness={0.6}
						/>
					{/if}
				</T.Mesh>

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
					scale={label.isTotal ? [baseScale * 1.6, baseScale * 0.7, 1] : [baseScale, baseScale * 0.5, 1]}
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
