<script lang="ts">
	import { T } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	let { url, x, y, width, height } = $props<{
		url: string;
		x: number;
		y: number;
		width: number;
		height: number;
	}>();

	// Texture state
	let texture = $state<THREE.Texture | null>(null);
	let loading = $state(true);
	let error = $state(false);

	// Load texture using THREE.TextureLoader with CORS support
	onMount(() => {
		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';

		loader.load(
			url,
			(loadedTexture) => {
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				texture = loadedTexture;
				loading = false;
				console.log('[DebugTexturePlane] Loaded:', url.substring(0, 50));
			},
			undefined,
			(err) => {
				console.error('[DebugTexturePlane] Error loading:', url, err);
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

{#if loading}
	<T.Mesh position={[x, y, 0]}>
		<T.PlaneGeometry args={[width, height]} />
		<T.MeshBasicMaterial color="#334155" side={THREE.DoubleSide} />
	</T.Mesh>
{:else if error}
	<T.Mesh position={[x, y, 0]}>
		<T.PlaneGeometry args={[width, height]} />
		<T.MeshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
	</T.Mesh>
{:else if texture}
	<T.Mesh position={[x, y, 0]}>
		<T.PlaneGeometry args={[width, height]} />
		<T.MeshBasicMaterial map={texture} side={THREE.DoubleSide} />
	</T.Mesh>
{/if}
