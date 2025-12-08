<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { Text } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';

	interface Props {
		imageUrl?: string | null;
		backImageUrl?: string | null;
		rotating?: boolean;
		widthPixels?: number;
		heightPixels?: number;
		templateId?: string | null;
	}

	let {
		imageUrl = null,
		backImageUrl = null,
		rotating = true,
		widthPixels = 1013,
		heightPixels = 638,
		templateId = null
	}: Props = $props();

	// Base scale for 3D units
	const BASE_SCALE = 3.6;

	// Geometry state - includes front, back, and edge for full 3D card
	let frontGeometry = $state<THREE.BufferGeometry | null>(null);
	let backGeometry = $state<THREE.BufferGeometry | null>(null);
	let edgeGeometry = $state<THREE.BufferGeometry | null>(null);

	// Texture state - front and back
	let texture = $state<THREE.Texture | null>(null);
	let backTexture = $state<THREE.Texture | null>(null);
	let loading = $state(false);
	let error = $state(false);

	// Rotation state
	let rotationY = $state(0);
	let spinAnimation = $state(false);
	let spinTarget = $state(0);
	let finalAngle = $state(0); // Target angle after spin
	const ROTATION_SPEED = 0.004;
	const SPIN_SPEED = 0.6; // Super fast spin!
	const TILT_X = -0.12;
	
	// Front-facing tolerance: random angle within ±30 degrees (π/6 radians)
	const FRONT_FACING_TOLERANCE = Math.PI / 6; // 30 degrees

	// Morphing animation state for empty card
	let morphTime = $state(0);
	const MORPH_SPEED = 0.02;
	// Morphing sizes: landscape, portrait, square, bigger square
	const MORPH_SIZES = [
		{ w: 1013, h: 638 },   // Landscape (CR80)
		{ w: 638, h: 1013 },   // Portrait
		{ w: 800, h: 800 },    // Square
		{ w: 1200, h: 900 }    // Bigger landscape
	];

	// Track previous values
	let prevTemplateId: string | null = null;
	let prevImageUrl: string | null = null;
	let prevBackImageUrl: string | null = null;
	let prevWidthPixels = widthPixels;
	let prevHeightPixels = heightPixels;

	// Texture loader instance
	const textureLoader = new THREE.TextureLoader();
	textureLoader.crossOrigin = 'anonymous';

	// Calculate card dimensions
	function getCardDimensions(w: number, h: number) {
		const aspect = w / h;
		if (aspect >= 1) {
			return { width: BASE_SCALE, height: BASE_SCALE / aspect };
		} else {
			return { width: BASE_SCALE * aspect, height: BASE_SCALE };
		}
	}

	// Load geometry with front, back, and edge for full 3D effect
	async function loadGeometry(w: number, h: number) {
		const dims = getCardDimensions(w, h);
		const radius = Math.min(dims.width, dims.height) * 0.04;
		// Card thickness - thin like a real ID card
		const cardGeometry = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		frontGeometry = cardGeometry.frontGeometry;
		backGeometry = cardGeometry.backGeometry;
		edgeGeometry = cardGeometry.edgeGeometry;
	}

	// Lerp helper for smooth interpolation
	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}

	// Get interpolated morph dimensions
	function getMorphDimensions(time: number): { w: number; h: number } {
		const cycleLength = MORPH_SIZES.length;
		const progress = time % cycleLength;
		const currentIndex = Math.floor(progress);
		const nextIndex = (currentIndex + 1) % cycleLength;
		const t = progress - currentIndex;
		
		// Smooth easing
		const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
		
		const current = MORPH_SIZES[currentIndex];
		const next = MORPH_SIZES[nextIndex];
		
		return {
			w: lerp(current.w, next.w, easeT),
			h: lerp(current.h, next.h, easeT)
		};
	}

	// Load texture
	function loadTexture(url: string, aspect: number) {
		loading = true;
		error = false;

		// Dispose old texture
		if (texture) {
			texture.dispose();
			texture = null;
		}

		console.log('[TemplateCard3D] Loading front:', url);

		textureLoader.load(
			url,
			(loadedTexture) => {
				// Configure texture
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

				// Aspect ratio correction
				if (loadedTexture.image?.width && loadedTexture.image?.height) {
					const imageAspect = loadedTexture.image.width / loadedTexture.image.height;
					if (imageAspect > aspect) {
						const scale = aspect / imageAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					} else {
						const scale = imageAspect / aspect;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					}
				}
				loadedTexture.needsUpdate = true;

				texture = loadedTexture;
				loading = false;
				console.log('[TemplateCard3D] Front loaded successfully');
			},
			undefined,
			(err) => {
				console.error('[TemplateCard3D] Front error:', err);
				error = true;
				loading = false;
			}
		);
	}

	// Load back texture
	function loadBackTexture(url: string, aspect: number) {
		// Dispose old back texture
		if (backTexture) {
			backTexture.dispose();
			backTexture = null;
		}

		console.log('[TemplateCard3D] Loading back:', url);

		textureLoader.load(
			url,
			(loadedTexture) => {
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

				// Aspect ratio correction
				if (loadedTexture.image?.width && loadedTexture.image?.height) {
					const imageAspect = loadedTexture.image.width / loadedTexture.image.height;
					if (imageAspect > aspect) {
						const scale = aspect / imageAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					} else {
						const scale = imageAspect / aspect;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					}
				}
				loadedTexture.needsUpdate = true;
				backTexture = loadedTexture;
				console.log('[TemplateCard3D] Back loaded successfully');
			},
			undefined,
			(err) => {
				console.error('[TemplateCard3D] Back error:', err);
			}
		);
	}

	// Initial load
	onMount(() => {
		loadGeometry(widthPixels, heightPixels);
		if (imageUrl) {
			loadTexture(imageUrl, widthPixels / heightPixels);
		}
		if (backImageUrl) {
			loadBackTexture(backImageUrl, widthPixels / heightPixels);
		}
		prevImageUrl = imageUrl;
		prevBackImageUrl = backImageUrl;
		prevTemplateId = templateId;
		prevWidthPixels = widthPixels;
		prevHeightPixels = heightPixels;
	});

	// Cleanup
	onDestroy(() => {
		if (texture) {
			texture.dispose();
		}
		if (backTexture) {
			backTexture.dispose();
		}
	});

	// Track last morph dimensions for change detection
	let lastMorphW = 0;
	let lastMorphH = 0;

	// Animation loop
	useTask(() => {
		// Check for template change - trigger fast spin with random front-facing end angle
		if (templateId !== prevTemplateId && prevTemplateId !== null) {
			spinAnimation = true;
			// Generate random angle within ±30° of front-facing (0°)
			const randomOffset = (Math.random() - 0.5) * 2 * FRONT_FACING_TOLERANCE;
			// Do at least 1 full rotation (2π) plus the random offset for dramatic effect
			const fullSpins = Math.PI * 2; // One full rotation
			finalAngle = randomOffset; // End near front-facing with random offset
			spinTarget = rotationY + fullSpins + Math.PI; // Spin fast then stop
		}

		if (widthPixels !== prevWidthPixels || heightPixels !== prevHeightPixels) {
			loadGeometry(widthPixels, heightPixels);
			prevWidthPixels = widthPixels;
			prevHeightPixels = heightPixels;
		}

		if (imageUrl !== prevImageUrl) {
			if (imageUrl) {
				loadTexture(imageUrl, widthPixels / heightPixels);
				// Also update geometry to match template dimensions
				loadGeometry(widthPixels, heightPixels);
			} else {
				if (texture) {
					texture.dispose();
					texture = null;
				}
				loading = false;
				error = false;
			}
			prevImageUrl = imageUrl;
		}

		// Handle back image URL changes
		if (backImageUrl !== prevBackImageUrl) {
			if (backImageUrl) {
				loadBackTexture(backImageUrl, widthPixels / heightPixels);
			} else {
				if (backTexture) {
					backTexture.dispose();
					backTexture = null;
				}
			}
			prevBackImageUrl = backImageUrl;
		}

		prevTemplateId = templateId;

		// Rotation animation
		if (spinAnimation) {
			rotationY += SPIN_SPEED;
			if (rotationY >= spinTarget) {
				// Snap to the final front-facing angle with random offset
				rotationY = finalAngle;
				spinAnimation = false;
			}
		} else if (rotating) {
			// Continue slow rotation always (after fast spin or when idle)
			rotationY += ROTATION_SPEED;
		}

		// Morphing animation for empty state ONLY (no template selected)
		if (!imageUrl && !loading && !error && !spinAnimation) {
			morphTime += MORPH_SPEED;
			const morphDims = getMorphDimensions(morphTime);
			
			// Only reload geometry when dimensions change significantly
			if (Math.abs(morphDims.w - lastMorphW) > 5 || Math.abs(morphDims.h - lastMorphH) > 5) {
				loadGeometry(morphDims.w, morphDims.h);
				lastMorphW = morphDims.w;
				lastMorphH = morphDims.h;
			}
		}
	});
</script>

{#if frontGeometry}
	<T.Group rotation.x={TILT_X} rotation.y={rotationY}>
		{#if loading}
			<T.Mesh geometry={frontGeometry}>
				<T.MeshStandardMaterial color="#1e293b" side={THREE.FrontSide} transparent opacity={0.9} />
			</T.Mesh>
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial color="#0f172a" side={THREE.DoubleSide} metalness={0.3} roughness={0.7} />
				</T.Mesh>
			{/if}
			<Text
				text="Loading..."
				fontSize={0.22}
				color="white"
				anchorX="center"
				anchorY="middle"
				position.z={0.06}
			/>
		{:else if error}
			<T.Mesh geometry={frontGeometry}>
				<T.MeshStandardMaterial color="#ef4444" side={THREE.FrontSide} transparent opacity={0.9} />
			</T.Mesh>
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial color="#b91c1c" side={THREE.DoubleSide} metalness={0.3} roughness={0.7} />
				</T.Mesh>
			{/if}
			<Text
				text="Error"
				fontSize={0.22}
				color="white"
				anchorX="center"
				anchorY="middle"
				position.z={0.06}
			/>
		{:else if texture}
			<T.Mesh geometry={frontGeometry}>
				<T.MeshStandardMaterial
					map={texture}
					side={THREE.FrontSide}
					transparent={false}
					opacity={1}
					metalness={0.1}
					roughness={0.8}
				/>
			</T.Mesh>
			{#if backGeometry}
				<T.Mesh geometry={backGeometry}>
					{#if backTexture}
						<T.MeshStandardMaterial
							map={backTexture}
							side={THREE.BackSide}
							transparent={false}
							opacity={1}
							metalness={0.1}
							roughness={0.8}
						/>
					{:else}
						<T.MeshStandardMaterial color="#94a3b8" side={THREE.BackSide} metalness={0.1} roughness={0.8} />
					{/if}
				</T.Mesh>
			{/if}
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} metalness={0.4} roughness={0.6} />
				</T.Mesh>
			{/if}
		{:else}
			<!-- Morphing empty card with ID GEN branding -->
			<T.Mesh geometry={frontGeometry}>
				<T.MeshStandardMaterial color="#1e293b" side={THREE.FrontSide} metalness={0.2} roughness={0.7} />
			</T.Mesh>
			{#if backGeometry}
				<T.Mesh geometry={backGeometry}>
					<T.MeshStandardMaterial color="#0f172a" side={THREE.BackSide} metalness={0.2} roughness={0.7} />
				</T.Mesh>
			{/if}
			{#if edgeGeometry}
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial color="#374151" side={THREE.DoubleSide} metalness={0.4} roughness={0.6} />
				</T.Mesh>
			{/if}
			<!-- Front face text: ID GEN -->
			<Text
				text="ID GEN"
				fontSize={0.35}
				color="#60a5fa"
				anchorX="center"
				anchorY="middle"
				position.z={0.06}
				fontWeight="bold"
			/>
			<!-- Back face text -->
			<Text
				text="ID GEN"
				fontSize={0.25}
				color="#94a3b8"
				anchorX="center"
				anchorY="middle"
				position.z={-0.06}
				rotation.y={Math.PI}
			/>
		{/if}
	</T.Group>
{/if}
