<script lang="ts">
	import { T } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	let { url, width = 3, height = 3 } = $props<{ url: string; width?: number; height?: number }>();

	let texture = $state<THREE.Texture | null>(null);
	let loading = $state(true);
	let error = $state(false);

	onMount(() => {
		const loader = new THREE.TextureLoader();
		loader.crossOrigin = 'anonymous';

		loader.load(
			url,
			(loadedTexture) => {
				loadedTexture.colorSpace = THREE.SRGBColorSpace;
				texture = loadedTexture;
				loading = false;
				console.log('[SimpleTexturePlane] Loaded:', url.substring(0, 50));
			},
			undefined,
			(err) => {
				console.error('[SimpleTexturePlane] Error loading:', url, err);
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
	<T.Mesh>
		<T.PlaneGeometry args={[width, height]} />
		<T.MeshBasicMaterial color="#334155" side={THREE.DoubleSide} />
	</T.Mesh>
{:else if error}
	<T.Mesh>
		<T.PlaneGeometry args={[width, height]} />
		<T.MeshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
	</T.Mesh>
{:else if texture}
	<T.Mesh>
		<T.PlaneGeometry args={[width, height]} />
		<T.MeshBasicMaterial map={texture} side={THREE.DoubleSide} />
	</T.Mesh>
{/if}
