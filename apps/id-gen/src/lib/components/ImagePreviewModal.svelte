<script lang="ts">
    import LoadingSpinner from './LoadingSpinner.svelte';
    import { onMount } from 'svelte';
    import { Canvas, T, useThrelte } from '@threlte/core';
    import { OrbitControls, useTexture } from '@threlte/extras';
    import * as THREE from 'three';
    import { ColorManagement, MathUtils } from 'three';
    import type { CardGeometry } from '$lib/utils/cardGeometry';

    // Enable proper color management
    ColorManagement.enabled = true;

    let { frontImageUrl = null, backImageUrl = null, onClose, cardGeometry } = $props<{
        frontImageUrl?: string | null;
        backImageUrl?: string | null;
        onClose: () => void;
        cardGeometry: CardGeometry;
    }>();

    // Use preloaded geometry from parent
    const frontGeometry = cardGeometry.frontGeometry;
    const backGeometry = cardGeometry.backGeometry;
    const edgeGeometry = cardGeometry.edgeGeometry;

    let canvasError: string | null = $state(null);
    let rotationY = $state(0);
    let shouldAutoRotate = $state(true);
    let targetRotationY = $state(0);
    let animationId: number | null = null;
    let debugLogs = $state<Array<{ timestamp: number; message: string; type: 'info' | 'error' | 'success' }>>([]);


    function addDebugLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
        console.log(`[ImagePreviewModal] ${message}`);
        debugLogs.push({
            timestamp: Date.now(),
            message,
            type
        });
        if (debugLogs.length > 50) {
            debugLogs = debugLogs.slice(-50);
        }
    }

    function handleFlip() {
        shouldAutoRotate = false;
        targetRotationY = Math.round(targetRotationY / Math.PI) * Math.PI + Math.PI;
    }

    function animate() {
        if (shouldAutoRotate) {
            targetRotationY += 0.016 * 0.4;
        }
        rotationY = MathUtils.lerp(rotationY, targetRotationY, 0.05);
        animationId = requestAnimationFrame(animate);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    onMount(() => {
        addDebugLog('Modal component mounted', 'info');
        animate();
        return () => {
            addDebugLog('Modal component unmounting', 'info');
            if (animationId) {
                cancelAnimationFrame(animationId);
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
            class="fixed inset-0 bg-black/80 backdrop-blur-sm modal-backdrop"
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
                    <Canvas>
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

                                {#if frontGeometry}
                                    {#await frontImageUrl ? useTexture(frontImageUrl) : Promise.resolve(null)}
                                        <T.Mesh geometry={frontGeometry}>
                                            <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                        </T.Mesh>
                                    {:then frontTexture}
                                        <T.Mesh geometry={frontGeometry}>
                                            <T.MeshStandardMaterial
                                                envMap={null}
                                                color="#ffffff"
                                                map={frontTexture as THREE.Texture}
                                                metalness={0.1}
                                                roughness={0.1}
                                            />
                                        </T.Mesh>
                                    {:catch error}
                                        <T.Mesh geometry={frontGeometry}>
                                            <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                        </T.Mesh>
                                        {(() => {
                                            if (!canvasError) {
                                                canvasError = `Failed to load front texture: ${error.message}`;
                                                addDebugLog(`Front texture loading error: ${error.message}`, 'error');
                                            }
                                            return null;
                                        })()}
                                    {/await}
                                {/if}
                                
                                {#if backGeometry}
                                    {#await backImageUrl ? useTexture(backImageUrl) : Promise.resolve(null)}
                                        <T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
                                            <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                        </T.Mesh>
                                    {:then backTexture}
                                        <T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
                                            <T.MeshStandardMaterial
                                                map={backTexture as THREE.Texture}
                                                envMap={null}
                                                metalness={0.1}
                                                roughness={0.1}
                                            />
                                        </T.Mesh>
                                    {:catch error}
                                        <T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
                                            <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                        </T.Mesh>
                                        {(() => {
                                            if (!canvasError) {
                                                canvasError = `Failed to load back texture: ${error.message}`;
                                                addDebugLog(`Back texture loading error: ${error.message}`, 'error');
                                            }
                                            return null;
                                        })()}
                                    {/await}
                                {/if}

                                {#await Promise.all([
                                    frontImageUrl ? useTexture(frontImageUrl) : Promise.resolve(null),
                                    backImageUrl ? useTexture(backImageUrl) : Promise.resolve(null)
                                ])}
                                    <T.Group
                                        position={[0, 0, 0.01]}
                                        rotation={[0, 0, -rotationY * 4]}
                                        scale={[0.15, 0.15, 0.15]}
                                    >
                                        <T.Mesh>
                                            <T.RingGeometry args={[0.6, 0.8, 100, 1, 0, Math.PI * 1.5]} />
                                            <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                                        </T.Mesh>
                                    </T.Group>
                                    <T.Group
                                        position={[0, 0, -0.011]}
                                        rotation={[0, Math.PI, -rotationY * 4]}
                                        scale={[0.15, 0.15, 0.15]}
                                    >
                                        <T.Mesh>
                                            <T.RingGeometry args={[0.6, 0.8, 100, 1, 0, Math.PI * 1.5]} />
                                            <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                                        </T.Mesh>
                                    </T.Group>
                                {:then}
                                    {/await}

                                {#if edgeGeometry}
                                    <T.Mesh geometry={edgeGeometry}>
                                        <T.MeshStandardMaterial color="#ffffff" metalness={0} roughness={0.2} />
                                    </T.Mesh>
                                {/if}
                            </T.Group>
                        </T.Scene>
                    </Canvas>
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