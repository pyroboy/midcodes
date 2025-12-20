<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';

	// Props
	let {
		frontUrl,
		backUrl,
		stage = 'intro' // 'intro', 'profile', 'expanded'
	} = $props<{
		frontUrl: string;
		backUrl: string;
		stage?: 'intro' | 'profile' | 'expanded';
	}>();

	// Load textures
	let frontTexture = $state<THREE.Texture | null>(null);
	let backTexture = $state<THREE.Texture | null>(null);

	// Position/Rotation/Scale tweens
	const position = tweened<[number, number, number]>([0, 0, 0], {
		duration: 1500,
		easing: cubicOut
	});
	const rotation = tweened<[number, number, number]>([0, 0, 0], {
		duration: 1500,
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
			// Center, spinning slowly handled by useFrame or tween
			position.set([0, 0, 0]);
			scale.set(1.5);
			// Rotation is continuous loop in intro?
		} else if (stage === 'profile') {
			// Move up/left, stop spinning, show front
			position.set([0, 2.5, 0]);
			rotation.set([0, 0, 0]);
			scale.set(1);
		}
	});

	onMount(async () => {
		try {
			const [f, b] = await Promise.all([loadTexture(frontUrl), loadTexture(backUrl)]);
			frontTexture = f;
			backTexture = b;
		} catch (e) {
			console.error('Failed to load card textures', e);
		}
	});

	let time = $state(0);
	useTask((delta) => {
		if (stage === 'intro') {
			time += delta;
		}
	});

	// Material Array for BoxGeometry
	// 0-3 sides (white plastic), 4 front, 5 back
	const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

	let materials = $derived([
		edgeMaterial, // right
		edgeMaterial, // left
		edgeMaterial, // top
		edgeMaterial, // bottom
		frontTexture
			? new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.4, metalness: 0.1 })
			: edgeMaterial, // front
		backTexture
			? new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.4, metalness: 0.1 })
			: edgeMaterial // back
	]);

	// Card dimensions: 3.375 x 2.125 inches (standard ID-1) = ~ 85.6 x 54 mm
	// Aspect ratio ~1.58
	// Let's use 3.2 x 2 units
	const CARD_WIDTH = 3.2;
	const CARD_HEIGHT = 2.0;
	const CARD_THICKNESS = 0.03;
</script>

<T.Group
	position={$position}
	rotation={stage === 'intro' ? ([0, time * 0.5, 0] as [number, number, number]) : $rotation}
	scale={$scale}
>
	<T.Mesh castShadow receiveShadow material={materials}>
		<T.BoxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS]} />
	</T.Mesh>
</T.Group>
