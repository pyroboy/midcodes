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
		createKaLogoTexture,
		createQRCodeTexture,
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
		highlightLayer?: number;
	}

	let {
		layerSeparation = 0,
		textureIndex = 0,
		currentSection = 'hero',
		sectionProgress = 0,
		typingProgress = 1,
		highlightLayer = 0
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
	let kaLogoTexture: THREE.Texture | null = $state(null);
	let qrCodeTexture: THREE.Texture | null = $state(null);

	// Variant textures for use cases section
	let variantTextures: THREE.Texture[] = $state([]);

	// Materials
	let frontMaterial: THREE.MeshPhysicalMaterial | null = $state(null);
	let backMaterial: THREE.MeshPhysicalMaterial | null = $state(null);
	let edgeMaterial: THREE.MeshPhysicalMaterial | null = $state(null);
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

			// Logo for exploded layers
			kaLogoTexture = getCachedTexture('ka-logo', () => createKaLogoTexture(128));

			// QR code for card (visible in all sections)
			qrCodeTexture = getCachedTexture('qr-code', () => createQRCodeTexture('https://kanaya.app', 256));

			// Initial variant textures (fill with hero first to avoid blocking)
			// This prevents ~500ms of synchronous canvas operations on mount
			const sharedHeroTexture = getCachedTexture('variant-hero', () =>
				createHeroCardTexture(640, 1024, 'hero')
			);

			variantTextures = [
				sharedHeroTexture, // hero (index 0)
				sharedHeroTexture, // student placeholder (index 1)
				sharedHeroTexture, // dorm placeholder (index 2)
				sharedHeroTexture, // event placeholder (index 3)
				sharedHeroTexture // ceo placeholder (index 4)
			];

			// Lazy load the rest when idle
			if (typeof requestIdleCallback !== 'undefined') {
				requestIdleCallback(() => loadVariants(), { timeout: 2000 });
			} else {
				setTimeout(loadVariants, 1000);
			}

			function loadVariants() {
				// Generate textures one by one to yield to main thread
				const variants: ['student', 'dorm', 'event', 'ceo'] = ['student', 'dorm', 'event', 'ceo'];
				let idx = 0;

				function next() {
					if (idx >= variants.length) return;
					const type = variants[idx];
					// Map type to index in variantTextures array: student=1, dorm=2, event=3, ceo=4
					const arrayIdx = idx + 1;

					// Generate texture
					const tex = getCachedTexture(`variant-${type}`, () =>
						createHeroCardTexture(640, 1024, type)
					);

					// Update array assignment (Svelte 5 state proxy handles reactivity)
					variantTextures[arrayIdx] = tex;

					// Force update material if this texture is currently active
					if (textureIndex === arrayIdx && frontMaterial) {
						frontMaterial.map = tex;
						frontMaterial.needsUpdate = true;
					} else if (textureIndex === -1 && type === 'ceo' && backMaterial) {
						// Special case for CEO back texture in segmentation view
						backMaterial.map = tex;
						backMaterial.needsUpdate = true;
					}

					idx++;
					// Schedule next generation
					if (typeof requestIdleCallback !== 'undefined') {
						requestIdleCallback(next, { timeout: 1000 });
					} else {
						setTimeout(next, 50);
					}
				}
				next();
			}

			// Create front material with normal map for emboss effect
			frontMaterial = new THREE.MeshPhysicalMaterial({
				map: frontTexture,
				normalMap: normalMap,
				normalScale: new THREE.Vector2(0.5, 0.5), // Subtle emboss
				roughness: 0.1, // Base ceramic texture
				metalness: 0.4, // Non-metallic base
				clearcoat: 1.0, // Restoration: Glass-like top layer
				// clearcoatRoughness: 0.05, // Sharp reflections on top
				reflectivity: 1.0,
				side: THREE.FrontSide,
				// envMapIntensity: 2.0, // Balanced for clearcoat
				// emissive: 0xffffff,
				// emissiveIntensity: 0.2
			});

			// Create back material
			backMaterial = new THREE.MeshPhysicalMaterial({
				map: backTexture,
				color: 0xffffff,
				roughness: 0.2,
				metalness: 0.0,
				clearcoat: 1.0,
				clearcoatRoughness: 0.05,
				reflectivity: 1.0,
				side: THREE.BackSide,
				envMapIntensity: 2.0,
				emissive: 0xffffff,
				emissiveIntensity: 0.2
			});

			// Create edge material
			edgeMaterial = new THREE.MeshPhysicalMaterial({
				color: 0xffffff,
				roughness: 0.2,
				metalness: 0.0,
				clearcoat: 1.0,
				clearcoatRoughness: 0.05,
				reflectivity: 1.0,
				envMapIntensity: 2.0,
				emissive: 0xffffff,
				emissiveIntensity: 0.2
			});

			// Middle layer for exploded view (data layer)
			middleLayerMaterial = new THREE.MeshStandardMaterial({
				color: 0x6666aa,
				roughness: 0.1,
				metalness: 1.0,
				transparent: true,
				opacity: 0,
				side: THREE.DoubleSide,
				depthWrite: true, // Enable for ContactShadows
				emissive: 0x4444aa,
				emissiveIntensity: 0.5
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
			frontMaterial.depthWrite = true; // Keep true for shadows

			backMaterial.transparent = true;
			backMaterial.opacity = Math.max(0.85, 1 - layerSeparation * 0.2);
			backMaterial.depthWrite = true; // Keep true for shadows
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
	</T.Group>

	<!-- Dynamic Text Overlay (Explodes with Layer 3) -->
	<!-- Layer 3 is at 1.1, so we position this slightly in front -->
	<T.Group position.z={layerSeparation * 1.1 + 0.02}>
		<CardTextOverlay {typingProgress} {sectionProgress} {currentSection} />
	</T.Group>

	<!-- Ka Logo (Always visible, explodes to Layer 5) -->
	<!-- Layer 5 is at 1.9. Base Z is 0.02 to sit on card. -->
	{#if kaLogoTexture}
		<T.Group position.x={0.5} position.y={0.8} position.z={layerSeparation * 1.9 + 0.02}>
			<T.Mesh scale={[0.08, 0.08, 1]}>
				<T.CircleGeometry args={[1, 16]} />
				<T.MeshBasicMaterial map={kaLogoTexture} transparent opacity={1} />
			</T.Mesh>
		</T.Group>
	{/if}

	<!-- QR Code (visible in all sections, explodes with Layer 4) -->
	{#if qrCodeTexture}
		<T.Group position.x={0.35} position.y={-0.65} position.z={layerSeparation * 1.5 + 0.02}>
			<T.Mesh scale={[0.35, 0.35, 1]}>
				<T.PlaneGeometry args={[1, 1]} />
				<T.MeshBasicMaterial map={qrCodeTexture} transparent={false} />
			</T.Mesh>
		</T.Group>
	{/if}

	<!-- 5-Layer Stack (In front of card) -->
	<HeroCardExplodedLayers
		{layerSeparation}
		{middleLayerMaterial}
		cardWidth={CARD_WIDTH}
		cardHeight={CARD_HEIGHT}
		{highlightLayer}
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
