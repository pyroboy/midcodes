<script lang="ts">
	/**
	 * HeroCardGeometry.svelte - Card mesh with normal map support
	 *
	 * Renders the actual 3D card geometry with:
	 * - Front face texture with normal map for emboss effect
	 * - Back face texture
	 * - Edge geometry for thickness
	 * - Support for layer separation (exploded view)
	 */
	import { T } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { createRoundedRectCard, type CardGeometry } from '$lib/utils/cardGeometry';
	import CardTextOverlay from './CardTextOverlay.svelte';
	import HeroCardExplodedLayers from './HeroCardExplodedLayers.svelte';
	import {
		createBaybaninNormalMap,
		createHeroCardTexture,
		createCardBackTexture,
		getCachedTexture,
		disposeCachedTextures
	} from '$lib/marketing/textures/MarketingTextureManager';
	import type { SectionName } from '$lib/marketing/scroll';

	interface Props {
		layerSeparation?: number;
		textureIndex?: number;
		currentSection?: SectionName;
		sectionProgress?: number;
		typingProgress?: number;
	}

	let {
		layerSeparation = 0,
		textureIndex = 0,
		currentSection = 'hero',
		sectionProgress = 0,
		typingProgress = 1
	}: Props = $props();

	// Card dimensions (standard ID card ratio ~1.586) - PORTRAIT
	const CARD_HEIGHT = 2;
	const CARD_WIDTH = CARD_HEIGHT / 1.586;
	const CARD_DEPTH = 0.007;
	const CARD_RADIUS = 0.08;

	// Geometry state
	let cardGeometry: CardGeometry | null = $state(null);
	let isLoaded = $state(false);

	// Textures
	let frontTexture: THREE.Texture | null = $state(null);
	let backTexture: THREE.Texture | null = $state(null);
	let normalMap: THREE.Texture | null = $state(null);

	// Variant textures for use cases section
	let variantTextures: THREE.Texture[] = $state([]);

	// Materials
	let frontMaterial: THREE.MeshStandardMaterial | null = $state(null);
	let backMaterial: THREE.MeshStandardMaterial | null = $state(null);
	let edgeMaterial: THREE.MeshStandardMaterial | null = $state(null);
	let middleLayerMaterial: THREE.MeshStandardMaterial | null = $state(null);

	// Initialize geometry and materials
	onMount(() => {
		async function init() {
			// Create card geometry
			cardGeometry = await createRoundedRectCard(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH, CARD_RADIUS);

			// Create textures with caching
			frontTexture = getCachedTexture('hero-front', () => createHeroCardTexture(640, 1024, 'hero'));
			backTexture = getCachedTexture('card-back', () => createCardBackTexture(640, 1024));
			normalMap = getCachedTexture('baybayin-normal', () => createBaybaninNormalMap(512));

			// Create variant textures for use cases section
			variantTextures = [
				getCachedTexture('variant-hero', () => createHeroCardTexture(640, 1024, 'hero')),
				getCachedTexture('variant-student', () => createHeroCardTexture(640, 1024, 'student')),
				getCachedTexture('variant-dorm', () => createHeroCardTexture(640, 1024, 'dorm')),
				getCachedTexture('variant-event', () => createHeroCardTexture(640, 1024, 'event')),
				// Special texture for segmentation (CEO)
				getCachedTexture('variant-ceo', () => createHeroCardTexture(640, 1024, 'ceo'))
			];

			// Create front material with normal map for emboss effect
			frontMaterial = new THREE.MeshStandardMaterial({
				map: frontTexture,
				normalMap: normalMap,
				normalScale: new THREE.Vector2(0.5, 0.5), // Subtle emboss
				roughness: 0.3,
				metalness: 0.1,
				side: THREE.FrontSide,
				envMapIntensity: 0.5
			});

			// Create back material
			backMaterial = new THREE.MeshStandardMaterial({
				map: backTexture,
				roughness: 0.4,
				metalness: 0.05,
				side: THREE.BackSide
			});

			// Create edge material
			edgeMaterial = new THREE.MeshStandardMaterial({
				color: 0x222222,
				roughness: 0.5,
				metalness: 0.3
			});

			// Middle layer for exploded view (data layer)
			middleLayerMaterial = new THREE.MeshStandardMaterial({
				color: 0x2a2a4a,
				roughness: 0.6,
				metalness: 0.1,
				transparent: true,
				opacity: 0,
				side: THREE.DoubleSide
			});

			isLoaded = true;
		}

		init();

		return () => {
			// Cleanup materials (textures are cached and cleaned up separately)
			frontMaterial?.dispose();
			backMaterial?.dispose();
			edgeMaterial?.dispose();
			middleLayerMaterial?.dispose();
		};
	});

	// Update texture based on textureIndex for use cases section and segmentation
	$effect(() => {
		if (frontMaterial && backMaterial && variantTextures.length > 0) {
			// Segmentation state check (textureIndex = -1)
			if (textureIndex === -1) {
				// Front: Student (index 1)
				frontMaterial.map = variantTextures[1];
				// Back: CEO (index 4 - added above)
				backMaterial.map = variantTextures[4];
			} else {
				// Normal behavior
				const idx = Math.min(textureIndex, variantTextures.length - 1);
				frontMaterial.map = variantTextures[idx];
				// Reset back to standard back
				backMaterial.map = backTexture;
			}

			frontMaterial.needsUpdate = true;
			backMaterial.needsUpdate = true;
		}
	});

	// Update layer separation effects
	$effect(() => {
		if (!frontMaterial || !backMaterial || !middleLayerMaterial) return;

		// Middle layer opacity based on separation
		middleLayerMaterial.opacity = layerSeparation > 0.05 ? Math.min(1, layerSeparation * 2) : 0;

		// Slight transparency on front/back when separated
		if (layerSeparation > 0.1) {
			frontMaterial.transparent = true;
			frontMaterial.opacity = Math.max(0.85, 1 - layerSeparation * 0.2);
			backMaterial.transparent = true;
			backMaterial.opacity = Math.max(0.85, 1 - layerSeparation * 0.2);
		} else {
			frontMaterial.transparent = false;
			frontMaterial.opacity = 1;
			backMaterial.transparent = false;
			backMaterial.opacity = 1;
		}
	});
</script>

{#if isLoaded && cardGeometry && frontMaterial && backMaterial && edgeMaterial && middleLayerMaterial}
	<!-- Front face (separated forward in exploded view) -->
	<!-- Front face (Card Body - Behind layers) -->
	<T.Group position.z={-layerSeparation * 0.2}>
		<T.Mesh geometry={cardGeometry.frontGeometry} material={frontMaterial} />

		<!-- Dynamic Text Overlay (Simultaneous letter-by-letter typing) -->
		<CardTextOverlay {typingProgress} {sectionProgress} {currentSection} />
	</T.Group>

	<!-- 5-Layer Stack (In front of card) -->
	<HeroCardExplodedLayers
		{layerSeparation}
		{middleLayerMaterial}
		cardWidth={CARD_WIDTH}
		cardHeight={CARD_HEIGHT}
	/>

	<!-- Back face (separated backward in exploded view) -->
	<!-- Back face (Furthest back) -->
	<T.Group position.z={-layerSeparation * 0.8}>
		<T.Mesh geometry={cardGeometry.backGeometry} material={backMaterial} />
	</T.Group>

	<!-- Edge (only fully visible when not exploded) -->
	<T.Mesh
		geometry={cardGeometry.edgeGeometry}
		material={edgeMaterial}
		visible={layerSeparation < 0.3}
	/>
{/if}
