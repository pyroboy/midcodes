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

            <div class="h-[80vh] w-full">
                {#if canvasError}
                    <p class="absolute inset-0 flex items-center justify-center bg-red-500/10 text-red-400" role="alert">
                        Error: {canvasError}
                    </p>
                {/if}

                <Canvas>
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

            <div class="absolute bottom-6 left-1/2 -translate-x-1/2">
                <button 
                    type="button"
                    class="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    onclick={handleFlip}
                >
                    Flip Card
                </button>
            </div>

            {#if debugMode}
                <div 
                    class="fixed bottom-4 right-4 rounded-md bg-black/50 p-4 text-xs font-mono text-white backdrop-blur-sm" 
                    role="status" 
                >
                    <pre>
Canvas: {canvasInitialized ? '✓' : '✗'}
Mesh: {sceneState.meshInitialized ? '✓' : '✗'}
Front: {sceneState.frontTextureLoaded ? '✓' : '✗'}
Back: {sceneState.backTextureLoaded ? '✓' : '✗'}
Error: {sceneState.lastError || 'None'}
                    </pre>
                </div>
            {/if}
        </div>
    </div>
</div>
{/if}
