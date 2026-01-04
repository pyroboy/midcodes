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

	// Dim opacity for non-highlighted layers (very low to emphasize active layer)
	const DIM_OPACITY = 0.15;

	// Helper to calculate layer opacity based on distance from highlighted layer
	// Same logic as HeroCardExplodedLayers for consistency
	function getLayerOpacity(layerNum: number): number {
		if (highlightLayer === 0) return 1; // No highlight = all visible

		// Calculate target opacity based on distance from highlighted layer
		const distance = Math.abs(highlightLayer - layerNum);
		const targetOpacity = Math.max(DIM_OPACITY, 1 - distance * (1 - DIM_OPACITY));

		// When highlightLayer is between 0-1, blend gradually from full opacity to target
		// This creates smooth transition during layers-hold → layer-1
		if (highlightLayer < 1) {
			return 1 - (1 - targetOpacity) * highlightLayer;
		}

		return targetOpacity;
	}

	// Reactive layer opacities
	const layer1Opacity = $derived(getLayerOpacity(1));
	const layer4Opacity = $derived(getLayerOpacity(4)); // Text overlay
	const layer5Opacity = $derived(getLayerOpacity(5)); // QR code
	const layer6Opacity = $derived(getLayerOpacity(6)); // Ka logo
	const layer7Opacity = $derived(getLayerOpacity(7)); // Back

	// Update layer separation effects
	$effect(() => {
		if (!frontMaterial || !backMaterial || !middleLayerMaterial) return;

		// Layer assignment:
		// Layer 1: Card body (front face/substrate) - the physical card surface
		// Layer 2: Grid (base structure overlay)
		// Layer 3: Photo chip
		// Layer 4: Text lines
		// Layer 5: QR code
		// Layer 6: Ka Logo + status icons (holographic)
		// Layer 7: Back of card

		// Middle layer opacity based on separation and highlight
		const layer2Opacity = getLayerOpacity(2);
		const baseMidOpacity = layerSeparation > 0.05 ? Math.min(1, layerSeparation * 2) : 0;
		middleLayerMaterial.opacity = baseMidOpacity * layer2Opacity;
		middleLayerMaterial.transparent = true;

		// Slight transparency on front/back when separated
		if (layerSeparation > 0.1) {
			frontMaterial.transparent = true;
			frontMaterial.opacity = Math.max(0.85, 1 - layerSeparation * 0.2) * layer1Opacity;
			frontMaterial.depthWrite = true; // Keep true for shadows

			backMaterial.transparent = true;
			backMaterial.opacity = Math.max(0.85, 1 - layerSeparation * 0.2) * layer7Opacity;
			backMaterial.depthWrite = true; // Keep true for shadows

			// Switch to DoubleSide when exploded so back is visible from front view
			backMaterial.side = THREE.DoubleSide;
		} else {
			frontMaterial.transparent = highlightLayer > 0.5;
			frontMaterial.opacity = layer1Opacity;
			backMaterial.transparent = highlightLayer > 0.5;
			backMaterial.opacity = layer7Opacity;

			// Restore to BackSide when collapsed
			backMaterial.side = THREE.BackSide;
		}

		// Mark materials as needing update when side changes
		backMaterial.needsUpdate = true;
	});
</script>

{#if isLoaded && cardGeometry && frontMaterial && backMaterial && edgeMaterial && middleLayerMaterial}
	<!-- Front face (separated forward in exploded view) -->
	<!-- Front face (Card Body - Behind layers) -->
	<T.Group position.z={-layerSeparation * 0.2}>
		<T.Mesh geometry={cardGeometry.frontGeometry} material={frontMaterial} />
	</T.Group>

	<!-- Dynamic Text Overlay (Explodes with Layer 4) -->
	<T.Group position.z={layerSeparation * 1.1 + 0.02}>
		<CardTextOverlay {typingProgress} {sectionProgress} {currentSection} opacity={layer4Opacity} />
	</T.Group>

	<!-- Ka Logo (Always visible, explodes to Layer 6) -->
	{#if kaLogoTexture}
		<T.Group position.x={0.5} position.y={0.8} position.z={layerSeparation * 1.9 + 0.02}>
			<T.Mesh scale={[0.08, 0.08, 1]}>
				<T.CircleGeometry args={[1, 16]} />
				<T.MeshBasicMaterial map={kaLogoTexture} transparent opacity={layer6Opacity} />
			</T.Mesh>
		</T.Group>
	{/if}

	<!-- QR Code (visible in all sections, explodes with Layer 5) -->
	{#if qrCodeTexture}
		<T.Group position.x={0.35} position.y={-0.65} position.z={layerSeparation * 1.5 + 0.02}>
			<T.Mesh scale={[0.35, 0.35, 1]}>
				<T.PlaneGeometry args={[1, 1]} />
				<T.MeshBasicMaterial
					map={qrCodeTexture}
					transparent
					opacity={layer5Opacity}
					depthWrite={layer5Opacity > 0.9}
				/>
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
