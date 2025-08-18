<script lang="ts">
	// --- IMPORTS ---
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls, useTexture } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// --- LOCAL IMPORTS ---
	import type { CardGeometry } from '$lib/utils/cardGeometry';
	import { createCardFromInches, createRoundedRectCard } from '$lib/utils/cardGeometry';
	import LoadingSpinner from './LoadingSpinner.svelte';

	// --- TYPES ---
	type GeometryDimensions = { width: number; height: number } | null;

	/**
	 * ✅ THE CORE FIX: Transforms a texture to "cover" a geometry.
	 * This function compares the aspect ratio of the image and the 3D model
	 * and adjusts the texture's scale (.repeat) and position (.offset)
	 * to ensure it fills the entire surface, cropping any excess.
	 */
	function transformTextureToCover(
		texture: THREE.Texture,
		templateDims: TemplateDimensions,
		geoDims: GeometryDimensions | null
	): THREE.Texture {
		// If we don't have the necessary dimensions, return the texture as is.
		if (!templateDims || !geoDims) {
			return texture;
		}

		// Keep flipY=true for proper orientation in most cases
		texture.flipY = true;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		
		const templateAspect = templateDims.width / templateDims.height;
		const geometryAspect = geoDims.width / geoDims.height;

		if (templateAspect > geometryAspect) {
			// Image is WIDER than the card geometry.
			// We fit the texture to the card's height and let the sides get cropped.
			const scale = geometryAspect / templateAspect;
			texture.repeat.set(scale, 1);
			texture.offset.set((1 - scale) / 2, 0);
		} else {
			// Image is TALLER than (or same aspect as) the card geometry.
			// We fit the texture to the card's width and let the top/bottom get cropped.
			const scale = templateAspect / geometryAspect;
			texture.repeat.set(1, scale);
			texture.offset.set(0, (1 - scale) / 2);
		}
		
		console.log('🎯 Texture Transform Applied:', {
			templateAspect,
			geometryAspect,
			repeat: { x: texture.repeat.x, y: texture.repeat.y },
			offset: { x: texture.offset.x, y: texture.offset.y }
		});
		
		texture.needsUpdate = true;
		return texture;
	}

	// --- PROPS ---
	let {
		frontImageUrl: frontImageUrlProp = null,
		backImageUrl: backImageUrlProp = null,
		onClose = () => {},
		cardGeometry: cardGeometryProp = null,
		templateDimensions: templateDimensionsProp = null
	} = $props<{
		frontImageUrl?: string | null | (() => Promise<string | null> | string | null);
		backImageUrl?: string | null | (() => Promise<string | null> | string | null);
		onClose?: (event?: MouseEvent) => void;
		cardGeometry?: CardGeometry | null | (() => Promise<CardGeometry | null> | CardGeometry | null);
		templateDimensions?: TemplateDimensions | (() => Promise<TemplateDimensions> | TemplateDimensions);
	}>();

	type TemplateDimensions = { width: number; height: number; unit?: string } | null;

	// --- STATE ---
	let currentGeometry = $state<CardGeometry | null>(null);
	let geometryDimensions = $state<GeometryDimensions>(null);
	let isLoadingGeometry = $state(true); // Start in a loading state
	let canvasError = $state<string | null>(null);

	// --- REACTIVE PROP HANDLING ---
	let resolvedFrontUrl = $state<string | null>(null);
	let resolvedBackUrl = $state<string | null>(null);
	let resolvedCardGeometry = $state<CardGeometry | null>(null);
	let resolvedTemplateDimensions = $state<TemplateDimensions>(null);


	// Effect 1: Resolve incoming props, which may be functions or promises
	$effect(() => {
		const resolveProp = async (prop: any) => (typeof prop === 'function' ? await prop() : prop);
		(async () => {
			try {
				isLoadingGeometry = true;
				const [front, back, geo, dims] = await Promise.all([
					resolveProp(frontImageUrlProp),
					resolveProp(backImageUrlProp),
					resolveProp(cardGeometryProp),
					resolveProp(templateDimensionsProp)
				]);
				resolvedFrontUrl = front;
				resolvedBackUrl = back;
				resolvedCardGeometry = geo;
				resolvedTemplateDimensions = dims;
			} catch (error) {
				console.error('❌ Failed to resolve component props:', error);
				canvasError = 'Failed to load input data.';
				isLoadingGeometry = false;
			}
		})();
	});

	// Effect 2: Generate the 3D geometry once the resolved props are ready
	$effect(() => {
		const updateGeometry = async () => {
			canvasError = null;
			try {
			let geometry: CardGeometry | null = null;
			if (resolvedCardGeometry) {
				geometry = resolvedCardGeometry;
				// Use default geometry dimensions if not specified
				geometryDimensions = { width: 2, height: 1.25 };
			} else if (resolvedTemplateDimensions) {
				const { width, height, unit } = resolvedTemplateDimensions;
				const isInches = ['in', 'inch', 'inches'].includes(unit?.toLowerCase() ?? '');
				
				// Convert pixels to a sensible inch-like scale, assuming 300 DPI
				const widthInches = isInches ? width : width / 300;
				const heightInches = isInches ? height : height / 300;
				
				// Store geometry dimensions for texture transform
				geometryDimensions = { width: widthInches, height: heightInches };
				
				// Create standard geometry - texture transform will handle the rest
				geometry = await createCardFromInches(widthInches, heightInches);
			} else {
				geometry = await createRoundedRectCard();
				geometryDimensions = { width: 2, height: 1.25 };
			}
				currentGeometry = geometry;
			} catch (error: any) {
				console.error('❌ Failed to create geometry:', error);
				canvasError = `Failed to load 3D model: ${error.message}`;
				currentGeometry = null;
			} finally {
				isLoadingGeometry = false;
			}
		};
		
		if (resolvedFrontUrl || resolvedBackUrl) {
			updateGeometry();
		} else {
			isLoadingGeometry = false;
		}
	});

	// --- RESPONSIVE CALCULATIONS ---
	let viewportWidth = $state(browser ? window.innerWidth : 1920);
	let viewportHeight = $state(browser ? window.innerHeight : 1080);

	const responsiveSettings = $derived.by(() => {
		const scaleRatio = Math.min(viewportWidth / 1920, viewportHeight / 1080);
		let cardAspectRatio = 1.6; // Default
		if (resolvedTemplateDimensions) {
			cardAspectRatio = resolvedTemplateDimensions.width / resolvedTemplateDimensions.height;
		}
		const baseCameraDistance = cardAspectRatio > 1.2 ? 2.8 : 3.5; // Adjust for portrait vs landscape
		return {
			cameraDistance: Math.max(1.5, baseCameraDistance - scaleRatio * 0.5),
			fov: 60
		};
	});

	// --- ANIMATION & INTERACTION ---
	let rotationY = $state(0);
	let shouldAutoRotate = $state(true);
	let targetRotationY = $state(0);
	let animationId: number | null = null;

	function animate() {
		if (shouldAutoRotate) targetRotationY += 0.005;
		rotationY = THREE.MathUtils.lerp(rotationY, targetRotationY, 0.05);
		animationId = requestAnimationFrame(animate);
	}

	function handleFlip() {
		shouldAutoRotate = false;
		targetRotationY = Math.round(targetRotationY / Math.PI) * Math.PI + Math.PI;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}
	
	function handleResize() {
		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;
	}

	function handleModalClose(event: MouseEvent) {
		if ((event.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
	}

	// --- LIFECYCLE ---
	onMount(() => {
		if (!browser) return;
		THREE.ColorManagement.enabled = true;
		animate();
		window.addEventListener('resize', handleResize);
		return () => {
			if (animationId) cancelAnimationFrame(animationId);
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if resolvedFrontUrl || resolvedBackUrl}
	<div class="fixed inset-0 z-50">
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm modal-backdrop" role="presentation" onclick={handleModalClose}></div>

		<div class="fixed inset-0 flex items-center justify-center p-2 md:p-4">
			<div class="relative w-full max-w-7xl rounded-lg p-3 md:p-6 shadow-2xl" role="dialog">
				<button type="button" class="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onclick={onClose} aria-label="Close preview">✕</button>

				<div class="relative h-[90vh] w-full">
					{#if canvasError}
						<div class="absolute inset-0 z-20 flex items-center justify-center bg-red-500/10 text-red-400" role="alert">
							<div class="text-center p-4">
								<div class="mb-2 text-lg font-semibold">Error</div>
								<div class="text-sm">{canvasError}</div>
							</div>
						</div>
					{:else if !isLoadingGeometry && currentGeometry}
						<Canvas>
							<T.Scene>
								<T.PerspectiveCamera makeDefault position={[0, 0, responsiveSettings.cameraDistance]} fov={responsiveSettings.fov}>
									<OrbitControls enableDamping dampingFactor={0.05} minDistance={1} maxDistance={10} enablePan={false}/>
								</T.PerspectiveCamera>

								<T.AmbientLight intensity={0.8} />
								<T.DirectionalLight position={[5, 5, 5]} intensity={1.5} />
								
								<T.Group rotation.y={rotationY}>
									{#if currentGeometry.frontGeometry}
										<T.Mesh geometry={currentGeometry.frontGeometry}>
											{#if resolvedFrontUrl}
												{#await useTexture(resolvedFrontUrl, { 
													transform: (texture) => transformTextureToCover(texture, resolvedTemplateDimensions, geometryDimensions)
												}) then map}
													<T.MeshStandardMaterial {map} roughness={0.4} />
												{:catch error}
													<T.MeshStandardMaterial color="#ff6b6b" />
													{console.error('Front texture failed to load:', error)}
												{/await}
											{:else}
												<T.MeshStandardMaterial color="#e0e0e0" roughness={0.8} />
											{/if}
										</T.Mesh>
									{/if}
									
									{#if currentGeometry.backGeometry}
										<T.Mesh geometry={currentGeometry.backGeometry}>
											{#if resolvedBackUrl}
												{#await useTexture(resolvedBackUrl, { 
													transform: (texture) => transformTextureToCover(texture, resolvedTemplateDimensions, geometryDimensions)
												}) then map}
													<T.MeshStandardMaterial {map} roughness={0.4} />
												{:catch error}
													<T.MeshStandardMaterial color="#ff6b6b" />
													{console.error('Back texture failed to load:', error)}
												{/await}
											{:else}
												<T.MeshStandardMaterial color="#e0e0e0" roughness={0.8} />
											{/if}
										</T.Mesh>
									{/if}

									{#if currentGeometry.edgeGeometry}
										<T.Mesh geometry={currentGeometry.edgeGeometry}>
											<T.MeshStandardMaterial color="#f0f0f0" metalness={0.1} roughness={0.6} />
										</T.Mesh>
									{/if}
								</T.Group>
							</T.Scene>
						</Canvas>
					{:else}
						<div class="absolute inset-0 flex items-center justify-center">
							<LoadingSpinner />
						</div>
					{/if}
				</div>
			</div>

			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-6">
				<button type="button" class="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm shadow-lg transition-colors hover:bg-white/20 md:px-6 md:py-3 md:text-base" onclick={handleFlip}>
					<span class="flex items-center gap-2">🔄 <span>Flip Card</span></span>
				</button>
			</div>
		</div>
	</div>
{/if}