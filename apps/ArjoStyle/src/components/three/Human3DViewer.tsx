// src/components/three/Human3DViewer.tsx
import React, {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
    memo,
  } from "react";
  import * as THREE from "three";
  import { useThree, useFrame, ThreeEvent, RootState } from "@react-three/fiber";
  import SceneSetup from "./SceneSetup";
  import { Model } from "./Model";
  import { HighlightSphere } from "./HighlightSphere";
  import { BodyPartMapping } from "@/types/mapping"; // Assuming this type definition exists
  import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
  import { usePainHighlightStyle } from "@/hooks/usePainHighlightStyle"; // Assuming this hook exists
  import { Text } from "@react-three/drei"
  
  interface Human3DViewerProps {
    modelUrl: string | undefined;
    isColor: boolean;
    mapping: BodyPartMapping | null | undefined;
    editMode: boolean;
    onMappingUpdate: (
      category: string,
      placement: string,
      update: Partial<BodyPartMapping>
    ) => void;
    selectedCategory: string | null;
    currentPlacement: string | null;
    onCanvasCreated?: (canvas: HTMLCanvasElement) => void;
    isContainerResizing: boolean;
    size?: number; // Optional size prop for scaling
  }
  
  // --- Constants ---
  const ANIMATION_DURATION = 1000;
  const TARGET_SMOOTHING_FACTOR = 5; // For camera target smoothing
  const POSITION_THRESHOLD = 0.01;
  const CAMERA_UPDATE_DEBOUNCE_MS = 50;
  const SQUARE_INCHES_TO_SCALE_FACTOR = 0.05;
  const SCALE_ANIMATION_SPEED = 3;         // Speed of pulsating animation
  const SCALE_ANIMATION_AMPLITUDE_FACTOR = 0.15; // How much it pulsates
  const MIN_ANIMATION_BASE_SCALE = 0.05;   // Smallest base size for pulsation if mapping.scale is missing/zero
  const MIN_TARGET_SCALE = 0.001;          // Smallest scale target (prevents full disappearance unless intended)
  const INITIAL_VISIBILITY_DELAY_MS = 1100; // Delay before fade-in starts
  
  // --- Helper Functions ---
  function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }
  
  function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return ((...args: unknown[]) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), wait);
    }) as T;
  }
  
  // Calculates target camera position based on mapping data or fallback
  const calculateTargetCameraPosition = (
    targetPoint: THREE.Vector3,
    mapping: BodyPartMapping | null | undefined
  ): THREE.Vector3 => {
    const fallbackOffset = new THREE.Vector3(0, 0.5, 1.5); // Default camera offset
    if (!mapping) return targetPoint.clone().add(fallbackOffset);
  
    const {
      cameraAzimuth = 0,
      cameraPolar = Math.PI / 2,
      cameraDistance = 1.5,
    } = mapping;
  
    // Validate and clamp mapping values
    const safeAzimuth = typeof cameraAzimuth === "number" && isFinite(cameraAzimuth)
        ? cameraAzimuth
        : 0;
    const safePolar = typeof cameraPolar === "number" && isFinite(cameraPolar)
        ? Math.max(0.01, Math.min(Math.PI - 0.01, cameraPolar)) // Avoid gimbal lock extremes
        : Math.PI / 2;
    const safeDistance = typeof cameraDistance === "number" && isFinite(cameraDistance)
        ? Math.max(0.5, cameraDistance) // Minimum distance
        : 1.5;
  
    // Calculate offset from spherical coordinates
    const offsetX = safeDistance * Math.sin(safePolar) * Math.sin(safeAzimuth);
    const offsetY = safeDistance * Math.cos(safePolar);
    const offsetZ = safeDistance * Math.sin(safePolar) * Math.cos(safeAzimuth);
  
    const targetCameraPos = targetPoint.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));
  
    // Final check for NaN/Infinity issues
    if (!isFinite(targetCameraPos.x) || !isFinite(targetCameraPos.y) || !isFinite(targetCameraPos.z)) {
      console.warn("Calculated target camera position is non-finite, using fallback.", mapping);
      return targetPoint.clone().add(fallbackOffset);
    }
    return targetCameraPos;
  };
  
  // --- MODIFIED: Determines the target scale for HighlightSphere ---
  // This function NO LONGER calculates the *instantaneous* pulsating scale.
  // It calculates the static target scale based on props/mapping, OR the *base* scale for pulsation.
  const getTargetScaleBase = (
      mapping: BodyPartMapping | null | undefined,
      propSize: number | undefined,
      editMode: boolean
  ): number => {
      const mappingScale =
          typeof mapping?.scale === 'number' && isFinite(mapping.scale) && mapping.scale > 0
              ? mapping.scale
              : 0; // Use 0 if invalid or not present
  
      // Case 1: Size prop is provided and valid ( > 0)
      if (typeof propSize === 'number' && isFinite(propSize) && propSize > 0) {
          const calculatedScale = SQUARE_INCHES_TO_SCALE_FACTOR * Math.sqrt(propSize);
          return Math.max(MIN_TARGET_SCALE, calculatedScale); // Ensure minimum visibility
      }
      // Case 2: Size prop is explicitly 0 (requesting pulsating animation in view mode)
      else if (propSize === 0 && !editMode) {
          // Return the BASE scale for the animation.
          // Use mapping scale if available, otherwise fallback to min animation scale.
          return Math.max(MIN_TARGET_SCALE, mappingScale > 0 ? mappingScale : MIN_ANIMATION_BASE_SCALE);
      }
      // Case 3: Edit mode OR size prop is undefined/null/negative (use mapping scale or default)
      else {
          // In edit mode, default to 1 if no mapping scale. In view mode, default to 0 if no size/mapping.
          const defaultScale = editMode ? 1 : 0;
          const effectiveScale = mappingScale > 0 ? mappingScale : defaultScale;
          // Ensure minimum scale, especially if defaulting to 0 in view mode but mapping exists
          return Math.max(effectiveScale > 0 ? MIN_TARGET_SCALE : 0, effectiveScale);
      }
  };
  
  
  // --- ViewerContents Component ---
  const ViewerContents: React.FC<
    Omit<Human3DViewerProps, "onCanvasCreated" | "isContainerResizing">
  > = memo(({ // Memoize ViewerContents as well
    modelUrl,
    isColor,
    mapping,
    editMode,
    onMappingUpdate,
    selectedCategory,
    currentPlacement,
    size,
  }) => {
    const { camera, controls, gl, raycaster, pointer, clock } = useThree(); // Added clock
  
    const modelGroupRef = useRef<THREE.Group | null>(null);
    const highlightMeshRef = useRef<THREE.Mesh>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [hasLoadError, setHasLoadError] = useState(false);
  
    const [initialVisibilityFactor, setInitialVisibilityFactor] = useState(0); // For fade-in
  
    // Refs for camera animation state
    const isAnimatingCameraRef = useRef(false);
    const animationStartTimeRef = useRef<number>(0);
    const animationStartDataRef = useRef<{ cameraPos: THREE.Vector3; targetPos: THREE.Vector3 } | null>(null);
    const smoothedTargetPointRef = useRef<THREE.Vector3 | null>(null); // For camera target lerp
    const smoothedTargetCameraPosRef = useRef<THREE.Vector3 | null>(null); // For camera position lerp
  
    // Refs for highlight drag state
    const isDraggingHighlightRef = useRef(false);
    const dragTypeRef = useRef<"position" | "scale" | null>(null);
    const dragStartPointRef = useRef(new THREE.Vector3()); // World point where drag started
    const dragStartScaleDataRef = useRef<{ distance: number; scale: number } | null>(null); // Data for scaling drag
  
    // --- Calculated Highlight Style ---
    const { color: highlightColor, opacity: baseHighlightOpacity } = usePainHighlightStyle(mapping, editMode);
  
    // --- Effect for Initial Visibility Fade-in Timer ---
    useEffect(() => {
      let timerId: NodeJS.Timeout | null = null;
      if (isModelLoaded && !hasLoadError) {
        // Reset factor and start timer only if model is loaded and no error
        setInitialVisibilityFactor(0);
        timerId = setTimeout(() => {
          if (isModelLoaded && !hasLoadError) { // Double check state before setting factor
             setInitialVisibilityFactor(1);
          }
        }, INITIAL_VISIBILITY_DELAY_MS);
      } else {
        // If model not loaded or error occurs, immediately reset visibility factor
        setInitialVisibilityFactor(0);
      }
      // Cleanup function
      return () => {
        if (timerId) clearTimeout(timerId);
      };
    }, [isModelLoaded, hasLoadError]); // Depend only on load/error state
  
  
    // --- Final Opacity & Scale passed to HighlightSphere ---
    // Incorporates the initial fade-in factor
    const finalHighlightOpacity = baseHighlightOpacity * initialVisibilityFactor;
  
    // Calculate the base target scale using the helper
    const targetScaleBase = useMemo(() => getTargetScaleBase(mapping, size, editMode), [mapping, size, editMode]);
  
    // State to hold the potentially animated target scale
    const [animatedTargetScale, setAnimatedTargetScale] = useState(targetScaleBase);
  
    // --- Effect to Update Sphere Position Directly (and reset scale state if mapping changes drastically) ---
    useEffect(() => {
      if (highlightMeshRef.current && mapping) {
        const mesh = highlightMeshRef.current;
        const isValidPosition =
          Array.isArray(mapping.position) &&
          mapping.position.length === 3 &&
          mapping.position.every((n) => typeof n === "number" && isFinite(n));
  
        if (isValidPosition) {
           const positionArray = mapping.position as [number, number, number];
           // Set position directly - this should not be lerped typically
           mesh.position.set(positionArray[0], positionArray[1], positionArray[2]);
        } else {
           // Default or log error if position is invalid
           mesh.position.set(0, 0, 0);
           console.warn("Invalid mapping position received:", mapping.position);
        }
  
        // Update the base scale immediately if mapping/size/mode changes
        const newBaseScale = getTargetScaleBase(mapping, size, editMode);
        setAnimatedTargetScale(newBaseScale); // Reset animated scale to the new base
  
      } else if (highlightMeshRef.current) {
         // No mapping, ensure sphere is effectively hidden by setting target scale to 0
         setAnimatedTargetScale(0);
      }
    }, [mapping, size, editMode]); // Re-run when these core props change
  
  
    // --- Model Load/Error Callbacks ---
    const handleModelLoad = useCallback((model: THREE.Group) => {
        modelGroupRef.current = model; // Store reference if needed elsewhere
        setIsModelLoaded(true);
        setHasLoadError(false);
        console.log("[ViewerContents] Model Loaded:", modelUrl);
      },[modelUrl]); // Dependency on modelUrl is correct
  
    const handleModelError = useCallback((error: Error | unknown) => {
        console.error("[ViewerContents] Model load error:", error, modelUrl);
        setIsModelLoaded(false);
        setHasLoadError(true);
        modelGroupRef.current = null; // Clear ref on error
      }, [modelUrl]); // Dependency on modelUrl is correct
  
  
    // --- Effect: Camera Positioning and Animation Trigger ---
    useEffect(() => {
      const orbitControls = controls as OrbitControlsImpl | null;
  
      // Conditions to abort or skip camera updates
      if (!orbitControls || !mapping || !isModelLoaded || hasLoadError || !camera) {
        if (isAnimatingCameraRef.current) { // Reset animation state if it was running
          isAnimatingCameraRef.current = false;
          animationStartDataRef.current = null;
          // Ensure controls are re-enabled if they were disabled for animation
          if (orbitControls && !orbitControls.enabled) orbitControls.enabled = true;
        }
        // Clear smoothed targets
        smoothedTargetPointRef.current = null;
        smoothedTargetCameraPosRef.current = null;
        return;
      }
  
      // Validate and get target point for camera/controls
      const isValidPosition =
        Array.isArray(mapping.position) &&
        mapping.position.length === 3 &&
        mapping.position.every((n) => typeof n === "number" && isFinite(n));
      const positionArray: [number, number, number] = isValidPosition
        ? (mapping.position as [number, number, number])
        : [0, 0, 0]; // Fallback position
      const actualTargetPoint = new THREE.Vector3(...positionArray);
      const actualTargetCameraPos = calculateTargetCameraPosition(actualTargetPoint, mapping);
  
      if (editMode) {
        // --- Edit Mode: Snap Camera ---
        if (isAnimatingCameraRef.current) { // Stop any ongoing animation
          isAnimatingCameraRef.current = false;
          animationStartDataRef.current = null;
        }
        // Check if camera or target needs snapping (using threshold)
        const camDistanceSq = camera.position.distanceToSquared(actualTargetCameraPos);
        const targetDistanceSq = orbitControls.target.distanceToSquared(actualTargetPoint);
        if (camDistanceSq > POSITION_THRESHOLD * POSITION_THRESHOLD || targetDistanceSq > POSITION_THRESHOLD * POSITION_THRESHOLD) {
          camera.position.copy(actualTargetCameraPos);
          orbitControls.target.copy(actualTargetPoint);
          camera.lookAt(orbitControls.target); // Ensure camera looks at the new target
          orbitControls.update(); // Update controls state
        }
        // Ensure controls are enabled if not dragging
        if (!orbitControls.enabled && !isDraggingHighlightRef.current) {
          orbitControls.enabled = true;
        }
        // Update smoothed refs to prevent lerping issues if switching modes
        smoothedTargetPointRef.current = actualTargetPoint.clone();
        smoothedTargetCameraPosRef.current = actualTargetCameraPos.clone();
  
      } else {
        // --- View Mode: Animate Camera ---
        if (isAnimatingCameraRef.current) return; // Already animating, skip trigger
  
        const currentCamPos = camera.position.clone();
        const currentTarget = orbitControls.target.clone();
        const camDistanceSq = currentCamPos.distanceToSquared(actualTargetCameraPos);
        const targetDistanceSq = currentTarget.distanceToSquared(actualTargetPoint);
        const needsCameraAnimation = camDistanceSq > POSITION_THRESHOLD * POSITION_THRESHOLD || targetDistanceSq > POSITION_THRESHOLD * POSITION_THRESHOLD;
  
        if (needsCameraAnimation) {
          isAnimatingCameraRef.current = true;
          animationStartTimeRef.current = clock.elapsedTime; // Use R3F clock time
          animationStartDataRef.current = { cameraPos: currentCamPos, targetPos: currentTarget };
          // Initialize smoothed targets to current positions for lerping start
          smoothedTargetPointRef.current = currentTarget.clone();
          smoothedTargetCameraPosRef.current = currentCamPos.clone();
          // Disable controls during animation
          if (orbitControls.enabled) {
            orbitControls.enabled = false;
          }
        } else {
          // Already at target, ensure controls are enabled
          if (!orbitControls.enabled) {
            orbitControls.enabled = true;
          }
           // Update smoothed refs even if not animating to prevent jumps if mode changes
           smoothedTargetPointRef.current = actualTargetPoint.clone();
           smoothedTargetCameraPosRef.current = actualTargetCameraPos.clone();
        }
      }
    // Depend on mapping data, mode, load state, and controls/camera readiness. Size isn't needed for camera position.
    }, [mapping, editMode, isModelLoaded, hasLoadError, camera, controls, clock]);
  
  
    // --- Callbacks: Highlight Interaction (Dragging/Scaling) ---
    const handleHighlightPointerDown = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!editMode || !mapping || !highlightMeshRef.current || !selectedCategory || !currentPlacement || !gl.domElement) return;
        event.stopPropagation(); // Prevent orbit controls activation
  
        // Find intersection specifically with the highlight sphere mesh
        const intersection = event.intersections.find(intersect => intersect.object === highlightMeshRef.current);
        if (!intersection) return;
  
        // Disable orbit controls during drag
        const orbitControls = controls as OrbitControlsImpl | null;
        if (orbitControls) orbitControls.enabled = false;
  
        // Capture pointer events
        try { (event.target as HTMLElement).setPointerCapture(event.pointerId); } catch (e) { console.warn("Failed to set pointer capture:", e); }
  
        isDraggingHighlightRef.current = true;
        dragStartPointRef.current.copy(intersection.point); // Store the world point of intersection
  
        const sphereCenter = highlightMeshRef.current.position;
        const currentActualRadius = highlightMeshRef.current.scale.x * 0.5; // Based on current visual scale
        const distFromCenterSq = intersection.point.distanceToSquared(sphereCenter);
  
        // Allow scaling only if size prop isn't set to a fixed positive value
        const allowScaleDrag = typeof size !== "number" || !isFinite(size) || size <= 0;
  
        // Determine drag type based on distance from center (heuristic)
        if (allowScaleDrag && currentActualRadius > 0.01 && distFromCenterSq > (currentActualRadius * 0.7) * (currentActualRadius * 0.7) ) {
          dragTypeRef.current = "scale";
          gl.domElement.style.cursor = "nwse-resize";
          // Store initial distance and scale for relative scaling calculation
          dragStartScaleDataRef.current = { distance: Math.sqrt(distFromCenterSq), scale: highlightMeshRef.current.scale.x };
        } else {
          dragTypeRef.current = "position";
          gl.domElement.style.cursor = "move";
          dragStartScaleDataRef.current = null;
        }
      },
      [editMode, mapping, gl.domElement, controls, selectedCategory, currentPlacement, size]
    );
  
    const handleHighlightPointerMove = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!editMode || !isDraggingHighlightRef.current || !mapping || !selectedCategory || !currentPlacement || !camera || !highlightMeshRef.current || !onMappingUpdate || !raycaster || !pointer) return;
        event.stopPropagation();
  
        // --- Plane-based dragging ---
        const dragPlane = new THREE.Plane();
        const currentSpherePos = highlightMeshRef.current.position; // Use the actual current mesh position
  
        // Create a plane parallel to the camera view, passing through the sphere's center
        camera.getWorldDirection(dragPlane.normal).negate(); // Plane normal facing the camera
        dragPlane.setFromNormalAndCoplanarPoint(dragPlane.normal, currentSpherePos);
  
        // Raycast from camera to find intersection with the drag plane
        raycaster.setFromCamera(pointer, camera);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
  
          if (dragTypeRef.current === "position") {
            // Calculate delta between the current intersection point and the START point of this drag segment
            const delta = intersectPoint.clone().sub(dragStartPointRef.current);
            // Calculate the new position by adding the delta to the *current* sphere position
            const newPositionVec = currentSpherePos.clone().add(delta);
  
            // Update mapping via callback
            onMappingUpdate(selectedCategory, currentPlacement, {
              position: newPositionVec.toArray() as [number, number, number],
            });
  
            // IMPORTANT: Update the drag start point for the *next* move event to the current intersection point.
            // This prevents accelerating drift by always calculating delta from the latest known good point.
            dragStartPointRef.current.copy(intersectPoint);
  
          } else if (dragTypeRef.current === "scale" && dragStartScaleDataRef.current) {
             const sphereCenter = highlightMeshRef.current.position;
             const currentDistFromCenter = intersectPoint.distanceTo(sphereCenter);
             const startData = dragStartScaleDataRef.current;
  
             // Avoid division by zero or near-zero
             if (startData.distance > 0.01 && currentDistFromCenter > 0.01) {
                 const scaleFactor = currentDistFromCenter / startData.distance;
                 const newScale = Math.max(MIN_TARGET_SCALE, startData.scale * scaleFactor); // Calculate new scale relative to drag start
  
                 onMappingUpdate(selectedCategory, currentPlacement, { scale: newScale });
  
                 // Update drag start data for the next move event, using the *current* distance and the *new* scale
                 // This makes scaling relative to the last move event's state.
                 dragStartScaleDataRef.current = { distance: currentDistFromCenter, scale: newScale };
             }
          }
        }
      },
      // Dependencies include everything needed for calculation and update
      [editMode, mapping, camera, onMappingUpdate, raycaster, pointer, selectedCategory, currentPlacement]
    );
  
    const handleHighlightPointerUp = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!editMode || !isDraggingHighlightRef.current) return;
  
        // Release pointer capture
        try { (event.target as HTMLElement).releasePointerCapture(event.pointerId); } catch (e) { console.warn("Failed to release pointer capture:", e); }
  
        // Reset drag state
        isDraggingHighlightRef.current = false;
        dragTypeRef.current = null;
        dragStartScaleDataRef.current = null;
        if (gl.domElement) gl.domElement.style.cursor = "auto"; // Reset cursor
  
        // Re-enable orbit controls IF in edit mode and NOT currently animating camera
        const orbitControls = controls as OrbitControlsImpl | null;
        if (orbitControls && !isAnimatingCameraRef.current && editMode) {
            orbitControls.enabled = true;
        }
      },
      [editMode, gl.domElement, controls]
    );
  
    // --- Callback: OrbitControls Change (Update Mapping Camera Angles) ---
    const debouncedControlsUpdater = useMemo(() => {
      // Debounce the function that updates mapping based on camera interaction
      return debounce(
        (cam: THREE.PerspectiveCamera, ctrlTarget: THREE.Vector3) => {
          // Only update if in edit mode, selection exists, not dragging sphere, and not animating camera
          if (!editMode || !selectedCategory || !currentPlacement || !onMappingUpdate || isDraggingHighlightRef.current || isAnimatingCameraRef.current) return;
  
          const orbitControls = controls as OrbitControlsImpl | null;
          if (!orbitControls?.enabled) return; // Don't update if controls aren't active
  
          // Calculate relative position and convert to spherical coordinates
          const relativePos = new THREE.Vector3().subVectors(cam.position, ctrlTarget);
          const spherical = new THREE.Spherical().setFromVector3(relativePos);
  
          // Validate spherical coordinates before updating mapping
          if (!isFinite(spherical.theta) || !isFinite(spherical.phi) || !isFinite(spherical.radius)) {
            console.warn("DebouncedControlsUpdater: Skipping update due to non-finite spherical values.");
            return;
          }
  
          // Call the mapping update function with the new camera angles/distance
          onMappingUpdate(selectedCategory, currentPlacement, {
            cameraAzimuth: spherical.theta, // Azimuthal angle (around Y)
            cameraPolar: spherical.phi,     // Polar angle (from Y)
            cameraDistance: spherical.radius, // Distance from target
          });
        },
        CAMERA_UPDATE_DEBOUNCE_MS // Debounce interval
      );
    }, [editMode, selectedCategory, currentPlacement, onMappingUpdate, controls]); // Dependencies for the debounced function
  
    const handleControlsChange = useCallback(
      (e: THREE.Event | undefined) => {
          const controlsInstance = e?.target as OrbitControlsImpl | undefined;
          if (!controlsInstance) return;
          const cam = controlsInstance.object as THREE.PerspectiveCamera | undefined;
          const ctrlTarget = controlsInstance.target as THREE.Vector3 | undefined;
  
          // Trigger the debounced update if in edit mode and camera/target are valid
          if (editMode && cam && ctrlTarget) {
              debouncedControlsUpdater(cam, ctrlTarget);
          }
      },
      [editMode, debouncedControlsUpdater] // Dependencies for the event handler itself
    );
  
  
    // --- Frame Loop: Camera Animation & Pulsating Scale Update ---
    useFrame((state, delta) => {
      const time = clock.elapsedTime;
      const orbitControls = controls as OrbitControlsImpl | null;
      const currentHighlightMesh = highlightMeshRef.current;
  
      // --- Camera Animation Logic ---
      if (isAnimatingCameraRef.current && !editMode) {
        const currentCamera = state.camera;
        const startData = animationStartDataRef.current;
  
        // Robust check for necessary data before proceeding with animation
        if (!orbitControls || !startData || !mapping || !smoothedTargetPointRef.current || !smoothedTargetCameraPosRef.current || !currentHighlightMesh) {
          console.warn("[useFrame] Aborting camera animation due to missing data/refs.");
          isAnimatingCameraRef.current = false;
          animationStartDataRef.current = null;
           // Attempt to snap to final state if possible
           if (mapping && isModelLoaded && !hasLoadError && orbitControls) {
               const isValidPos = Array.isArray(mapping.position) && mapping.position.length === 3 && mapping.position.every(n => typeof n === 'number' && isFinite(n));
               const finalPos = new THREE.Vector3(...(isValidPos ? mapping.position as [number, number, number] : [0, 0, 0]));
               const finalCamPos = calculateTargetCameraPosition(finalPos, mapping);
               state.camera.position.copy(finalCamPos);
               orbitControls.target.copy(finalPos);
               state.camera.lookAt(orbitControls.target);
               if(currentHighlightMesh) currentHighlightMesh.position.copy(finalPos); // Sync sphere position
           }
           if (orbitControls && !orbitControls.enabled) orbitControls.enabled = true; // Re-enable controls
          return; // Exit frame update for animation
        }
  
        // Recalculate actual target positions based on current mapping (in case it changes mid-flight, though unlikely)
        const isValidPosition = Array.isArray(mapping.position) && mapping.position.length === 3 && mapping.position.every(n => typeof n === 'number' && isFinite(n));
        const positionArray: [number, number, number] = isValidPosition ? mapping.position as [number, number, number] : [0, 0, 0];
        const actualTargetPoint = new THREE.Vector3(...positionArray);
        const actualTargetCameraPos = calculateTargetCameraPosition(actualTargetPoint, mapping);
  
        // Smooth the target positions themselves to avoid jumps if mapping changes rapidly
        const effectiveDeltaForCamera = Math.min(delta, 0.05); // Clamp delta for stability
        const lerpFactorCamera = 1 - Math.exp(-TARGET_SMOOTHING_FACTOR * effectiveDeltaForCamera);
        smoothedTargetPointRef.current.lerp(actualTargetPoint, lerpFactorCamera);
        smoothedTargetCameraPosRef.current.lerp(actualTargetCameraPos, lerpFactorCamera);
  
        // Calculate animation progress based on time
        const elapsed = time - animationStartTimeRef.current;
        const progress = Math.min(elapsed * (1000 / ANIMATION_DURATION), 1.0); // Normalize progress (0 to 1)
        const t = easeOutQuart(progress); // Apply easing function
  
        // Interpolate camera position and target using the eased progress
        currentCamera.position.lerpVectors(startData.cameraPos, smoothedTargetCameraPosRef.current, t);
        orbitControls.target.lerpVectors(startData.targetPos, smoothedTargetPointRef.current, t);
        currentCamera.lookAt(orbitControls.target); // Ensure camera keeps looking at the interpolated target
  
        // Keep highlight sphere position synced with the camera's smoothed target
        currentHighlightMesh.position.copy(smoothedTargetPointRef.current);
  
        // Check if animation is complete
        if (progress >= 1.0) {
          // Snap to final positions
          currentCamera.position.copy(actualTargetCameraPos);
          orbitControls.target.copy(actualTargetPoint);
          currentCamera.lookAt(orbitControls.target);
          currentHighlightMesh.position.copy(actualTargetPoint); // Snap sphere position too
  
          // Reset animation state
          isAnimatingCameraRef.current = false;
          animationStartDataRef.current = null;
          if (!orbitControls.enabled) orbitControls.enabled = true; // Re-enable controls
        }
      } // --- End Camera Animation Logic ---
  
  
      // --- Pulsating Scale Logic ---
      // If in view mode and size is 0, calculate the oscillating scale
      if (!editMode && size === 0 && currentHighlightMesh && isModelLoaded && !hasLoadError) {
          const baseScaleForPulsation = targetScaleBase; // Use the base scale calculated earlier
          const oscillation = Math.sin(time * SCALE_ANIMATION_SPEED);
          const pulsatingScale = baseScaleForPulsation * (1 + SCALE_ANIMATION_AMPLITUDE_FACTOR * oscillation);
          const finalPulsatingScale = Math.max(MIN_TARGET_SCALE, pulsatingScale); // Ensure minimum scale
  
          // Update the state that gets passed as targetScale prop to HighlightSphere
          // This will cause HighlightSphere to lerp towards this rapidly changing value each frame.
          setAnimatedTargetScale(finalPulsatingScale);
      } else if (animatedTargetScale !== targetScaleBase) {
          // If not pulsating, ensure the animatedTargetScale matches the static base scale
          // This handles the transition *out* of pulsating mode or updates if base scale changes.
          setAnimatedTargetScale(targetScaleBase);
      }
  
  
      // --- Ensure Controls Enabled Logic (if not animating/dragging) ---
      if (orbitControls && !orbitControls.enabled && !isAnimatingCameraRef.current && !isDraggingHighlightRef.current) {
          // Only enable if edit mode allows it OR if view mode animation finished
         if(editMode || !isAnimatingCameraRef.current) {
             orbitControls.enabled = true;
         }
      }
  
      // --- Update controls if damping enabled ---
      // This needs to run even if animating camera for damping effect to eventually stop controls movement
      if (orbitControls?.enabled && orbitControls.enableDamping) {
        orbitControls.update();
      }
    }); // End useFrame
  
  
    // --- Debug Info ---
    const debugTextPosition = useMemo(() => mapping?.position, [mapping?.position]);
    const debugTextScale = useMemo(() => mapping?.scale, [mapping?.scale]); // Use mapping scale for display
  
  
    // --- Render Logic ---
    return (
      <>
        {/* Load the 3D Model */}
        {modelUrl && (
          <Model
            modelUrl={modelUrl}
            isColor={isColor}
            onLoad={handleModelLoad}
            onError={handleModelError}
            key={modelUrl} // Ensure model reloads if URL changes
          />
        )}
  
        {/* Render Highlight Sphere only if model loaded and no errors */}
        {isModelLoaded && !hasLoadError && mapping && ( // Ensure mapping exists too
          <HighlightSphere
            ref={highlightMeshRef}
            highlightColor={highlightColor}
            highlightOpacity={finalHighlightOpacity} // Opacity includes initial fade + base opacity
            targetScale={animatedTargetScale} // Pass the (potentially animated) target scale
            editMode={editMode}
            debugTextPosition={debugTextPosition}
            debugTextScale={debugTextScale} // Pass current mapping scale for debug text
            onPointerDown={handleHighlightPointerDown}
            onPointerMove={handleHighlightPointerMove}
            onPointerUp={handleHighlightPointerUp}
          />
        )}
  
        {/* Optional: Loading/Error Indicators */}
        {!isModelLoaded && !hasLoadError && <Text position={[0, 0, 0]} fontSize={0.1} color="grey">Loading Model...</Text>}
        {hasLoadError && <Text position={[0, 0, 0]} fontSize={0.1} color="red">Error Loading Model</Text>}
  
         {/* Attach OrbitControls change listener */}
         {controls && <primitive object={controls} attach="orbitControls" onChange={handleControlsChange} />}
      </>
    );
  }); // End ViewerContents Component Memo
  
  
  // --- Main Exported Component ---
  export const Human3DViewer: React.FC<Human3DViewerProps> = memo(
    ({
      modelUrl,
      isColor,
      mapping,
      editMode,
      onMappingUpdate,
      isContainerResizing,
      selectedCategory,
      currentPlacement,
      onCanvasCreated,
      size,
    }) => {
  
      // Callback for when the R3F canvas context is created
      const handleCanvasCreated = useCallback(
        (state: RootState) => {
          if (onCanvasCreated && state.gl) {
            onCanvasCreated(state.gl.domElement);
          }
          // You could potentially store controls ref here if needed outside ViewerContents
          // e.g., state.controls
        },
        [onCanvasCreated]
      );
  
      // Don't render the SceneSetup (and thus the Canvas) if no model URL is provided
      if (!modelUrl) {
          console.warn("Human3DViewer: No modelUrl provided.");
          return null;
      }
  
      return (
        <SceneSetup
          editMode={editMode}
          onCreated={handleCanvasCreated}
          isContainerResizing={isContainerResizing}
          // Add any other relevant props for SceneSetup if needed (e.g., camera defaults)
        >
          {/* Pass all necessary props down to the inner component */}
          <ViewerContents
            modelUrl={modelUrl}
            isColor={isColor}
            mapping={mapping}
            editMode={editMode}
            onMappingUpdate={onMappingUpdate}
            selectedCategory={selectedCategory}
            currentPlacement={currentPlacement}
            size={size}
          />
        </SceneSetup>
      );
    }
  );
  
  Human3DViewer.displayName = "Human3DViewer";