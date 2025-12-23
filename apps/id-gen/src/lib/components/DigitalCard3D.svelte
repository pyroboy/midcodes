<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';

	// Enable interactivity for click events
	interactivity();

	// Props
	let {
		frontUrl,
		backUrl,
		stage = 'intro', // 'intro', 'profile', 'expanded'
		onLoad, // Callback when fully loaded
		cardAspectRatio = 1.588, // Card aspect ratio (width/height), default CR80
		sceneScale = 1.0 // Scene scale factor - card is scaled by 1/sceneScale to match 2D size
	} = $props<{
		frontUrl: string;
		backUrl: string;
		stage?: 'intro' | 'profile' | 'expanded';
		onLoad?: () => void;
		cardAspectRatio?: number;
		sceneScale?: number;
	}>();

	// State
	let frontTexture = $state<THREE.Texture | null>(null);
	let backTexture = $state<THREE.Texture | null>(null);

	// Geometries
	let frontGeometry = $state<THREE.BufferGeometry | null>(null);
	let backGeometry = $state<THREE.BufferGeometry | null>(null);
	let edgeGeometry = $state<THREE.BufferGeometry | null>(null);

	// Animation State
	let isFlipped = $state(false);

	// Tweens - for flip animation only
	// Position and scale use immediate values (no animation) to prevent flicker
	const position = tweened<[number, number, number]>([0, 0, 0], {
		duration: 0, // No animation - instant positioning
		easing: cubicOut
	});
	const rotation = tweened<[number, number, number]>([0, 0, 0], {
		duration: 800, // Only rotation animates (for flip)
		easing: cubicOut
	});
	// Scale is NOT tweened - we use a plain state to avoid flicker
	let currentScale = $state(1);

	// Route R2 URLs through proxy to avoid CORS issues
	function getProxiedUrl(url: string): string {
		if (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com')) {
			return `/api/image-proxy?url=${encodeURIComponent(url)}`;
		}
		return url;
	}

	// Camera configuration constants (must match the Camera component)
	const CAMERA_FOV = 45; // degrees
	const CAMERA_DISTANCE = 8; // Z position

	// Constants
	const BASE_SCALE = 3.6;
	
	// Universal padding: 90% fill = 10% padding on each side
	// This must match the CSS padding in the 2D container
	const CARD_FILL_PERCENT = 0.90;

	// Calculate the visible 3D height at camera distance
	function getVisible3DHeight(fovDegrees: number, distance: number): number {
		const fovRadians = (fovDegrees * Math.PI) / 180;
		return 2 * Math.tan(fovRadians / 2) * distance;
	}

	// Calculate optimal 3D scale with scene scaling
	// The 3D card is scaled by 1/sceneScale to match 2D image size in larger canvas
	function calculateOptimalScale(cardWidth3D: number, cardHeight3D: number): number {
		// Calculate visible 3D space based on camera
		const visible3DHeight = getVisible3DHeight(CAMERA_FOV, CAMERA_DISTANCE);
		
		// Container has same aspect ratio as card (using CSS aspect-ratio)
		const visible3DWidth = visible3DHeight * cardAspectRatio;
		
		// Calculate scale needed to fill visible area
		const scaleByHeight = visible3DHeight / cardHeight3D;
		const scaleByWidth = visible3DWidth / cardWidth3D;
		
		// Use the smaller scale to fit entirely (contain behavior)
		// Apply CARD_FILL_PERCENT for padding, then divide by sceneScale
		// This makes the card appear same size as 2D but in larger canvas
		const baseScale = Math.min(scaleByHeight, scaleByWidth) * CARD_FILL_PERCENT;
		return baseScale / sceneScale;
	}

	// Store calculated card dimensions for scale calculation
	let cardDims3D = $state({ width: BASE_SCALE, height: BASE_SCALE / 1.588 });

	// Helper to calculate card dimensions from aspect ratio
	function getCardDimensions(w: number, h: number) {
		const aspect = w / h;
		if (aspect >= 1) {
			return { width: BASE_SCALE, height: BASE_SCALE / aspect };
		} else {
			return { width: BASE_SCALE * aspect, height: BASE_SCALE };
		}
	}

	// Load geometry based on dimensions
	async function updateGeometry(widthProps: number, heightProps: number) {
		const dims = getCardDimensions(widthProps, heightProps);
		cardDims3D = dims; // Store for scale calculation

		// Radius ~4% of min dimension
		const minDim = Math.min(dims.width, dims.height);
		const radius = minDim * 0.04;

		const geometries = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		frontGeometry = geometries.frontGeometry;
		backGeometry = geometries.backGeometry;
		edgeGeometry = geometries.edgeGeometry;
	}

	// Load textures helper
	function loadTexture(url: string): Promise<THREE.Texture> {
		return new Promise((resolve, reject) => {
			const loader = new THREE.TextureLoader();
			loader.crossOrigin = 'anonymous';
			loader.load(
				getProxiedUrl(url),
				(tex) => {
					tex.colorSpace = THREE.SRGBColorSpace;
					resolve(tex);
				},
				undefined,
				reject
			);
		});
	}

	$effect(() => {
		if (stage === 'intro') {
			position.set([0, 0, 0]);
			currentScale = 1.5;
			// Rotation loop handled in useTask
		} else if (stage === 'profile') {
			position.set([0, 0, 0]);
			// Calculate scale to fill container - set immediately, no animation
			const optimalScale = calculateOptimalScale(cardDims3D.width, cardDims3D.height);
			currentScale = optimalScale;
			// Reset rotation to front view (0) or back view (PI) + whatever current flip state is
			const targetY = isFlipped ? Math.PI : 0;
			rotation.set([0, targetY, 0]);
		}
	});

	// Flip handler
	function toggleFlip() {
		isFlipped = !isFlipped;
		const targetY = isFlipped ? Math.PI : 0;
		rotation.set([0, targetY, 0]);
	}

	onMount(async () => {
		try {
			const [f, b] = await Promise.all([loadTexture(frontUrl), loadTexture(backUrl)]);
			frontTexture = f;
			backTexture = b;

			// Use texture dimensions to generate correct geometry
			if (f.image) {
				const w = f.image.width || 1013;
				const h = f.image.height || 638;
				await updateGeometry(w, h);
			} else {
				// Fallback dimensions
				await updateGeometry(1013, 638);
			}

			// Set the correct scale BEFORE notifying parent
			// This ensures there's no flicker when the 3D view becomes visible
			if (stage === 'profile') {
				currentScale = calculateOptimalScale(cardDims3D.width, cardDims3D.height);
			}

			onLoad?.(); // Notify parent that 3D assets are ready
		} catch (e) {
			console.error('Failed to load card textures', e);
			// Fallback geometry
			await updateGeometry(1013, 638);
			
			// Still set correct scale for fallback
			if (stage === 'profile') {
				currentScale = calculateOptimalScale(cardDims3D.width, cardDims3D.height);
			}
			
			onLoad?.(); // Still notify to avoid getting stuck
		}
	});

	let time = $state(0);
	useTask((delta) => {
		if (stage === 'intro') {
			time += delta;
			// Constantly rotate in intro
			// But if we are in profile, we stick to the tweened rotation
		}
	});

	// Material for Edge
	const edgeMaterial = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		roughness: 0.4,
		metalness: 0.1
	});
</script>

<T.Group
	position={$position}
	rotation={stage === 'intro' ? ([0, time * 0.5, 0] as [number, number, number]) : $rotation}
	scale={currentScale}
	onclick={(e: any) => {
		e.stopPropagation();
		toggleFlip();
	}}
>
	{#if frontGeometry && backGeometry && edgeGeometry}
		<!-- Front Face -->
		<T.Mesh geometry={frontGeometry} castShadow receiveShadow>
			<T.MeshStandardMaterial
				map={frontTexture}
				roughness={0.4}
				metalness={0.1}
				side={THREE.FrontSide}
			/>
		</T.Mesh>

		<!-- Back Face -->
		<T.Mesh geometry={backGeometry} castShadow receiveShadow>
			<T.MeshStandardMaterial
				map={backTexture}
				roughness={0.4}
				metalness={0.1}
				side={THREE.FrontSide}
			/>
		</T.Mesh>

		<!-- Edges -->
		<T.Mesh geometry={edgeGeometry} material={edgeMaterial} castShadow receiveShadow />
	{/if}
</T.Group>
