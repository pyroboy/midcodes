<script lang="ts">
	// --- IMPORTS ---
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls, useTexture } from '@threlte/extras';
	import * as THREE from 'three';
	import { NoToneMapping } from 'three';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// --- LOCAL IMPORTS ---
	import type { CardGeometry } from '$lib/utils/cardGeometry';
	import { createCardFromInches, createRoundedRectCard } from '$lib/utils/cardGeometry';

	// --- TYPES ---
	type GeometryDimensions = { width: number; height: number } | null;

	/**
	 * Transform texture to fit the 3D card geometry.
	 * Since rendered ID cards already have the correct dimensions matching the template,
	 * we use simple 1:1 mapping. The geometry UVs are already set up correctly.
	 */
	function transformTextureToFit(
		texture: THREE.Texture,
		_templateDims: TemplateDimensions,
		_geoDims: GeometryDimensions | null
	): THREE.Texture {
		// Basic texture setup - flipY is needed because WebGL texture coords have Y going up
		// while image data has Y going down
		texture.flipY = true;
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.colorSpace = THREE.SRGBColorSpace;
		
		// Ensure image has finished loading before updating
		if (texture.image) {
			texture.needsUpdate = true;
		}

		// Use 1:1 mapping - the rendered ID card image should already match the geometry aspect ratio
		// No scaling or offset needed since the image dimensions match the template dimensions
		texture.repeat.set(1, 1);
		texture.offset.set(0, 0);

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
		templateDimensions?:
			| TemplateDimensions
			| (() => Promise<TemplateDimensions> | TemplateDimensions);
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
	let effectiveTemplateDimensions = $state<TemplateDimensions>(null);

	// Helper: Route R2 URLs through our proxy to avoid CORS issues
	function getProxiedUrl(url: string | null): string | null {
		if (!url) return null;
		// Check if this is an R2 URL that needs proxying
		if (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com')) {
			return `/api/image-proxy?url=${encodeURIComponent(url)}`;
		}
		return url;
	}

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
				// Proxy R2 URLs to avoid CORS issues with Three.js texture loading
				resolvedFrontUrl = getProxiedUrl(front);
				resolvedBackUrl = getProxiedUrl(back);
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
				// console.log('🔄 Geometry Path Debug:', {
				// 	resolvedCardGeometry: !!resolvedCardGeometry,
				// 	resolvedTemplateDimensions: resolvedTemplateDimensions
				// });

				if (resolvedCardGeometry) {
					// console.log('📍 Taking Custom Geometry Path');
					geometry = resolvedCardGeometry;

					// FIXED: Use template dimensions to calculate correct geometry dimensions
					// even when we have custom geometry
					if (resolvedTemplateDimensions) {
						// console.log('🔧 Using template dimensions for custom geometry scaling');
						const { width, height, unit } = resolvedTemplateDimensions;
						const isInches = ['in', 'inch', 'inches'].includes(unit?.toLowerCase() ?? '');

						// Convert pixels to a sensible inch-like scale, assuming 300 DPI
						const widthInches = isInches ? width : width / 300;
						const heightInches = isInches ? height : height / 300;

						// Convert to 3D world units using the same scale factor as createCardFromInches
						const scaleInchesToUnits = 0.5;
						const worldWidth = widthInches * scaleInchesToUnits;
						const worldHeight = heightInches * scaleInchesToUnits;

						// Store the actual 3D world dimensions for texture transform
						geometryDimensions = { width: worldWidth, height: worldHeight };
						
						// Store effective dimensions for texture transform
						effectiveTemplateDimensions = {
							width: widthInches,
							height: heightInches,
							unit: 'inches'
						};

						// console.log('📐 Custom Geometry Dimensions:', {
						// 	template: { width, height, unit },
						// 	inches: { width: widthInches, height: heightInches },
						// 	worldUnits: { width: worldWidth, height: worldHeight }
						// });
					} else {
						// console.log('⚠️ No template dimensions available, using default geometry dimensions');
						geometryDimensions = { width: 2, height: 1.25 };
						effectiveTemplateDimensions = null;
					}
				} else if (resolvedTemplateDimensions) {
					// console.log('📍 Taking Template Dimensions Path');
					const { width, height, unit } = resolvedTemplateDimensions;
					const isInches = ['in', 'inch', 'inches'].includes(unit?.toLowerCase() ?? '');

					// Convert pixels to a sensible inch-like scale, assuming 300 DPI
					const widthInches = isInches ? width : width / 300;
					const heightInches = isInches ? height : height / 300;

					// Convert to 3D world units using the same scale factor as createCardFromInches
					const scaleInchesToUnits = 0.5;
					const worldWidth = widthInches * scaleInchesToUnits;
					const worldHeight = heightInches * scaleInchesToUnits;

					// Store the actual 3D world dimensions for texture transform
					geometryDimensions = { width: worldWidth, height: worldHeight };

					// Store effective dimensions for texture transform without triggering loop
					effectiveTemplateDimensions = {
						width: widthInches,
						height: heightInches,
						unit: 'inches'
					};

					// Create geometry with the calculated dimensions
					geometry = await createCardFromInches(widthInches, heightInches);

					// console.log('📐 Geometry Dimensions:', {
					// 	template: { width, height, unit },
					// 	inches: { width: widthInches, height: heightInches },
					// 	worldUnits: { width: worldWidth, height: worldHeight }
					// });
				} else {
					// console.log('📍 Taking Default Geometry Path (no template dimensions)');
					geometry = await createRoundedRectCard();
					geometryDimensions = { width: 2, height: 1.25 };
					effectiveTemplateDimensions = null;
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

	function handleModalCloseKeyboard(event: KeyboardEvent) {
		if (event.key === 'Enter') onClose();
	}

	function handleDialogCloseKeyboard(event: KeyboardEvent) {
		if (event.key === 'Enter') onClose();
	}

	function handleCanvasClickKeyboard(event: KeyboardEvent) {
		if (event.key === 'Enter') event.stopPropagation();
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

<svelte:window onkeydown={handleKeydown} />

{#if frontImageUrlProp || backImageUrlProp}
	<div class="fixed inset-0 z-50">
		<div
			class="fixed inset-0 bg-black/80 backdrop-blur-sm modal-backdrop"
			role="presentation"
			onclick={handleModalClose}
			onkeydown={handleModalCloseKeyboard}
			tabindex="-1"
		></div>

		<div class="fixed inset-0 flex items-center justify-center p-2 md:p-4">
			<div
				class="relative w-full max-w-7xl rounded-lg p-3 md:p-6 shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				onclick={onClose}
				onkeydown={handleDialogCloseKeyboard}
				tabindex="0"
			>
				<h2 id="modal-title" class="sr-only">Image Preview</h2>
				<button
					type="button"
					class="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
					onclick={onClose}
					aria-label="Close preview">✕</button
				>

				<div
					class="relative h-[90vh] w-full"
					onclick={(e) => e.stopPropagation()}
					onkeydown={handleCanvasClickKeyboard}
					role="presentation"
					tabindex="-1"
				>
					{#if canvasError}
						<div
							class="absolute inset-0 z-20 flex items-center justify-center bg-red-500/10 text-red-400"
							role="alert"
						>
							<div class="text-center p-4">
								<div class="mb-2 text-lg font-semibold">Error</div>
								<div class="text-sm">{canvasError}</div>
							</div>
						</div>
					{:else if !isLoadingGeometry && currentGeometry}
						<Canvas toneMapping={NoToneMapping}>
							<T.Scene>
								<T.PerspectiveCamera
									makeDefault
									position={[0, 0, responsiveSettings.cameraDistance]}
									fov={responsiveSettings.fov}
								>
									<OrbitControls
										enableDamping
										dampingFactor={0.05}
										minDistance={1}
										maxDistance={10}
										enablePan={false}
									/>
								</T.PerspectiveCamera>

								<T.AmbientLight intensity={0.8} />
								<T.DirectionalLight position={[5, 5, 5]} intensity={1.5} />

								<T.Group rotation.y={rotationY}>
									{#if currentGeometry.frontGeometry && resolvedFrontUrl}
										{@const frontTexture = useTexture(resolvedFrontUrl, {
											transform: (texture) =>
												transformTextureToFit(
													texture,
													effectiveTemplateDimensions,
													geometryDimensions
												)
										})}

										{#await frontTexture}
											<!-- Front texture loading -->
											<T.Mesh geometry={currentGeometry.frontGeometry}>
												<T.MeshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
											</T.Mesh>
											<!-- Front loading spinner overlay -->
											<T.Group position={[0, 0, 0.01]} rotation.z={rotationY * 4}>
												<T.Mesh scale={[0.4, 0.4, 0.01]}>
													<T.PlaneGeometry args={[1, 1]} />
													<T.ShaderMaterial
														vertexShader={`
															varying vec2 vUv;
															void main() {
																vUv = uv;
																gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
															}
														`}
														fragmentShader={`
															uniform float time;
															varying vec2 vUv;
															
															void main() {
																vec2 center = vec2(0.5, 0.5);
																vec2 pos = vUv - center;
																float dist = length(pos);
																float angle = atan(pos.y, pos.x);
																
																// Create spinner arc
																float innerRadius = 0.15;
																float outerRadius = 0.25;
																float arcStart = -1.57; // -90 degrees
																float arcEnd = arcStart + 4.71; // 270 degrees
																
																// Check if we're in the ring and arc
																float ring = step(innerRadius, dist) * (1.0 - step(outerRadius, dist));
																float inArc = step(arcStart, angle) * (1.0 - step(arcEnd, angle));
																
																// Create fade effect
																float fade = smoothstep(arcStart, arcEnd, angle);
																
																float alpha = ring * inArc * fade;
																gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
															}
														`}
														uniforms={{ time: { value: rotationY } }}
														transparent
														depthWrite={false}
													/>
												</T.Mesh>
											</T.Group>
										{:then map}
											<!-- Front texture loaded -->
											<T.Mesh geometry={currentGeometry.frontGeometry}>
												<T.MeshStandardMaterial {map} roughness={0.4} />
											</T.Mesh>
										{:catch error}
											<!-- Front texture error -->
											<T.Mesh geometry={currentGeometry.frontGeometry}>
												<T.MeshStandardMaterial color="#ff6b6b" />
											</T.Mesh>
											{console.error('Front texture failed to load:', error)}
										{/await}
									{:else if currentGeometry.frontGeometry}
										<!-- Front geometry without texture -->
										<T.Mesh geometry={currentGeometry.frontGeometry}>
											<T.MeshStandardMaterial color="#e0e0e0" roughness={0.8} />
										</T.Mesh>
									{/if}

									{#if currentGeometry.backGeometry && resolvedBackUrl}
										{@const backTexture = useTexture(resolvedBackUrl, {
											transform: (texture) =>
												transformTextureToFit(
													texture,
													effectiveTemplateDimensions,
													geometryDimensions
												)
										})}

										{#await backTexture}
											<!-- Back texture loading -->
											<T.Mesh geometry={currentGeometry.backGeometry}>
												<T.MeshBasicMaterial color="#1a1a1a" transparent opacity={0.9} />
											</T.Mesh>
											<!-- Back loading spinner overlay -->
											<T.Group position={[0, 0, -0.01]} rotation={[0, Math.PI, -rotationY * 4]}>
												<T.Mesh scale={[0.4, 0.4, 0.01]}>
													<T.PlaneGeometry args={[1, 1]} />
													<T.ShaderMaterial
														vertexShader={`
															varying vec2 vUv;
															void main() {
																vUv = uv;
																gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
															}
														`}
														fragmentShader={`
															uniform float time;
															varying vec2 vUv;
															
															void main() {
																vec2 center = vec2(0.5, 0.5);
																vec2 pos = vUv - center;
																float dist = length(pos);
																float angle = atan(pos.y, pos.x);
																
																// Create spinner arc
																float innerRadius = 0.15;
																float outerRadius = 0.25;
																float arcStart = -1.57; // -90 degrees
																float arcEnd = arcStart + 4.71; // 270 degrees
																
																// Check if we're in the ring and arc
																float ring = step(innerRadius, dist) * (1.0 - step(outerRadius, dist));
																float inArc = step(arcStart, angle) * (1.0 - step(arcEnd, angle));
																
																// Create fade effect
																float fade = smoothstep(arcStart, arcEnd, angle);
																
																float alpha = ring * inArc * fade;
																gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
															}
														`}
														uniforms={{ time: { value: rotationY } }}
														transparent
														depthWrite={false}
													/>
												</T.Mesh>
											</T.Group>
										{:then rawMap}
											<!-- Back texture loaded -->
											{@const map = transformTextureToFit(
												rawMap,
												effectiveTemplateDimensions,
												geometryDimensions
											)}
											<T.Mesh geometry={currentGeometry.backGeometry}>
												<T.MeshStandardMaterial {map} roughness={0.4} />
											</T.Mesh>
										{:catch error}
											<!-- Back texture error -->
											<T.Mesh geometry={currentGeometry.backGeometry}>
												<T.MeshStandardMaterial color="#ff6b6b" />
											</T.Mesh>
											{console.error('Back texture failed to load:', error)}
										{/await}
									{:else if currentGeometry.backGeometry}
										<!-- Back geometry without texture -->
										<T.Mesh geometry={currentGeometry.backGeometry}>
											<T.MeshStandardMaterial color="#e0e0e0" roughness={0.8} />
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
							<div
								class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"
							></div>
						</div>
					{/if}
				</div>
			</div>

			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-6">
				<button
					type="button"
					class="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm shadow-lg transition-colors hover:bg-white/20 md:px-6 md:py-3 md:text-base"
					onclick={handleFlip}
					aria-label="Flip card to see other side"
				>
					<span class="flex items-center gap-2">🔄 <span>Flip Card</span></span>
				</button>
			</div>
		</div>
	</div>
{/if}
