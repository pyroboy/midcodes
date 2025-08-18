<script lang="ts">
    import LoadingSpinner from './LoadingSpinner.svelte';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    // Dynamically import Threlte components only on client
    let Canvas: any = $state(null);
    let T: any = $state(null);
    let useThrelte: any = $state(null);
    let OrbitControls: any = $state(null);
    let useTexture: any = $state(null);
    let THREE: any = $state(null);
    let ColorManagement: any = $state(null);
    let MathUtils: any = $state(null);
    
    onMount(async () => {
        if (browser) {
            const threlteCore = await import('@threlte/core');
            const threlteExtras = await import('@threlte/extras');
            const threeJs = await import('three');
            
            Canvas = threlteCore.Canvas;
            T = threlteCore.T;
            useThrelte = threlteCore.useThrelte;
            OrbitControls = threlteExtras.OrbitControls;
            useTexture = threlteExtras.useTexture;
            THREE = threeJs;
            ColorManagement = threeJs.ColorManagement;
            MathUtils = threeJs.MathUtils;
            
            // Enable proper color management
            ColorManagement.enabled = true;
        }
    });
    import type { CardGeometry } from '$lib/utils/cardGeometry';
    import { createRoundedRectCard, createCardFromInches } from '$lib/utils/cardGeometry';

    // Better prop handling - single props object with null-safe derived props
    type TemplateDimensions = { width: number; height: number; unit?: string } | null;
    
    type ModalProps = {
        frontImageUrl?: string | null;
        backImageUrl?: string | null;
        onClose?: () => void;
        cardGeometry?: CardGeometry | null;
        templateDimensions?: TemplateDimensions;
    };

    const props = $props<ModalProps>();

    // Null-safe, reactive derived props - keeping same names for existing code compatibility
    const onClose = $derived(() => props.onClose ?? (() => {}));
    const frontImageUrl = $derived(() => props.frontImageUrl ?? null);
    const backImageUrl = $derived(() => props.backImageUrl ?? null);
    const cardGeometry = $derived(() => props.cardGeometry ?? null);
    const templateDimensions = $derived(() => props.templateDimensions ?? null);

    // Track computed geometry and ownership for proper cleanup
    let computedGeometry = $state<CardGeometry | null>(null);
    let ownsGeometry = $state(false);
    
    // Token to cancel stale async operations
    let geometryToken = $state(0);

    // Helper to dispose geometries we created
    function disposeGeometry(geom: CardGeometry | null) {
        try {
            geom?.frontGeometry?.dispose?.();
            geom?.backGeometry?.dispose?.();
            geom?.edgeGeometry?.dispose?.();
        } catch (e: any) {
            addDebugLog(`disposeGeometry error: ${e?.message ?? e}`, 'error');
        }
    }
    
    // Cancelable geometry computation effect - prevents race conditions
    $effect(() => {
        // dependencies
        const cg = cardGeometry;
        const dims = templateDimensions;

        // clear previous state for a fresh recompute
        canvasError = null;
        addDebugLog('Geometry inputs changed — recomputing', 'info');

        // reset current geometry while (re)computing
        if (ownsGeometry && computedGeometry) {
            disposeGeometry(computedGeometry);
            ownsGeometry = false;
        }
        computedGeometry = null;

        const token = ++geometryToken;
        let cancelled = false;

        (async () => {
            try {
                let geometry: CardGeometry | null = null;
                let owned = false;

                if (cg) {
                    // use provided geometry (do not own/dispose)
                    geometry = cg;
                    owned = false;
                } else if (dims && browser) {
                    const u = dims.unit?.toLowerCase?.() ?? '';
                    const isInches = u === 'inches' || u === 'inch' || u === 'in';
                    const widthInches = isInches ? dims.width : dims.width / 300;
                    const heightInches = isInches ? dims.height : dims.height / 300;
                    geometry = await createCardFromInches(widthInches, heightInches);
                    owned = true;
                } else if (browser) {
                    geometry = await createRoundedRectCard();
                    owned = true;
                }

                if (cancelled || token !== geometryToken) {
                    if (owned) disposeGeometry(geometry);
                    return;
                }

                computedGeometry = geometry;
                ownsGeometry = owned;
                addDebugLog('Geometry computed', 'success');
            } catch (error: any) {
                if (cancelled || token !== geometryToken) return;

                addDebugLog(`Failed to create geometry: ${error?.message ?? error}`, 'error');

                try {
                    const fallback = await createRoundedRectCard();
                    if (cancelled || token !== geometryToken) {
                        disposeGeometry(fallback);
                        return;
                    }
                    computedGeometry = fallback;
                    ownsGeometry = true;
                    addDebugLog('Fallback geometry created', 'success');
                } catch (fallbackError: any) {
                    if (cancelled || token !== geometryToken) return;
                    canvasError = 'Failed to create geometry';
                    addDebugLog(`Fallback geometry failed: ${fallbackError?.message ?? fallbackError}`, 'error');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    });

    // Null-safe derived geometry values
    const frontGeometry = $derived(() => computedGeometry?.frontGeometry ?? null);
    const backGeometry = $derived(() => computedGeometry?.backGeometry ?? null);
    const edgeGeometry = $derived(() => computedGeometry?.edgeGeometry ?? null);

    // Texture keys for keying texture loading blocks and error reset
    const frontTextureKey = $derived(() => `${frontImageUrl ?? 'none'}|${frontGeometry ? 'g' : 'nog'}`);
    const backTextureKey = $derived(() => `${backImageUrl ?? 'none'}|${backGeometry ? 'g' : 'nog'}`);
    
    // Scene key for optional geometry-based rerenders
    const sceneKey = $derived(() => `g:${geometryToken}`);

    // Reset canvasError when texture inputs change
    $effect(() => {
        // read keys to register dependencies
        void frontTextureKey;
        void backTextureKey;
        // reset any previous load error when inputs change
        canvasError = null;
    });

    // Responsive scaling for different screen sizes
    let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1920);
    let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080);
    
    // Calculate responsive camera position and model scale
    const responsiveSettings = $derived(() => {
        const baseWidth = 1920;
        const baseHeight = 1080;
        const widthRatio = viewportWidth / baseWidth;
        const heightRatio = viewportHeight / baseHeight;
        const scaleRatio = Math.min(widthRatio, heightRatio);
        
        // Adjust camera distance and model scale based on screen size
        const cameraDistance = Math.max(2.5, 3.5 - (scaleRatio * 0.8));
        const modelScale = Math.min(1.8, 1.2 + (scaleRatio * 0.6));
        
        return {
            cameraDistance,
            modelScale,
            fov: Math.min(60, 50 + (scaleRatio * 10))
        };
    });

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
        if (MathUtils) {
            rotationY = MathUtils.lerp(rotationY, targetRotationY, 0.05);
        } else {
            // Fallback linear interpolation
            rotationY += (targetRotationY - rotationY) * 0.05;
        }
        animationId = requestAnimationFrame(animate);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    function handleResize() {
        if (typeof window !== 'undefined') {
            viewportWidth = window.innerWidth;
            viewportHeight = window.innerHeight;
        }
    }

    onMount(() => {
        addDebugLog('Modal component mounted', 'info');
        if (browser) {
            animate();
        }
        
        // Set initial viewport dimensions
        if (typeof window !== 'undefined') {
            viewportWidth = window.innerWidth;
            viewportHeight = window.innerHeight;
            window.addEventListener('resize', handleResize);
        }
        
        return () => {
            addDebugLog('Modal component unmounting', 'info');
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', handleResize);
            }
            // Dispose any geometry we created
            if (ownsGeometry && computedGeometry) {
                disposeGeometry(computedGeometry);
                computedGeometry = null;
                ownsGeometry = false;
            }
            // reset error state on exit
            canvasError = null;
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
        <div class="fixed inset-0 flex items-center justify-center p-2 md:p-4">
            <div
                class="relative w-full max-w-7xl rounded-lg p-3 md:p-6 shadow-2xl"
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
                <div class="h-[90vh] w-full relative">
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
                    {#if Canvas && T && OrbitControls && useTexture && THREE}
                        <Canvas>
                            <T.Scene>
                                <T.Color attach="background" args={[0, 0, 0, 0]} transparent={true} />
                                <T.PerspectiveCamera makeDefault position={[0, 0, responsiveSettings().cameraDistance]} fov={responsiveSettings().fov}>
                                    <OrbitControls
                                    enableDamping 
                                    dampingFactor={0.05}
                                    minDistance={1.5}
                                    maxDistance={10}
                                    enablePan={true}
                                    panSpeed={0.8}
                                    enableZoom={true}
                                    zoomSpeed={0.8}
                                />
                                <T.HemisphereLight skyColor="#ffffff" groundColor="#ffffff" intensity={0.3} />
                                <T.AmbientLight color={0xffffff} intensity={0.6} />
                                <T.DirectionalLight position={[5, 2, 5]} intensity={0.8} />
                                <T.DirectionalLight position={[-5, 3, 5]} intensity={0.4} color="#b1e1ff" />
                                <T.DirectionalLight position={[-6, -3, 3]} intensity={0.3} color="#ffecd1" />
                            </T.PerspectiveCamera>
                            {#key sceneKey}
                                <T.Group rotation.y={rotationY} scale={responsiveSettings().modelScale}>

                                    {#if frontGeometry}
                                        {#key frontTextureKey}
                                            {#await frontImageUrl ? useTexture(frontImageUrl) : Promise.resolve(null)}
                                                <T.Mesh geometry={frontGeometry}>
                                                    <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                                </T.Mesh>
                                            {:then frontTexture}
                                                <T.Mesh geometry={frontGeometry}>
                                                    <T.MeshStandardMaterial
                                                        envMap={null}
                                                        color="#ffffff"
                                                        map={frontTexture}
                                                        metalness={0.1}
                                                        roughness={0.1}
                                                    />
                                                </T.Mesh>
                                            {:catch error}
                                                <T.Mesh geometry={frontGeometry}>
                                                    <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                                </T.Mesh>
                                                {(() => {
                                                    canvasError = `Failed to load front texture: ${error?.message ?? error}`;
                                                    addDebugLog(`Front texture loading error: ${error?.message ?? error}`, 'error');
                                                    return null;
                                                })()}
                                            {/await}
                                        {/key}
                                    {/if}
                                    
                                    {#if backGeometry}
                                        {#key backTextureKey}
                                            {#await backImageUrl ? useTexture(backImageUrl) : Promise.resolve(null)}
                                                <T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
                                                    <T.MeshStandardMaterial envMap={null} color="#374151" metalness={0.1} roughness={0.8} />
                                                </T.Mesh>
                                            {:then backTexture}
                                                <T.Mesh position={[0, 0, -0.001]} geometry={backGeometry}>
                                                    <T.MeshStandardMaterial
                                                        map={backTexture}
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
                                                    canvasError = `Failed to load back texture: ${error?.message ?? error}`;
                                                    addDebugLog(`Back texture loading error: ${error?.message ?? error}`, 'error');
                                                    return null;
                                                })()}
                                            {/await}
                                        {/key}
                                    {/if}

                                {#await Promise.all([
                                    frontImageUrl ? useTexture(frontImageUrl) : Promise.resolve(null),
                                    backImageUrl ? useTexture(backImageUrl) : Promise.resolve(null)
                                ])}
                                    <T.Group
                                        position={[0, 0, 0.01]}
                                        rotation={[0, 0, -rotationY * 4]}
                                        scale={[0.12 / responsiveSettings().modelScale, 0.12 / responsiveSettings().modelScale, 0.12 / responsiveSettings().modelScale]}
                                    >
                                        <T.Mesh>
                                            <T.RingGeometry args={[0.6, 0.8, 100, 1, 0, Math.PI * 1.5]} />
                                            <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                                        </T.Mesh>
                                    </T.Group>
                                    <T.Group
                                        position={[0, 0, -0.011]}
                                        rotation={[0, Math.PI, -rotationY * 4]}
                                        scale={[0.12 / responsiveSettings().modelScale, 0.12 / responsiveSettings().modelScale, 0.12 / responsiveSettings().modelScale]}
                                    >
                                        <T.Mesh>
                                            <T.RingGeometry args={[0.6, 0.8, 100, 1, 0, Math.PI * 1.5]} />
                                            <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.8} />
                                        </T.Mesh>
                                    </T.Group>
                                {:then textures}
                                    <!-- Loading completed, components are now rendered -->
                                {/await}

                                {#if edgeGeometry}
                                    <T.Mesh geometry={edgeGeometry}>
                                        <T.MeshStandardMaterial color="#ffffff" metalness={0} roughness={0.2} />
                                    </T.Mesh>
                                {/if}
                                </T.Group>
                            {/key}
                            </T.Scene>
                        </Canvas>
                    {:else}
                        <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                            <p class="text-gray-500 dark:text-gray-400">Loading 3D preview...</p>
                        </div>
                    {/if}
                </div>
            </div>
            <div class="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2">
                <button
                    type="button"
                    class="rounded-full bg-white/10 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 shadow-lg"
                    onclick={handleFlip}
                >
                    <span class="flex items-center gap-2">
                        🔄
                        <span>Flip Card</span>
                    </span>
                </button>
            </div>
        </div>
    </div>
{/if}