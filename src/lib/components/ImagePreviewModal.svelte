<script lang="ts">
    import { onMount } from 'svelte';
    import { Canvas } from '@threlte/core';
    import { T } from '@threlte/core';
    import { OrbitControls } from '@threlte/extras';
    import * as THREE from 'three';

    export let frontImageUrl: string | null = null;
    export let backImageUrl: string | null = null;
    export let onClose: () => void;

    let meshRef: THREE.Mesh;
    let canvasError: string | null = null;
    let canvasInitialized = false;
    let debugMode = false;

    // Animation state
    let rotationY = 0;
    let animationFrameId: number;
    let isAnimating = false;

    // Scene state tracking
    let sceneState = {
        frontTextureLoaded: false,
        backTextureLoaded: false,
        meshInitialized: false,
        lastError: null as string | null
    };

    function createRoundedRectCard(width = 2, height = 1.25, depth = 0.005, radius = 0.08) {
        // Create a flat rounded rectangle shape
        const roundedRectShape = new THREE.Shape();
        
        const x = -width / 2;
        const y = -height / 2;
        const w = width;
        const h = height;
        const r = radius;

        // Start at top left corner and draw clockwise
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

        // Extrusion settings
        const extrudeSettings = {
            depth: depth,
            bevelEnabled: false,
            steps: 1,
            curveSegments: 32
        };

        const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);
        
        // Create separate geometries for front and back faces
        const frontGeometry = new THREE.BufferGeometry();
        const backGeometry = new THREE.BufferGeometry();
        
        const position = geometry.getAttribute('position');
        const normal = geometry.getAttribute('normal');
        
        const frontPositions = [];
        const frontNormals = [];
        const frontUvs = [];
        const backPositions = [];
        const backNormals = [];
        const backUvs = [];
        
        // Separate vertices based on normal direction
        for (let i = 0; i < position.count; i++) {
            const normalZ = normal.getZ(i);
            const px = position.getX(i);
            const py = position.getY(i);
            
            if (normalZ > 0.5) {
                // Front face
                frontPositions.push(px, py, position.getZ(i));
                frontNormals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
                frontUvs.push(
                    (px - x) / w,  // U coordinate
                    1 - (py - y) / h  // V coordinate, flipped to match image coordinates
                );
            } else if (normalZ < -0.5) {
                // Back face
                backPositions.push(px, py, position.getZ(i));
                backNormals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
                backUvs.push(
                    1 - (px - x) / w,  // U coordinate, flipped for back face
                    1 - (py - y) / h   // V coordinate, flipped to match image coordinates
                );
            }
        }
        
        frontGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frontPositions, 3));
        frontGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(frontNormals, 3));
        frontGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(frontUvs, 2));
        
        backGeometry.setAttribute('position', new THREE.Float32BufferAttribute(backPositions, 3));
        backGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(backNormals, 3));
        backGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(backUvs, 2));
        
        return { frontGeometry, backGeometry };
    }

    function handleCanvasCreated() {
        canvasInitialized = true;
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

    onMount(() => {
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    });

    function handleFlip() {
        isAnimating = true;
        const targetRotation = rotationY + Math.PI;
        
        function animate() {
            const step = 0.15;
            const difference = targetRotation - rotationY;
            
            if (Math.abs(difference) > step) {
                rotationY += step * Math.sign(difference);
                animationFrameId = requestAnimationFrame(animate);
            } else {
                rotationY = targetRotation;
                isAnimating = false;
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
</script>

<svelte:window on:keydown={handleKeydown} />

{#if frontImageUrl || backImageUrl}
<div class="modal-wrapper">
    <div class="modal-content">
        <button 
            type="button"
            class="close-button"
            on:click={onClose}
            aria-label="Close preview">
            ✕
        </button>

        <div class="canvas-container">
            {#if canvasError}
                <p class="error-message">Error: {canvasError}</p>
            {/if}

            <Canvas 
                shadows 
                on:created={handleCanvasCreated}
            >
                <T.Scene>
                    <T.Color attach="background" args={[0x1a1a1a]} />
                </T.Scene>
                
                <T.PerspectiveCamera 
                    position={[0, 0, 3]} 
                    fov={50}
                    makeDefault
                >
                    <OrbitControls 
                        enableZoom={true}
                        enablePan={true}
                        enableRotate={true}
                        target={[0, 0, 0]}
                        maxDistance={5}
                        minDistance={1}
                    />
                </T.PerspectiveCamera>

                <T.AmbientLight intensity={0.7} />
                <T.DirectionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
                <T.DirectionalLight position={[-5, 5, -5]} intensity={0.3} />
                <T.PointLight position={[0, 3, 0]} intensity={0.3} />

                {#if debugMode}
                    <T.GridHelper args={[10, 10]} />
                    <T.AxesHelper args={[5]} />
                {/if}

                <T.Group rotation.y={rotationY}>
                    {#if frontImageUrl}
                        <T.Mesh 
                            bind:ref={meshRef}
                            castShadow
                            receiveShadow
                        >
                            <T.BufferGeometry
                                on:create={({ ref }) => {
                                    const { frontGeometry } = createRoundedRectCard();
                                    ref.copy(frontGeometry);
                                    sceneState.meshInitialized = true;
                                }}
                            />
                            <T.MeshStandardMaterial
                                map={new THREE.TextureLoader().load(
                                    frontImageUrl,
                                    (texture) => {
                                        texture.flipY = false;
                                        texture.encoding = THREE.sRGBEncoding;
                                        texture.repeat.set(1, 1);
                                        texture.center.set(0.5, 0.5);
                                        texture.needsUpdate = true;
                                        handleImageLoad(true);
                                    },
                                    undefined,
                                    (error) => handleImageError(true, error)
                                )}
                                transparent={true}
                                metalness={0}
                                roughness={0}
                                envMapIntensity={1}
                            />
                        </T.Mesh>
                    {/if}
                    
                    <T.Mesh 
                        castShadow
                        receiveShadow
                    >
                        <T.BufferGeometry
                            on:create={({ ref }) => {
                                const { backGeometry } = createRoundedRectCard();
                                ref.copy(backGeometry);
                            }}
                        />
                        {#if backImageUrl}
                            <T.MeshStandardMaterial
                                map={new THREE.TextureLoader().load(
                                    backImageUrl,
                                    (texture) => {
                                        texture.flipY = false;
                                        texture.encoding = THREE.sRGBEncoding;
                                        texture.repeat.set(1, 1);
                                        texture.center.set(0.5, 0.5);
                                        texture.needsUpdate = true;
                                        handleImageLoad(false);
                                    },
                                    undefined,
                                    (error) => handleImageError(false, error)
                                )}
                                transparent={true}
                                metalness={0}
                                roughness={0}
                                envMapIntensity={1}
                            />
                        {:else}
                            <T.MeshStandardMaterial
                                color="#e24a4a"
                                transparent={true}
                                metalness={0}
                                roughness={0.2}
                                opacity={0.95}
                            />
                        {/if}
                    </T.Mesh>
                </T.Group>
            </Canvas>
        </div>

        <div class="controls">
            <button 
                type="button"
                class="control-button"
                on:click={handleFlip}
                disabled={isAnimating}>
                Flip Card
            </button>
            {#if debugMode}
                <div class="debug-overlay">
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
{/if}

<style lang="postcss">
    .modal-wrapper {
        @apply fixed inset-0 z-50 bg-background/80 backdrop-blur-sm;
        display: grid;
        place-items: center;
    }

    .modal-content {
        @apply bg-card rounded-lg shadow-lg max-w-2xl w-full mx-4 relative;
        height: 80vh;
    }

    .canvas-container {
        @apply relative w-full h-full;
        background-color: #1a1a1a;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .debug-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 4px;
        z-index: 1000;
        font-family: monospace;
        pointer-events: none;
        font-size: 12px;
    }

    pre {
        margin: 0;
        white-space: pre-wrap;
    }

    .close-button {
        @apply absolute top-2 right-2 p-2 hover:bg-muted rounded-full z-10;
        background: rgba(0, 0, 0, 0.5);
        color: white;
    }

    .controls {
        @apply absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2;
    }

    .control-button {
        @apply px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50;
    }

    .error-message {
        @apply absolute top-4 left-4 bg-destructive text-destructive-foreground px-4 py-2 rounded;
        z-index: 1000;
    }
</style>