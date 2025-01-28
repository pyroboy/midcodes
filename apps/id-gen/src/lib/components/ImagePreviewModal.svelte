<script lang="ts">
    import { onMount } from 'svelte';
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { Mesh } from 'three'
    import { AsciiRenderer, OrbitControls } from '@threlte/extras'
    import * as THREE from 'three';

    // Enable proper color management
    THREE.ColorManagement.enabled = true;

    let { frontImageUrl = null, backImageUrl = null, onClose } = $props();
    let sceneState = $state({
        frontTextureLoaded: false,
        backTextureLoaded: false,
        meshInitialized: false,
        lastError: null as string | null
    });


    let canvasError: string | null = $state(null);
    let canvasInitialized = $state(false);
    let debugMode = $state(false);
    let modalRef: HTMLDialogElement | undefined = $state();

    let rotationY = $state(0);
    let animationFrameId: number | null = null;
    let autoRotateId: number | null = null;
    let isFlipping = false;
    let shouldAutoRotate = true;

    function easeInOutCubic(x: number): number {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function startAutoRotate() {
        if (!autoRotateId && !isFlipping && shouldAutoRotate) {
            function animate() {
                rotationY += 0.005;
                autoRotateId = requestAnimationFrame(animate);
            }
            autoRotateId = requestAnimationFrame(animate);
        }
    }

    function stopAutoRotate() {
        if (autoRotateId) {
            cancelAnimationFrame(autoRotateId);
            autoRotateId = null;
        }
    }

    function createRoundedRectCard(width = 2, height = 1.25, depth = 0.007, radius = 0.08) {
        const roundedRectShape = new THREE.Shape();
        
        const x = -width / 2;
        const y = -height / 2;
        const w = width;
        const h = height;
        const r = radius;

        roundedRectShape.moveTo(x + r, y);
        roundedRectShape.lineTo(x + w - r, y);
        roundedRectShape.bezierCurveTo(
            x + w - r/2, y,
            x + w, y + r/2,
            x + w, y + r
        );
        roundedRectShape.lineTo(x + w, y + h - r);
        roundedRectShape.bezierCurveTo(
            x + w, y + h - r/2,
            x + w - r/2, y + h,
            x + w - r, y + h
        );
        roundedRectShape.lineTo(x + r, y + h);
        roundedRectShape.bezierCurveTo(
            x + r/2, y + h,
            x, y + h - r/2,
            x, y + h - r
        );
        roundedRectShape.lineTo(x, y + r);
        roundedRectShape.bezierCurveTo(
            x, y + r/2,
            x + r/2, y,
            x + r, y
        );
        roundedRectShape.closePath();

        const extrudeSettings = {
            depth: depth,
            bevelEnabled: true,
            bevelThickness: 0.002,
            bevelSize: 0.002,
            bevelSegments: 2,
            steps: 1,
            curveSegments: 32
        };

        const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);
        
        const frontGeometry = new THREE.BufferGeometry();
        const backGeometry = new THREE.BufferGeometry();
        const edgeGeometry = new THREE.BufferGeometry();
        
        const position = geometry.getAttribute('position');
        const normal = geometry.getAttribute('normal');
        
        const frontPositions = [];
        const frontNormals = [];
        const frontUvs = [];
        const backPositions = [];
        const backNormals = [];
        const backUvs = [];
        const edgePositions = [];
        const edgeNormals = [];
        
        for (let i = 0; i < position.count; i++) {
            const normalZ = normal.getZ(i);
            const px = position.getX(i);
            const py = position.getY(i);
            const pz = position.getZ(i);
            const nx = normal.getX(i);
            const ny = normal.getY(i);
            const nz = normal.getZ(i);
            
            if (normalZ > 0.5) {
                frontPositions.push(px, py, pz);
                frontNormals.push(nx, ny, nz);
                frontUvs.push(
                    (px - x) / w,
                    1 - (py - y) / h
                );
            } else if (normalZ < -0.5) {
                backPositions.push(px, py, pz);
                backNormals.push(nx, ny, nz);
                backUvs.push(
                    1 - (px - x) / w,
                    1 - (py - y) / h
                );
            } else {
                edgePositions.push(px, py, pz);
                edgeNormals.push(nx, ny, nz);
            }
        }
        
        frontGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frontPositions, 3));
        frontGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(frontNormals, 3));
        frontGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(frontUvs, 2));
        
        backGeometry.setAttribute('position', new THREE.Float32BufferAttribute(backPositions, 3));
        backGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(backNormals, 3));
        backGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(backUvs, 2));
        
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
        edgeGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(edgeNormals, 3));
        
        return { frontGeometry, backGeometry, edgeGeometry };
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            onClose();
        } else if (event.key === 'd') {
            debugMode = !debugMode;
        }
    }

    function handleImageError(isFront: boolean, error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sceneState.lastError = `Error loading ${isFront ? 'front' : 'back'} image: ${errorMessage}`;
        canvasError = sceneState.lastError;
    }

    function createTexture(url: string): THREE.Texture {
        const texture = new THREE.TextureLoader().load(
            url,
            (tex) => {
                tex.flipY = false;
                tex.colorSpace = THREE.SRGBColorSpace;  // Explicitly set sRGB for color textures
                tex.repeat.set(1, 1);
                tex.center.set(0.5, 0.5);
                tex.magFilter = THREE.LinearFilter;
                tex.minFilter = THREE.LinearFilter;
                tex.needsUpdate = true;
                
                if (url === frontImageUrl) {
                    handleImageLoad(true);
                } else {
                    handleImageLoad(false);
                }
            },
            undefined,
            (error) => handleImageError(url === frontImageUrl, error)
        );
        return texture;
    }

    onMount(() => {
        startAutoRotate();
        if (modalRef) {
            modalRef.showModal();
        }
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            stopAutoRotate();
        };
    });

    function handleFlip() {
        stopAutoRotate();
        shouldAutoRotate = false;
        isFlipping = true;
        const startRotation = rotationY;
        const targetRotation = startRotation + Math.PI;
        let startTime: number | null = null;
        const duration = 1000;
        
        function animate(currentTime: number) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            rotationY = startRotation + (targetRotation - startRotation) * easeInOutCubic(progress);
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                rotationY = targetRotation;
                animationFrameId = null;
                isFlipping = false;
            }
        }
        
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function handleImageLoad(isFront: boolean) {
        if (isFront) {
            sceneState.frontTextureLoaded = true;
        } else {
            sceneState.backTextureLoaded = true;
        }
    }

    function handleModalClose(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('modal-backdrop')) {
            onClose();
        }
    }


</script>

<svelte:window onkeydown={handleKeydown} />

{#if frontImageUrl || backImageUrl}
<dialog
    bind:this={modalRef}
    class="modal-dialog"
    onclose={onClose}
    aria-labelledby="modal-title"
>
    <div 
        class="modal-backdrop"
        role="presentation"
        onclick={handleModalClose}
        onkeydown={handleKeydown}
    >
        <div 
            class="modal-content"
            role="document"
        >
            <h2 id="modal-title" class="sr-only">Card Preview</h2>
            
            <button 
                type="button"
                class="close-button"
                onclick={onClose}
                aria-label="Close preview">
                ✕
            </button>

            <div class="canvas-container">
                {#if canvasError}
                    <p class="error-message" role="alert">Error: {canvasError}</p>
                {/if}

                <Canvas  >
                        <T.Scene>
                            <T.Color attach="background" args={[0, 0, 0, 0]} transparent={true} />
                       
                        <T.PerspectiveCamera
                            makeDefault
                            position={[0,0,5]}
                    
                            
                            fov={35}
                        >
                        <OrbitControls enableDamping />
                        <T.HemisphereLight skyColor="#ffffff" groundColor="#ffffff"  intensity={0.2} />
                        <T.AmbientLight color={0xffffff} intensity={0.5} />
                        <T.DirectionalLight position={[5, 1.5, 5]} intensity={0.7} />
                        <T.DirectionalLight position={[-5, 3, 5]} intensity={0.3} color="#b1e1ff" />
                        <T.DirectionalLight position={[-6, -3, 3]} intensity={0.2} color="#ffecd1" />
                        <!-- <T.SpotLight position={[0, 0, 6]} intensity={100} color="#ffffff" /> -->
                        </T.PerspectiveCamera>
           
                        <T.Group rotation.y={rotationY}>
                            <!-- <T.RoundedBox radius={0.15} smoothness={16} castShadow rotation={[0, 0.5, 0]} position={[0, 0.705, 0]}>
                                <T.MeshTransmissionMaterial thickness={2} anisotropy={0.1} chromaticAberration={0.04} />
                              </T.RoundedBox> -->
                            {#if frontImageUrl}
                            <T is={Mesh}>
                                    <T.BufferGeometry

                                        oncreate={(ref) => {
                                            if (ref) {
                                                const { frontGeometry } = createRoundedRectCard();
                                                ref.copy(frontGeometry);
                                            }
                                            return () => {
                                                // Cleanup
                                            }
                                        }}
                                    />
                                    <T.MeshStandardMaterial
                                    envMap={null}
                                    color="#ffffff"
                                        map={createTexture(frontImageUrl)}
                                        metalness={0.1}
                                        roughness={0.1}
                            
                                    />
                                </T>
                            {/if}
                            {#if backImageUrl}
                            <T is={Mesh} position={[0, 0, -0.001]}>
                                <T.BufferGeometry
                                    oncreate={(ref) => {
                                        if (ref) {
                                            const { backGeometry } = createRoundedRectCard();
                                            ref.copy(backGeometry);
                                        }
                                        return () => {
                                            // Cleanup
                                        }
                                    }}
                                />
                              
                                <T.MeshStandardMaterial
                                    map={createTexture(backImageUrl)}
                                             envMap={null}
                                    metalness={0.1}
                                    roughness={0.1}
                                />
                            </T>
                            {/if}
                            <T.Mesh>
                                <T.BufferGeometry
                                    oncreate={(ref) => {
                                        if (ref) {
                                            const { edgeGeometry } = createRoundedRectCard();
                                            ref.copy(edgeGeometry);
                                        }
                                        return () => {
                                            // Cleanup
                                        }
                                    }}
                                />
                                <T.MeshStandardMaterial
                                    color="#ffffff"
                                    metalness={0}
                                    roughness={0.2}
                                />
                            </T.Mesh>
                        </T.Group>
                    </T.Scene>
                </Canvas>
            </div>

            <div class="controls">
                <button 
                    type="button"
                    class="control-button"
                    onclick={handleFlip}
                    aria-label="Flip card to see {rotationY > Math.PI ? 'front' : 'back'} side">
                    Flip Card
                </button>
                {#if debugMode}
                    <div 
                        class="debug-overlay" 
                        role="status" 
                        aria-label="Debug information"
                    >
                        <pre>
Canvas: {canvasInitialized ? '✓' : '✗'}
Mesh: {sceneState.meshInitialized ? '✓' : '✗'}
Front Texture: {sceneState.frontTextureLoaded ? '✓' : '✗'}
Back Texture: {sceneState.backTextureLoaded ? '✓' : '✗'}
Last Error: {sceneState.lastError || 'None'}
                        </pre>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</dialog>
{/if}

<style lang="postcss">
    .modal-dialog {
        @apply fixed inset-0 p-0 m-0 w-full h-full bg-transparent;
        border: none;
        &::backdrop {
            @apply bg-background/60 backdrop-blur-[2px];
        }
    }

    .modal-backdrop {
        @apply h-full w-full grid place-items-center p-4;
    }

    .modal-content {
        @apply rounded-lg max-w-2xl w-full relative bg-transparent;
        height: 80vh;
        min-height: 300px;
    }

    .canvas-container {
        @apply relative w-full h-full rounded-lg overflow-hidden;
        background-color: transparent;
    }

    .debug-overlay {
        @apply absolute top-4 left-4 bg-black/80 text-white p-3 rounded-md z-10;
        font-family: monospace;
        pointer-events: none;
        font-size: 12px;
        max-width: 300px;
    }

    pre {
        @apply m-0 whitespace-pre-wrap;
    }

    .close-button {
        @apply absolute top-2 right-2 p-2 hover:bg-muted rounded-full z-10 transition-colors;
        background: rgba(0, 0, 0, 0.5);
        color: white;
    }

    .close-button:focus-visible {
        @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
    }

    .controls {
        @apply absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10;
    }

    .control-button {
        @apply px-4 py-2 bg-primary text-primary-foreground rounded-md 
               hover:bg-primary/90 transition-colors
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
               focus-visible:ring-offset-2 focus-visible:ring-offset-background;
    }

    .error-message {
        @apply absolute top-4 left-4 bg-destructive text-destructive-foreground 
               px-4 py-2 rounded-md z-10;
    }

    .sr-only {
        @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
        clip: rect(0, 0, 0, 0);
        clip-path: inset(50%);
    }
</style>