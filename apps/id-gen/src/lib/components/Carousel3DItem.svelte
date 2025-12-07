<script lang="ts">
	import { T } from '@threlte/core';
	import { useTexture, Text } from '@threlte/extras';
	import * as THREE from 'three';

	// Props
	let { url, geometry, borderGeometry, transform, onCardClick, card, isDragging } = $props<{
		url: string | null;
		geometry: THREE.BufferGeometry;
		borderGeometry: THREE.BufferGeometry;
		transform: {
			x: number;
			z: number;
			rotY: number;
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

	// Debug: Log when component mounts with URL
	$effect(() => {
		if (url) {
			console.log('[Carousel3DItem] URL passed:', url?.substring(0, 80) + '...');
		}
	});

	// Configure texture after loading
	function configureTexture(t: THREE.Texture): THREE.Texture {
		console.log(
			'[Carousel3DItem] Texture loaded successfully, image size:',
			t.image?.width,
			'x',
			t.image?.height
		);
		t.colorSpace = THREE.SRGBColorSpace;
		t.wrapS = THREE.ClampToEdgeWrapping;
		t.wrapT = THREE.ClampToEdgeWrapping;

		// Aspect ratio fix
		if (t.image?.width && t.image?.height) {
			const imageAspect = t.image.width / t.image.height;
			if (imageAspect > CARD_ASPECT) {
				const scale = CARD_ASPECT / imageAspect;
				t.repeat.set(scale, 1);
				t.offset.set((1 - scale) / 2, 0);
			} else {
				const scale = imageAspect / CARD_ASPECT;
				t.repeat.set(1, scale);
				t.offset.set(0, (1 - scale) / 2);
			}
		}
		t.needsUpdate = true;
		return t;
	}

	// Use useTexture with transform option
	let textureStore = $derived(url ? useTexture(url, { transform: configureTexture }) : null);

	// Debug state
	let debugState = $state('init');
</script>

<T.Group
	position.x={transform.x}
	position.z={transform.z}
	rotation.y={transform.rotY}
	scale={[transform.scale, transform.scale, 1]}
>
	<!-- Card mesh -->
	<T.Mesh onclick={() => !isDragging && onCardClick(card)}>
		<T.Mesh {geometry}>
			{#if textureStore}
				{#await $textureStore}
					<!-- Loading State -->
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
				{:then texture}
					<!-- Success State -->
					{(console.log('[Carousel3DItem] Rendering texture:', texture), '')}
					<T.MeshBasicMaterial
						map={texture}
						side={THREE.DoubleSide}
						transparent={false}
						opacity={1}
					/>
				{:catch err}
					<!-- Error State -->
					{(console.error('[Carousel3DItem] Texture error:', err), '')}
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
				{/await}
			{:else}
				<!-- No URL placeholder -->
				<T.MeshBasicMaterial
					color="#1e293b"
					side={THREE.DoubleSide}
					transparent
					opacity={transform.opacity * 0.8}
				/>
			{/if}
		</T.Mesh>
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
