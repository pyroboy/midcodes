<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { onMount } from 'svelte';
	import { Canvas, T, useThrelte } from '@threlte/core';
	import { OrbitControls, useTexture } from '@threlte/extras';
	import * as THREE from 'three';
	import {
		ColorManagement,
		SRGBColorSpace,
		LinearFilter,
		LinearToneMapping,
		Texture,
		MathUtils
	} from 'three';
	import type { CardGeometry } from '$lib/utils/cardGeometry';
	import { Loader2 } from 'lucide-svelte';
	// Enable proper color management
	ColorManagement.enabled = true;
	let { frontImageUrl = null, backImageUrl = null, onClose, cardGeometry } = $props<{
		frontImageUrl?: string | null;
		backImageUrl?: string | null;
		onClose: () => void;
		cardGeometry: CardGeometry;
	}>();
	// Simple timing for fake delay
	let frontDelayTimer: number | null = null;
	let frontShowTexture = $state(false);
	let backShowTexture = $state(true); // Back texture shows immediately
	let canvasError: string | null = $state(null);
	let debugMode = $state(true);
	let modalRef: HTMLDialogElement | undefined = $state();
	let mounted = $state(true);  // Initialize immediately to show 3D model right away
	let modulesLoaded = $state(true);  // Initialize immediately to show 3D model right away
	// Use preloaded geometry from parent
	const frontGeometry = cardGeometry.frontGeometry;
	const backGeometry = cardGeometry.backGeometry;
	const edgeGeometry = cardGeometry.edgeGeometry;
	let rotationY = $state(0);
	let shouldAutoRotate = $state(true);
	let targetRotationY = $state(0);
	let animationId: number | null = null;
	// Simple debug logging
	let debugLogs = $state<Array<{timestamp: number, message: string, type: 'info' | 'error' | 'success'}>>([]);
	
	// Simple function to start front texture delay
	function startFrontTextureDelay() {
		console.log('🔄 Starting front texture delay, frontShowTexture:', frontShowTexture);
		if (frontDelayTimer) clearTimeout(frontDelayTimer);
		frontShowTexture = false;
		addDebugLog('Front texture available, adding 3s fake delay...', 'info');
		console.log('⏰ 3-second timer started, spinner should be visible now');
		frontDelayTimer = window.setTimeout(() => {
			frontShowTexture = true;
			console.log('✅ Front texture delay completed, showing real texture');
			addDebugLog('Front texture loaded successfully (after fake delay)', 'success');
		}, 3000);
	}
	
	// Reset function called when modal opens
	function resetTextureStates() {
		if (frontDelayTimer) clearTimeout(frontDelayTimer);
		frontShowTexture = false;
		backShowTexture = true;
		addDebugLog('Modal opened, resetting texture states', 'info');
	}
	// This is the new, simpler handleFlip function
	function handleFlip() {
		shouldAutoRotate = false;
		// Round the current target to the nearest half-turn, then add a full half-turn (PI)
		targetRotationY = Math.round(targetRotationY / Math.PI) * Math.PI + Math.PI;
	}
	// Simple animation loop using requestAnimationFrame
	function animate() {
		// Auto-rotate logic
		if (shouldAutoRotate) {
			// Increment the target smoothly over time
			targetRotationY += 0.016 * 0.4; // Assuming 60fps
		}
		// Smoothly interpolate the actual rotation towards the target rotation
		// This handles both auto-rotation and the flip animation
		rotationY = MathUtils.lerp(rotationY, targetRotationY, 0.05);
		animationId = requestAnimationFrame(animate);
	}
	
	// Simple loading progress
	let loadingProgress = $derived.by(() => {
		let progress = 0;
		if (frontShowTexture) progress += 50;
		if (backShowTexture) progress += 50;
		return progress;
	});
	function addDebugLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
		console.log(`[ImagePreviewModal] ${message}`);
		debugLogs.push({
			timestamp: Date.now(),
			message,
			type
		});
		// Keep only last 50 logs
		if (debugLogs.length > 50) {
			debugLogs = debugLogs.slice(-50);
		}
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		} else if (event.key === 'd') {
			debugMode = !debugMode;
		}
	}
	onMount(() => {
		addDebugLog('Modal component mounted', 'info');
		// Reset texture states when modal opens
		resetTextureStates();
		// Start the animation loop
		animate();
		return () => {
			addDebugLog('Modal component unmounting', 'info');
			// Clean up animation
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			// Clean up timer
			if (frontDelayTimer) {
				clearTimeout(frontDelayTimer);
			}
		};
	});
	function handleModalClose(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('modal-backdrop')) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />
{#if frontImageUrl || backImageUrl}
	<div class="fixed inset-0 z-50">
		<div
			class="fixed inset-0 bg-black/80 backdrop-blur-sm"
			role="presentation"
			onclick={handleModalClose}
		></div>
		<div class="fixed inset-0 flex items-center justify-center p-4">
			<div
				class="relative w-full max-w-5xl rounded-lg p-6 shadow-2xl"
				role="dialog"
				aria-labelledby="modal-title"
			>
				<button
					type="button"
					class="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
					onclick={onClose}
					aria-label="Close preview"
				>
					✕
				</button>
				<div class="h-[80vh] w-full relative">
					{#if canvasError}
						<div
							class="absolute inset-0 flex items-center justify-center bg-red-500/10 text-red-400 z-20"
							role="alert"
						>
							<div class="text-center p-4">
								<div class="text-lg font-semibold mb-2">Error</div>
								<div class="text-sm">{canvasError}</div>
							</div>
						</div>
					{/if}
					{#if mounted && modulesLoaded}
						<Canvas>
							{#if frontImageUrl || backImageUrl}
								{#await Promise.all( [frontImageUrl ? useTexture(frontImageUrl).catch(() => null) : Promise.resolve(null), backImageUrl ? useTexture(backImageUrl).catch(() => null) : Promise.resolve(null)] ) then [frontTexture, backTexture]}
									<!-- Trigger delay when front texture is available -->
									{#if frontTexture && !Array.isArray(frontTexture) && !frontShowTexture && frontDelayTimer === null}
										{(() => {
											// Use setTimeout to avoid state mutation in template
											setTimeout(() => startFrontTextureDelay(), 0);
											return null;
										})()}
									{/if}
									<T.Scene>
										<T.Color attach="background" args={[0, 0, 0, 0]} transparent={true} />
										<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={35}>
											<OrbitControls enableDamping />
											<T.HemisphereLight skyColor="#ffffff" groundColor="#ffffff" intensity={0.2} />
											<T.AmbientLight color={0xffffff} intensity={0.5} />
											<T.DirectionalLight position={[5, 1.5, 5]} intensity={0.7} />
											<T.DirectionalLight position={[-5, 3, 5]} intensity={0.3} color="#b1e1ff" />
											<T.DirectionalLight position={[-6, -3, 3]} intensity={0.2} color="#ffecd1" />
										</T.PerspectiveCamera>
										<T.Group rotation.y={rotationY}>
											<!-- Front face - always show -->
											{#if frontGeometry}
												{#if frontImageUrl && frontTexture && !Array.isArray(frontTexture) && frontShowTexture}
													<!-- Front face with loaded texture -->
													<T.Mesh geometry={frontGeometry}>
														<T.MeshStandardMaterial
															envMap={null}
															color="#ffffff"
															map={frontTexture as THREE.Texture}
															metalness={0.1}
															roughness={0.1}
														/>
													</T.Mesh>
												{:else}
													<!-- Front face with loading spinner -->
													<T.Mesh geometry={frontGeometry}>
														<T.MeshStandardMaterial
															envMap={null}
															color="#374151"
															metalness={0.1}
															roughness={0.8}
														/>
													</T.Mesh>
													{#if frontImageUrl && frontTexture && !Array.isArray(frontTexture) && !frontShowTexture}
														<!-- Nice rotating loader icon -->
														<T.Group position={[0, 0, 0.03]} rotation={[0, 0, -rotationY * 4]} scale={[0.15, 0.15, 0.15]}>
															<!-- <T.Mesh>
																<T.CircleGeometry args={[1, 32]} />
																<T.MeshBasicMaterial color="#ffffff" transparent opacity={0.9} />
															</T.Mesh> -->
															<!-- Loader2 icon shape using basic geometry -->
															<T.Mesh position={[0, 0, 0.001]}>
																<T.RingGeometry args={[0.6, 0.8, 100, 1, 0, Math.PI * 1.5]} />
																<T.MeshBasicMaterial color="#ffffff" transparent opacity={0.8} />
															</T.Mesh>
														</T.Group>
													{/if}
												{/if}
											{/if}

											<!-- Back face - always show -->
											{#if backGeometry}
												{#if backImageUrl && backTexture && !Array.isArray(backTexture) && backShowTexture}
													<!-- Back face with loaded texture -->
													<T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
														<T.MeshStandardMaterial
															map={backTexture as THREE.Texture}
															envMap={null}
															metalness={0.1}
															roughness={0.1}
														/>
													</T.Mesh>
												{:else}
													<!-- Back face with loading spinner -->
													<T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
														<T.MeshStandardMaterial
															envMap={null}
															color="#374151"
															metalness={0.1}
															roughness={0.8}
														/>
													</T.Mesh>
												{/if}
											{/if}
											{#if edgeGeometry}
												<T.Mesh geometry={edgeGeometry}>
													<T.MeshStandardMaterial color="#ffffff" metalness={0} roughness={0.2} />
												</T.Mesh>
											{/if}
										</T.Group>
									</T.Scene>
								{:catch error}
									{(() => {
										canvasError = `Failed to load textures: ${error.message}`;
										addDebugLog(`Texture loading error: ${error.message}`, 'error');
										return null;
									})()}
									<div class="text-red-400 text-center p-4">
										Failed to load textures: {error.message}
									</div>
								{/await}
							{/if}
						</Canvas>
					{/if}
				</div>
			</div>
			<div class="absolute bottom-6 left-1/2 -translate-x-1/2">
				<button
					type="button"
					class="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
					onclick={handleFlip}
				>
					Flip Card
				</button>
			</div>

		</div>
	</div>
{/if}
