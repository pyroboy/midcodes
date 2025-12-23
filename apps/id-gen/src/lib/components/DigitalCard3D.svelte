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
		onLoad // Callback when fully loaded
	} = $props<{
		frontUrl: string;
		backUrl: string;
		stage?: 'intro' | 'profile' | 'expanded';
		onLoad?: () => void;
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
	
	// Tweens
	const position = tweened<[number, number, number]>([0, 0, 0], {
		duration: 1500,
		easing: cubicOut
	});
	const rotation = tweened<[number, number, number]>([0, 0, 0], {
		duration: 1200,
		easing: cubicOut
	});
	const scale = tweened(1, { duration: 1500, easing: cubicOut });

	// Route R2 URLs through proxy to avoid CORS issues
	function getProxiedUrl(url: string): string {
		if (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com')) {
			return `/api/image-proxy?url=${encodeURIComponent(url)}`;
		}
		return url;
	}

	// Constants
	const BASE_SCALE = 3.6;

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
			scale.set(1.5);
			// Rotation loop handled in useTask
		} else if (stage === 'profile') {
			position.set([0, 0, 0]);
			scale.set(1.2);
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
			onLoad?.(); // Notify parent that 3D assets are ready
		} catch (e) {
			console.error('Failed to load card textures', e);
			// Fallback geometry
			await updateGeometry(1013, 638);
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
	const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 });
</script>

<T.Group
	position={$position}
	rotation={stage === 'intro' ? ([0, time * 0.5, 0] as [number, number, number]) : $rotation}
	scale={$scale}
	onclick={(e) => {
		e.stopPropagation();
		toggleFlip();
	}}
>
	{#if frontGeometry && backGeometry && edgeGeometry}
		<!-- Front Face -->
		<T.Mesh 
			geometry={frontGeometry} 
			castShadow 
			receiveShadow
		>
			<T.MeshStandardMaterial 
				map={frontTexture} 
				roughness={0.4} 
				metalness={0.1}
				side={THREE.FrontSide}
			/>
		</T.Mesh>

		<!-- Back Face -->
		<T.Mesh 
			geometry={backGeometry} 
			castShadow 
			receiveShadow
		>
			<T.MeshStandardMaterial 
				map={backTexture} 
				roughness={0.4} 
				metalness={0.1} 
				side={THREE.FrontSide}
			/>
		</T.Mesh>

		<!-- Edges -->
		<T.Mesh 
			geometry={edgeGeometry} 
			material={edgeMaterial} 
			castShadow 
			receiveShadow 
		/>
	{/if}
</T.Group>
