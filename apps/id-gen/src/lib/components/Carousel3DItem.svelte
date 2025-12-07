<script lang="ts">
	import { T } from '@threlte/core';
	import { Text } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	// Props
	let { url, geometry, borderGeometry, transform, onCardClick, card, isDragging } = $props<{
		url: string | null;
		geometry: THREE.BufferGeometry;
		borderGeometry: THREE.BufferGeometry;
		transform: {
			x: number;
			y: number;
			z: number;
			rotY: number;
			rotX?: number;
			scale: number;
			opacity: number;
			distFromCenter: number;
		};
		onCardClick: (card: any) => void;
		card: any;
		isDragging: boolean;
	}>();

	// Constants
	const CARD_ASPECT = 3.6 / 2.4;

	// Texture state
	let texture = $state<THREE.Texture | null>(null);
	let loading = $state(true);
	let error = $state(false);

	// Load texture using THREE.TextureLoader with CORS support
	onMount(() => {
		if (!url) {
			loading = false;
			return;
		}

		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';

		loader.load(
			url,
			(loadedTexture) => {
				// Configure texture
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
				loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

				// Aspect ratio fix
				if (loadedTexture.image?.width && loadedTexture.image?.height) {
					const imageAspect = loadedTexture.image.width / loadedTexture.image.height;
					if (imageAspect > CARD_ASPECT) {
						const scale = CARD_ASPECT / imageAspect;
						loadedTexture.repeat.set(scale, 1);
						loadedTexture.offset.set((1 - scale) / 2, 0);
					} else {
						const scale = imageAspect / CARD_ASPECT;
						loadedTexture.repeat.set(1, scale);
						loadedTexture.offset.set(0, (1 - scale) / 2);
					}
				}
				loadedTexture.needsUpdate = true;

				texture = loadedTexture;
				loading = false;
				console.log('[Carousel3DItem] Loaded:', url?.substring(0, 50));
			},
			undefined,
			(err) => {
				console.error('[Carousel3DItem] Error loading:', url, err);
				error = true;
				loading = false;
			}
		);

		return () => {
			if (texture) {
				texture.dispose();
			}
		};
	});
</script>

<T.Group
	position.x={transform.x}
	position.y={transform.y || 0}
	position.z={transform.z}
	rotation.x={transform.rotX || 0}
	rotation.y={transform.rotY}
	scale={[transform.scale, transform.scale, 1]}
>
	<!-- Card mesh -->
	<T.Mesh onclick={() => !isDragging && onCardClick(card)}>
		{#if loading}
			<T.Mesh {geometry}>
				<T.MeshBasicMaterial
					color="#1e293b"
					side={THREE.DoubleSide}
					transparent
					opacity={transform.opacity * 0.8}
				/>
				<Text
					text="Loading..."
					fontSize={0.25}
					color="white"
					anchorX="center"
					anchorY="middle"
					position.z={0.01}
				/>
			</T.Mesh>
		{:else if error}
			<T.Mesh {geometry}>
				<T.MeshBasicMaterial
					color="#ef4444"
					side={THREE.DoubleSide}
					transparent
					opacity={transform.opacity * 0.8}
				/>
				<Text
					text="Error"
					fontSize={0.25}
					color="white"
					anchorX="center"
					anchorY="middle"
					position.z={0.01}
				/>
			</T.Mesh>
		{:else if texture}
			<T.Mesh {geometry}>
				<T.MeshBasicMaterial
					map={texture}
					side={THREE.DoubleSide}
					transparent={false}
					opacity={1}
				/>
			</T.Mesh>
		{:else}
			<T.Mesh {geometry}>
				<T.MeshBasicMaterial
					color="#1e293b"
					side={THREE.DoubleSide}
					transparent
					opacity={transform.opacity * 0.8}
				/>
			</T.Mesh>
		{/if}
	</T.Mesh>

	<!-- Border glow for center card -->
	{#if transform.distFromCenter < 0.3}
		<T.Mesh position.z={-0.02}>
			<T.Mesh geometry={borderGeometry}>
				<T.MeshBasicMaterial color="#3b82f6" side={THREE.FrontSide} transparent opacity={0.6} />
			</T.Mesh>
		</T.Mesh>
	{/if}
</T.Group>
