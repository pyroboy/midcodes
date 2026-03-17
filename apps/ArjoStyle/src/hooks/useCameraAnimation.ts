// src/hooks/useCameraAnimation.ts
import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BodyPartMapping } from "../types/mapping"; // Adjust path if needed

// --- Constants ---
const ANIMATION_DURATION = 1000; // ms (Keep faster duration from previous step)
const MIN_CAMERA_DISTANCE = 0.5;
const DEFAULT_CAMERA_DISTANCE = 1.5;
const HIDE_SCALE_THRESHOLD = 1e-5;
const POSITION_THRESHOLD = 0.01; // How close positions need to be to stop
const SCALE_THRESHOLD = 0.01;   // How close scale needs to be to stop

// --- Types ---
interface CameraAnimationHookResult {
  isAnimating: boolean; // Public state for consumers
}

// Internal state stored in ref for the target destination
interface AnimationTargetState {
  targetPosition: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  sphereScale: number;
}

// Internal state stored in ref for the state when animation started
interface AnimationStartState {
    cameraPos: THREE.Vector3;
    targetPos: THREE.Vector3; // Controls target at start
    sphereScale: number;
}

// --- Helper Functions ---

/** Easing function: Starts fast, slows down at the end */
function easeOutQuartic(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/** Calculates the target camera position based on mapping's spherical coords */
const calculateTargetCameraPosition = (
  targetPoint: THREE.Vector3,
  mapping: BodyPartMapping | undefined | null
): THREE.Vector3 => {
  const fallbackPosition = new THREE.Vector3(
    targetPoint.x,
    targetPoint.y + 0.5,
    targetPoint.z + DEFAULT_CAMERA_DISTANCE
  );

  if (!mapping) {
    return fallbackPosition;
  }

  const { cameraAzimuth, cameraPolar, cameraDistance } = mapping;
  const safeAzimuth =
    typeof cameraAzimuth === "number" && !isNaN(cameraAzimuth) ? cameraAzimuth : 0;
  const safePolar =
    typeof cameraPolar === "number" && !isNaN(cameraPolar)
      ? Math.max(0.01, Math.min(Math.PI - 0.01, cameraPolar))
      : Math.PI / 2;
  const safeDistance =
    typeof cameraDistance === "number" &&
    !isNaN(cameraDistance) &&
    cameraDistance >= MIN_CAMERA_DISTANCE
      ? cameraDistance
      : DEFAULT_CAMERA_DISTANCE;

  const offsetX = safeDistance * Math.sin(safePolar) * Math.sin(safeAzimuth);
  const offsetY = safeDistance * Math.cos(safePolar);
  const offsetZ = safeDistance * Math.sin(safePolar) * Math.cos(safeAzimuth);

  const targetCameraPos = new THREE.Vector3(
    targetPoint.x + offsetX,
    targetPoint.y + offsetY,
    targetPoint.z + offsetZ
  );

  if (
    !isFinite(targetCameraPos.x) ||
    !isFinite(targetCameraPos.y) ||
    !isFinite(targetCameraPos.z)
  ) {
    console.error(
      "[useCameraAnimation] Invalid target camera position calculated (NaN/Infinity), using fallback.",
      { targetPoint, mapping, calculated: targetCameraPos }
    );
    return fallbackPosition;
  }

  return targetCameraPos;
};


// --- The Custom Hook ---
export function useCameraAnimation(
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>,
  controlsRef: React.RefObject<OrbitControls | null>,
  highlightRef: React.RefObject<THREE.Mesh | null>,
  bodyPartMapping: BodyPartMapping | undefined | null,
  editMode: boolean,
  isModelLoaded: boolean,
  hasError: boolean,
  selectedCategory: string,
  currentPlacement: string
): CameraAnimationHookResult {

  // Ref for internal animation state, avoiding state updates triggering effect loops
  const isAnimatingRef = useRef(false);
  // State for external consumers (if they need to know if *any* animation is running)
  const [isAnimatingPublic, setIsAnimatingPublic] = useState(false);

  const targetStateRef = useRef<AnimationTargetState | null>(null);
  const animationFrameRef = useRef<number>(0);
  const animationStartTimeRef = useRef<number>(0);
  const animationStartStateRef = useRef<AnimationStartState | null>(null);

  // --- Effect 1: Update Target State Ref ---
  // Calculates the desired destination based on the current mapping.
  useEffect(() => {
    if (!bodyPartMapping || !isModelLoaded || hasError) {
      targetStateRef.current = null;
      return;
    }
    // Validate mapping data is usable
    if (
      Array.isArray(bodyPartMapping.position) &&
      bodyPartMapping.position.length === 3 &&
      bodyPartMapping.position.every((n) => typeof n === "number" && isFinite(n)) &&
      typeof bodyPartMapping.scale === "number" &&
      isFinite(bodyPartMapping.scale)
    ) {
      // Calculate target vectors/values
      const newTargetPosition = new THREE.Vector3(...bodyPartMapping.position);
      const newCameraPosition = calculateTargetCameraPosition(
        newTargetPosition,
        bodyPartMapping
      );
      const newSphereScale = Math.max(0, bodyPartMapping.scale); // Ensure non-negative

      // Store the latest valid target state in the ref
      targetStateRef.current = {
        targetPosition: newTargetPosition,
        cameraPosition: newCameraPosition,
        sphereScale: newSphereScale,
      };
    } else {
      console.error("[useCameraAnimation Effect 1] Invalid bodyPartMapping data:", bodyPartMapping);
      targetStateRef.current = null; // Clear target if data is invalid
    }
  }, [bodyPartMapping, isModelLoaded, hasError]); // Dependencies defining the target


  // --- Effect 2: Manage Animation Loop & Snapping ---
  // Reacts to changes in selection, mode, or prerequisites to manage camera movement.
  useEffect(() => {
    // Get current refs and calculated target
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const highlight = highlightRef.current;
    const currentTarget = targetStateRef.current;

    // Helper to check if camera/highlight are already at the target
    const isAtTarget = (): boolean => {
       if (!currentTarget || !camera || !controls) return true; // Assume true if no target/refs
       const camDistance = camera.position.distanceTo(currentTarget.cameraPosition);
       const targetDistance = controls.target.distanceTo(currentTarget.targetPosition);
       let scaleDistance = Infinity;
       if(highlight) {
         scaleDistance = Math.abs(highlight.scale.x - currentTarget.sphereScale);
       }
       // Check if all distances are within their respective thresholds
       return camDistance < POSITION_THRESHOLD &&
              targetDistance < POSITION_THRESHOLD &&
              scaleDistance < SCALE_THRESHOLD;
    };

    // Function to reliably stop animation and reset states
    const cleanupAnimation = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
      // Ensure controls are re-enabled if they exist
      if (controlsRef.current && !controlsRef.current.enabled) {
         controlsRef.current.enabled = true;
      }
      // Update ref and state only if animation was actually running
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        setIsAnimatingPublic(false);
      }
    };

    // --- Pre-computation Checks ---
    if (!camera || !controls || !isModelLoaded || hasError) {
      cleanupAnimation(); // Stop any potential animation if prerequisites fail
      return cleanupAnimation; // Return cleanup function
    }

    // --- Edit Mode Logic ---
    if (editMode) {
      cleanupAnimation(); // Stop animation if switching to edit mode
      if (currentTarget) {
        // Snap directly to the latest target state
        camera.position.copy(currentTarget.cameraPosition);
        controls.target.copy(currentTarget.targetPosition);
        camera.lookAt(controls.target); // Orient camera
        if (highlight) { // Snap highlight too
            highlight.position.copy(currentTarget.targetPosition);
            highlight.scale.set(currentTarget.sphereScale, currentTarget.sphereScale, currentTarget.sphereScale);
            highlight.visible = currentTarget.sphereScale > HIDE_SCALE_THRESHOLD;
        }
        controls.update(); // Update controls state
      }
      return cleanupAnimation; // Return cleanup function
    }

    // --- Preview Mode Logic ---
    if (!editMode && currentTarget && highlight) { // Ensure target and highlight exist

      // If already at the target, ensure animation is stopped and exit
      if (isAtTarget()) {
        cleanupAnimation();
        return cleanupAnimation;
      }

      // --- Start new animation sequence ONLY if not already animating ---
      if (!isAnimatingRef.current) {
        // Set internal ref immediately to prevent race conditions
        isAnimatingRef.current = true;
        // Update public state for consumers
        setIsAnimatingPublic(true);

        // Capture the state *at the moment this animation sequence starts*
        animationStartStateRef.current = {
          cameraPos: camera.position.clone(),
          targetPos: controls.target.clone(),
          sphereScale: highlight.scale.x, // Use current scale as the starting point
        };
        animationStartTimeRef.current = Date.now(); // Record start time
        controls.enabled = false; // Disable controls during the animation

        // --- Animation Loop Definition ---
        const animateCamera = () => {
          // Get refs and state needed for this frame
          const loopStartTime = animationStartTimeRef.current;
          const startState = animationStartStateRef.current;
          const loopTarget = targetStateRef.current; // Read latest target inside loop

          // Re-validate refs and target inside the loop for safety
          const currentCam = cameraRef.current;
          const currentCtrl = controlsRef.current;
          const currentHighlight = highlightRef.current;
          if (!currentCam || !currentCtrl || !currentHighlight || !loopTarget || !startState) {
              console.warn("[useCameraAnimation] Animation loop stopping: Refs/targets/startState invalid.");
              cleanupAnimation(); // Stop animation and reset state
              return; // Exit loop
          }

          // Calculate progress and easing
          const elapsed = Date.now() - loopStartTime;
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          const t = easeOutQuartic(progress);

          // --- Interpolate Values ---
          const newCameraPosition = new THREE.Vector3().lerpVectors(startState.cameraPos, loopTarget.cameraPosition, t);
          const newTarget = new THREE.Vector3().lerpVectors(startState.targetPos, loopTarget.targetPosition, t);
          const newSpherePosition = new THREE.Vector3().lerpVectors(startState.targetPos, loopTarget.targetPosition, t); // Sphere moves with target
          const currentScale = startState.sphereScale + (loopTarget.sphereScale - startState.sphereScale) * t;

          // --- Apply Values Safely ---
          if (isFinite(newCameraPosition.x)) currentCam.position.x = newCameraPosition.x;
          if (isFinite(newCameraPosition.y)) currentCam.position.y = newCameraPosition.y;
          if (isFinite(newCameraPosition.z)) currentCam.position.z = newCameraPosition.z;

          if (isFinite(newTarget.x)) currentCtrl.target.x = newTarget.x;
          if (isFinite(newTarget.y)) currentCtrl.target.y = newTarget.y;
          if (isFinite(newTarget.z)) currentCtrl.target.z = newTarget.z;

          if (isFinite(newSpherePosition.x)) currentHighlight.position.x = newSpherePosition.x;
          if (isFinite(newSpherePosition.y)) currentHighlight.position.y = newSpherePosition.y;
          if (isFinite(newSpherePosition.z)) currentHighlight.position.z = newSpherePosition.z;

          if (isFinite(currentScale) && currentScale >= 0) {
               currentHighlight.scale.set(currentScale, currentScale, currentScale);
               currentHighlight.visible = currentScale > HIDE_SCALE_THRESHOLD;
          }

          // Update camera orientation to look at the interpolated target
          currentCam.lookAt(currentCtrl.target);
          // DO NOT call controls.update() while controls are disabled

          // --- Check Stopping Condition ---
          const camDistance = currentCam.position.distanceTo(loopTarget.cameraPosition);
          const targetDistance = currentCtrl.target.distanceTo(loopTarget.targetPosition);
          const scaleDiff = Math.abs(currentScale - loopTarget.sphereScale);

          if (progress >= 1 || (camDistance < POSITION_THRESHOLD && targetDistance < POSITION_THRESHOLD && scaleDiff < SCALE_THRESHOLD)) {
               // --- Animation Finished or Reached Threshold ---
               // Snap precisely to the *final* target state
               currentCam.position.copy(loopTarget.cameraPosition);
               currentCtrl.target.copy(loopTarget.targetPosition);
               currentHighlight.position.copy(loopTarget.targetPosition);
               currentHighlight.scale.set(loopTarget.sphereScale, loopTarget.sphereScale, loopTarget.sphereScale);
               currentHighlight.visible = loopTarget.sphereScale > HIDE_SCALE_THRESHOLD;
               currentCam.lookAt(currentCtrl.target); // Final lookAt

               // Re-enable controls and update *after* snapping
               if(controlsRef.current) {
                  controlsRef.current.enabled = true;
                  controlsRef.current.update();
               }

               animationFrameRef.current = 0; // Clear frame ID
               // Update ref and state *after* completion
               isAnimatingRef.current = false;
               setIsAnimatingPublic(false);
          } else {
               // --- Continue Animation ---
               animationFrameRef.current = requestAnimationFrame(animateCamera);
          }
        }; // End of animateCamera definition

        // --- Start the Animation Loop ---
        // Ensure no frame is pending before scheduling a new one
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(animateCamera);
      }
      // else: isAnimatingRef.current is true. The currently running loop
      //       will pick up the new target from targetStateRef.current. No action needed here.

    } else {
      // Conditions for preview animation not met (no target, no highlight, etc.)
      cleanupAnimation();
    }

    // --- Effect Cleanup ---
    // This cleanup runs when dependencies change OR the component unmounts.
    return cleanupAnimation;

  // Dependencies for Effect 2: Re-run when selection, mode, prerequisites change,
  // or when the underlying mapping data changes (which updates targetStateRef via Effect 1).
  }, [
    cameraRef, controlsRef, highlightRef, // Stable Refs
    editMode, isModelLoaded, hasError,    // Prerequisites / Mode
    selectedCategory, currentPlacement,     // Direct selection changes
    bodyPartMapping                      // Underlying data changes
    // isAnimatingPublic IS NOT included to prevent loops from state updates
  ]); // End of Effect 2

  // Return the public state for external use
  return { isAnimating: isAnimatingPublic };
}