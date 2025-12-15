<script lang="ts">
	import { T, Canvas, useTask } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { createRoundedRectCard } from '$lib/utils/cardGeometry';
	import { getCardDimensions, lerp } from '$lib/components/card3d/card3d-state.svelte';

	interface Props {
		widthPixels?: number;
		heightPixels?: number;
		imageUrl?: string | null;
		backgroundColor?: string;
		showControls?: boolean;
		autoRotate?: boolean;
		height?: string;
	}

	let {
		widthPixels = 1013,
		heightPixels = 638,
		imageUrl = null,
		backgroundColor = '#1a1a2e',
		showControls = true,
		autoRotate = false,
		height = '200px'
	}: Props = $props();

	// Geometry state
	let frontGeometry = $state<THREE.BufferGeometry | null>(null);
	let backGeometry = $state<THREE.BufferGeometry | null>(null);
	let edgeGeometry = $state<THREE.BufferGeometry | null>(null);

	// Texture state
	let texture = $state<THREE.Texture | null>(null);
	let textureLoader: THREE.TextureLoader | null = null;

	// Animation state for smooth morphing
	let currentWidth = $state(widthPixels);
	let currentHeight = $state(heightPixels);
	let targetWidth = $state(widthPixels);
	let targetHeight = $state(heightPixels);
	let rotationY = $state(0);
	let isAnimating = $state(false);

	// Track previous dimensions for morph detection
	let prevWidthPixels = widthPixels;
	let prevHeightPixels = heightPixels;

	// Compute card dimensions in 3D space
	const cardDimensions = $derived(getCardDimensions(currentWidth, currentHeight));

	// Load geometry for current dimensions
	async function loadGeometry(w: number, h: number) {
		const dims = getCardDimensions(w, h);
		const radius = Math.min(dims.width, dims.height) * 0.04;
		const cardGeometry = await createRoundedRectCard(dims.width, dims.height, 0.02, radius);
		frontGeometry = cardGeometry.frontGeometry;
		backGeometry = cardGeometry.backGeometry;
		edgeGeometry = cardGeometry.edgeGeometry;
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

	onMount(() => {
		loadGeometry(widthPixels, heightPixels);
		if (imageUrl) {
			loadTexture(imageUrl);
		}
	});

	onDestroy(() => {
		if (texture) {
			texture.dispose();
		}
		if (frontGeometry) frontGeometry.dispose();
		if (backGeometry) backGeometry.dispose();
		if (edgeGeometry) edgeGeometry.dispose();
	});

	// Watch for dimension changes and trigger morph animation
	$effect(() => {
		if (widthPixels !== prevWidthPixels || heightPixels !== prevHeightPixels) {
			targetWidth = widthPixels;
			targetHeight = heightPixels;
			isAnimating = true;
			prevWidthPixels = widthPixels;
			prevHeightPixels = heightPixels;
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

	// Animation task for smooth morphing
	useTask(() => {
		// Smooth morph animation
		if (isAnimating) {
			const lerpFactor = 0.08;
			currentWidth = lerp(currentWidth, targetWidth, lerpFactor);
			currentHeight = lerp(currentHeight, targetHeight, lerpFactor);

			// Check if animation is complete
			const widthDiff = Math.abs(currentWidth - targetWidth);
			const heightDiff = Math.abs(currentHeight - targetHeight);
			if (widthDiff < 1 && heightDiff < 1) {
				currentWidth = targetWidth;
				currentHeight = targetHeight;
				isAnimating = false;
			}

			// Reload geometry during animation
			loadGeometry(currentWidth, currentHeight);
		}

		// Auto rotate if enabled
		if (autoRotate) {
			rotationY += 0.005;
		}
	});
</script>

<div class="modal-3d-preview" style="height: {height}; background: {backgroundColor};">
	<Canvas>
		<!-- Camera -->
		<T.PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45}>
			{#if showControls}
				<OrbitControls
					enableZoom={true}
					enablePan={false}
					minDistance={2}
					maxDistance={8}
					maxPolarAngle={Math.PI / 2 + 0.5}
					minPolarAngle={Math.PI / 2 - 0.5}
				/>
			{/if}
		</T.PerspectiveCamera>

		<!-- Lighting -->
		<T.AmbientLight intensity={0.6} />
		<T.DirectionalLight position={[5, 5, 5]} intensity={0.8} />
		<T.DirectionalLight position={[-5, -5, -5]} intensity={0.3} />

		<!-- Card mesh -->
		{#if frontGeometry && backGeometry && edgeGeometry}
			<T.Group rotation.y={rotationY} rotation.x={-0.1}>
				<!-- Front face -->
				<T.Mesh geometry={frontGeometry}>
					{#if texture}
						<T.MeshStandardMaterial
							map={texture}
							side={THREE.FrontSide}
							metalness={0.1}
							roughness={0.4}
						/>
					{:else}
						<T.MeshStandardMaterial
							color="#2a2a4a"
							side={THREE.FrontSide}
							metalness={0.1}
							roughness={0.4}
						/>
					{/if}
				</T.Mesh>

				<!-- Back face -->
				<T.Mesh geometry={backGeometry}>
					<T.MeshStandardMaterial
						color="#1e1e3a"
						side={THREE.FrontSide}
						metalness={0.1}
						roughness={0.5}
					/>
				</T.Mesh>

				<!-- Edge -->
				<T.Mesh geometry={edgeGeometry}>
					<T.MeshStandardMaterial color="#3a3a5a" metalness={0.2} roughness={0.3} />
				</T.Mesh>

				<!-- Size label -->
				<T.Mesh position={[0, -cardDimensions.height / 2 - 0.15, 0]}>
					<T.PlaneGeometry args={[1.2, 0.2]} />
					<T.MeshBasicMaterial color="#000000" transparent opacity={0.6} />
				</T.Mesh>
			</T.Group>
		{/if}
	</Canvas>

	<!-- Size indicator overlay -->
	<div class="size-indicator">
		<span class="size-text">{Math.round(currentWidth)} × {Math.round(currentHeight)}px</span>
	</div>
</div>

<style>
	.modal-3d-preview {
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
	}

	.size-indicator {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		padding: 4px 12px;
		border-radius: 20px;
	}

	.size-text {
		font-size: 11px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		font-family: monospace;
	}
</style>
