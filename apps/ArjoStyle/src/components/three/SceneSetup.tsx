// src/components/three/SceneSetup.tsx

import React, {
    Suspense,
    useEffect,
    useRef,
    useState,
    useCallback,
    CSSProperties,
    useLayoutEffect, // Use useLayoutEffect for DOM measurements/sync changes
    memo,
} from 'react';
import { Canvas, RootState } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type PerformanceLevel = 'high' | 'medium' | 'low';

interface SceneSetupProps {
    editMode: boolean;
    children: React.ReactNode;
    cameraPosition?: [number, number, number];
    cameraFov?: number;
    controlsTarget?: [number, number, number];
    onControlsChange?: (e?: THREE.Event) => void; // Callback for controls interaction
    onCreated?: (state: RootState) => void;       // Callback when canvas context is ready
    isMinimized?: boolean;                      // Hint for performance reduction
    priority?: boolean;                         // Hint for WebGL context powerPreference
    isContainerResizing?: boolean;              // Flag indicating parent container resize
}

const SceneSetup: React.FC<SceneSetupProps> = memo(({ // Memoize SceneSetup
    editMode,
    children,
    cameraPosition = [0, 0.5, 3], // Default camera position
    cameraFov = 45,               // Default field of view
    controlsTarget = [0, 0.5, 0], // Default point for controls to orbit around
    onControlsChange,
    onCreated,
    isMinimized = false,
    isContainerResizing = false,
    priority = false, // Default priority
}) => {
    // --- State ---
    const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>('medium');
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null); // Stores the Data URL for the snapshot image
    const [isCanvasHidden, setIsCanvasHidden] = useState(false);          // Controls canvas CSS visibility during resize transition
    const [isInitialRender, setIsInitialRender] = useState(true);         // Track if this is the first render cycle

    // --- Refs ---
    const glRef = useRef<THREE.WebGLRenderer | null>(null); // Ref to the renderer instance
    const sceneRef = useRef<THREE.Scene | null>(null);     // Ref to the THREE.Scene
    const cameraRef = useRef<THREE.Camera | null>(null);   // Ref to the THREE.Camera
    const invalidateRef = useRef<(() => void) | null>(null); // Ref to R3F's invalidate function for manual redraw requests
    const snapshotTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Ref for cleanup timeout

    // --- Callbacks ---
    // Called once the R3F Canvas context is created
    const handleCanvasCreated = useCallback((state: RootState) => {
        glRef.current = state.gl;
        invalidateRef.current = state.invalidate;
        sceneRef.current = state.scene;
        cameraRef.current = state.camera;

        // Assign controls to refs if needed elsewhere (though usually accessed via useThree)
        // controlsRef.current = state.controls;

        if (onCreated) {
            onCreated(state); // Pass the state up to the parent component
        }

        // Request an initial render if the canvas starts visible
        if (!isContainerResizing && !isMinimized) {
            state.invalidate();
            console.log("[SceneSetup] Initial invalidate requested.");
        } else {
             console.log("[SceneSetup] Initial invalidate skipped (resizing/minimized).");
        }
    }, [onCreated, isContainerResizing, isMinimized]); // Dependencies for the creation callback

    // --- Effects ---
    // Set initial render flag
    useEffect(() => {
        setIsInitialRender(false); // Mark initial render as complete after the first mount/render cycle
        // No cleanup needed here
    }, []);

    // Adjust performance level based on minimization state
    useEffect(() => {
        if (isMinimized) {
            setPerformanceLevel('low');
        } else if (performanceLevel === 'low') {
            // Restore to medium if previously minimized
            setPerformanceLevel('medium');
        }
        // Trigger redraw if minimizing/restoring changes performance settings
        if (invalidateRef.current) {
            invalidateRef.current();
        }
    }, [isMinimized, performanceLevel]); // Rerun when minimized state changes

    // Cleanup snapshot timeout on unmount
    useEffect(() => {
        return () => {
            if (snapshotTimeoutRef.current) {
                clearTimeout(snapshotTimeoutRef.current);
            }
        };
    }, []);

    // Handle container resizing state changes using a snapshot strategy
    useLayoutEffect(() => {
        const gl = glRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;

        // Ensure refs are available
        if (!gl || !scene || !camera) {
             console.log("[SceneSetup Resize] Refs not ready, skipping snapshot logic.");
             return;
        }

        const canvas = gl.domElement; // Get canvas from renderer

        // --- Clear any pending snapshot removal timeout ---
        if (snapshotTimeoutRef.current) {
            clearTimeout(snapshotTimeoutRef.current);
            snapshotTimeoutRef.current = null;
        }

        // --- Skip snapshot logic during the very first render cycle ---
        // This prevents taking a snapshot before content has loaded/rendered
        if (isInitialRender) {
            console.log("[SceneSetup Resize] Initial render, skipping snapshot.");
            setIsCanvasHidden(false); // Ensure canvas is visible initially
            setSnapshotUrl(null);   // Ensure no old snapshot is shown
            return;
        }

        if (isContainerResizing) {
            // --- START RESIZING: Take Snapshot & Hide Canvas ---
            console.log("[SceneSetup Resize] Start resizing - taking snapshot.");

            // Check if canvas has valid dimensions before taking snapshot
            if (canvas.width > 0 && canvas.height > 0) {
                try {
                    // --- Force a Synchronous Render ---
                    // This is crucial to ensure the canvas contains the latest frame
                    // *before* we capture it with toDataURL.
                    gl.render(scene, camera);

                    // --- Take Snapshot ---
                    // preserveDrawingBuffer: true must be set on the Canvas for this to work reliably.
                    const dataUrl = gl.domElement.toDataURL('image/png'); // Use PNG for potential transparency
                    setSnapshotUrl(dataUrl); // Display the snapshot image

                    // --- Hide Canvas (after state update) ---
                    // Use requestAnimationFrame to ensure the snapshot state update has been processed
                    // and the img element is likely rendered before hiding the canvas.
                    requestAnimationFrame(() => {
                        setIsCanvasHidden(true);
                        console.log("[SceneSetup Resize] Canvas hidden.");
                    });

                } catch (error) {
                    console.error("[SceneSetup Resize] Error taking snapshot:", error);
                    // Fallback: Hide canvas even if snapshot failed
                    setIsCanvasHidden(true);
                    setSnapshotUrl(null); // Ensure no broken image is shown
                }
            } else {
                // Canvas not ready (zero dimensions), just hide it without snapshot
                console.warn("[SceneSetup Resize] Canvas has zero dimensions, hiding without snapshot.");
                setIsCanvasHidden(true);
                setSnapshotUrl(null);
            }
        } else {
            // --- STOP RESIZING: Show Canvas & Remove Snapshot ---
             console.log("[SceneSetup Resize] Stop resizing - showing canvas.");
             // --- Show Canvas Immediately ---
            setIsCanvasHidden(false);

            // --- Request Redraw ---
            // Ask R3F to render a new frame into the now visible canvas.
            if (invalidateRef.current) {
                // Use rAF to ensure the canvas is visible *before* invalidating.
                 requestAnimationFrame(() => {
                     if (invalidateRef.current) {
                        invalidateRef.current();
                        console.log("[SceneSetup Resize] Invalidate requested after resize.");
                     }
                     // --- Remove Snapshot (with a small delay) ---
                     // Wait briefly after invalidating to allow the new frame to render,
                     // then remove the snapshot image for a smoother transition.
                     snapshotTimeoutRef.current = setTimeout(() => {
                         setSnapshotUrl(null);
                         console.log("[SceneSetup Resize] Snapshot removed.");
                     }, 50); // 50ms delay (adjust if needed)
                 });
            } else {
                 // Fallback if invalidate isn't ready (should be rare after creation)
                 console.warn("[SceneSetup Resize] Invalidate ref not available on resize end.");
                 snapshotTimeoutRef.current = setTimeout(() => {
                     setSnapshotUrl(null);
                 }, 100); // Longer fallback delay
            }
        }
        // This layout effect depends on the resizing flag and the initial render state.
        // It also implicitly depends on the refs being populated.
    }, [isContainerResizing, isInitialRender]);

    // --- Derived Values ---
    // Determine if rendering should be paused based on minimization or resizing state
    const isRenderingEffectivelyPaused = isMinimized || isCanvasHidden;
    // Set frameloop mode based on pause state ('demand' stops automatic rendering)
    const frameLoopMode = isRenderingEffectivelyPaused ? 'demand' : 'always';
    // Adjust device pixel ratio based on performance level
    const pixelRatio = performanceLevel === 'high' ? Math.min(window.devicePixelRatio, 2) :
                       performanceLevel === 'medium' ? Math.min(window.devicePixelRatio, 1.5) : 1;

    // --- Styles ---
    const containerStyle: CSSProperties = {
        position: 'relative', // Needed for absolute positioning of canvas/snapshot
        width: '100%',
        height: '100%',
        background: '#f0f0f0', // Background color for the container
        overflow: 'hidden'     // Prevent content spillover
    };

    const baseLayerStyle: CSSProperties = { // Common styles for canvas and snapshot
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none', // Prevent text selection on canvas/image
    };

    const canvasStyle: CSSProperties = {
        ...baseLayerStyle,
        visibility: isCanvasHidden ? 'hidden' : 'visible', // Control visibility directly
        opacity: isCanvasHidden ? 0 : 1,                 // Fade out/in
        transition: 'opacity 0.1s linear',             // Faster transition for less perceived delay
        background: 'transparent',                         // Ensure canvas background is transparent
        zIndex: 1,                                         // Canvas is below snapshot
        willChange: 'opacity',                             // Hint browser about opacity changes
    };

    const snapshotStyle: CSSProperties = {
        ...baseLayerStyle,
        zIndex: 10,                                        // Snapshot is on top
        objectFit: 'cover',                                // Cover the area, might crop
        pointerEvents: 'none',                             // Allow interactions with elements below (if any)
        display: snapshotUrl ? 'block' : 'none',           // Show only if URL exists
        opacity: snapshotUrl && !isCanvasHidden ? 1 : 0,   // Fade in/out (fade out slightly before canvas fades in)
        transition: 'opacity 0.1s linear',             // Match canvas transition speed
        willChange: 'opacity',                             // Hint browser
        imageRendering: 'pixelated', // or 'auto' - 'pixelated' can look sharper during scale
    };

    // --- Render ---
    return (
        <div style={containerStyle}>
            {/* Snapshot Overlay - Rendered only when URL is available and not initial render */}
            {snapshotUrl && !isInitialRender && (
                <img
                    // Using Date.now() in key might be excessive, but ensures refresh if URL is somehow the same but content changed.
                    // Consider a more stable key if possible.
                    key={`snapshot-${snapshotUrl.length}`}
                    src={snapshotUrl}
                    alt="Scene Snapshot"
                    style={snapshotStyle}
                    aria-hidden="true" // Decorative image
                />
            )}

            {/* The 3D Canvas */}
            <Canvas
                style={canvasStyle}
                frameloop={frameLoopMode} // Control render loop based on state
                dpr={pixelRatio}          // Control pixel density for performance
                camera={{                  // Initial camera settings
                    position: cameraPosition as [number, number, number], // Explicit cast
                    fov: cameraFov,
                    near: 0.1,
                    far: 1000
                }}
                gl={{                      // WebGL context settings
                    alpha: true,             // Allow transparent background
                    antialias: false, // Disable AA when paused/hidden
                    outputColorSpace: THREE.SRGBColorSpace, // Correct color space
                    preserveDrawingBuffer: true, // *** Required for toDataURL snapshots ***
                    powerPreference: priority ? 'high-performance' : 'default', // Hint GPU usage
                }}
                onCreated={handleCanvasCreated} // Callback when context is ready
                 shadows // Enable shadows globally if needed, can be overridden per light/mesh
            >
                {/* Controls - enable based on editMode and pause state */}
                <OrbitControls
                    enabled={editMode && !isRenderingEffectivelyPaused}
                    enablePan={editMode && !isRenderingEffectivelyPaused}
                    enableZoom={!isMinimized}
                    enableDamping={true}
                    dampingFactor={0.1}
                    minDistance={0.5}
                    maxDistance={20}
                    // *** FIX: Explicitly cast controlsTarget to the expected tuple type ***
                    target={controlsTarget as [number, number, number]}
                    onChange={onControlsChange}
                    makeDefault
                 />

                 {/* Lighting - Simplified setup, adjust as needed */}
                 {/* Use simpler lighting when paused to save resources */}
                 {isRenderingEffectivelyPaused ? (
                     <ambientLight intensity={1.0} /> // Basic ambient light when paused
                 ) : (
                     <>
                         <ambientLight intensity={0.7} />
                         <directionalLight
                            // *** FIX: Explicitly cast position to the expected tuple type ***
                             position={[5, 10, 7.5] as [number, number, number]}
                             intensity={1.0}
                      
                         />
                         <directionalLight
                             // *** FIX: Explicitly cast position to the expected tuple type ***
                             position={[-5, 5, -7.5] as [number, number, number]}
                             intensity={0.3}
                         /> {/* Fill light */}
                         {/* Optional: Environment map for reflections/ambient light */}
                         {/* <Environment preset="city" /> */}
                     </>
                 )}

                {/* Scene Content - Render children within Suspense for async loading */}
                <Suspense fallback={null}>
                    {children}
                </Suspense>

            </Canvas>
        </div>
    );
}); // End SceneSetup Component Memo

export default SceneSetup;