import React, { useEffect, useCallback, useRef, useMemo } from "react"; // Added useMemo
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BodyPartMapping } from "../types/mapping"; // Adjust path
import { debounce } from "../components/booking/Human3DModelUtils"; // Adjust path
import { createInteractionHandlers } from "../components/booking/Human3DModelInteractions"; // Adjust path

// Debounce time for camera updates (ms)
const CAMERA_UPDATE_DEBOUNCE_MS = 50;

// Type for the onMappingUpdate callback
type MappingUpdateCallback = (
  category: string,
  placement: string,
  updatedValues: Partial<BodyPartMapping>
) => void;

export function useEditInteractions(
  containerRef: React.RefObject<HTMLDivElement>,
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>,
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>,
  controlsRef: React.RefObject<OrbitControls | null>,
  highlightRef: React.RefObject<THREE.Mesh | null>,
  modelRef: React.RefObject<THREE.Group | null>,
  isModelLoaded: boolean,
  editMode: boolean,
  selectedCategory: string,
  currentPlacement: string,
  bodyPartMapping: BodyPartMapping, // Needed by createInteractionHandlers
  onMappingUpdate?: MappingUpdateCallback // Make optional if not always provided
): void {
  // Use a ref to store the callback to prevent it from being a dependency
  const onMappingUpdateRef = useRef(onMappingUpdate);
  useEffect(() => {
    onMappingUpdateRef.current = onMappingUpdate;
  }, [onMappingUpdate]);

  // Define the core logic function using useCallback
  const updateCameraMapping = useCallback(
    (azimuth: number, polar: number, distance: number) => {
      // Use the ref inside the core logic
      if (onMappingUpdateRef.current && selectedCategory && currentPlacement) {
        console.log("[useEditInteractions] Debounced Camera Update Triggered");
        onMappingUpdateRef.current(selectedCategory, currentPlacement, {
          cameraAzimuth: azimuth,
          cameraPolar: polar,
          cameraDistance: distance,
        });
      }
    },
    [selectedCategory, currentPlacement]
  ); // Dependencies used inside updateCameraMapping

  // --- FIX Start: Use useMemo for the debounced function ---
  // Memoize the debounced function itself using useMemo
  const debouncedUpdateCameraMapping = useMemo(
    () => debounce(updateCameraMapping, CAMERA_UPDATE_DEBOUNCE_MS),
    [updateCameraMapping] // Depend on the memoized core function
  );
  // --- FIX End ---

  useEffect(() => {
    const controlsInstance = controlsRef.current;
    const container = containerRef.current;

    if (
      !editMode ||
      !isModelLoaded ||
      !controlsInstance ||
      !container ||
      !onMappingUpdateRef.current
    ) {
      return;
    }

    // --- Camera Change Listener ---
    const handleCameraChange = () => {
      const camera = cameraRef.current;
      const currentControls = controlsRef.current;
      if (!camera || !currentControls) return;

      const relativePosition = new THREE.Vector3().subVectors(
        camera.position,
        currentControls.target
      );
      const spherical = new THREE.Spherical().setFromVector3(relativePosition);
      debouncedUpdateCameraMapping(
        spherical.theta,
        spherical.phi,
        spherical.radius
      );
    };

    controlsInstance.addEventListener("change", handleCameraChange);
    console.log("[useEditInteractions] Added camera 'change' listener.");

    // --- Mouse Drag Interaction Handlers ---
    const { handleMouseDown, handleMouseMove, handleMouseUp } =
      createInteractionHandlers({
        containerRef,
        rendererRef,
        cameraRef,
        controlsRef,
        highlightRef,
        modelRef,
        isModelLoaded,
        editMode,
        selectedCategory,
        currentPlacement,
        bodyPartMapping,
        onMappingUpdate: onMappingUpdateRef.current,
      });

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    console.log("[useEditInteractions] Added mouse interaction listeners.");

    // --- Cleanup for this effect ---
    return () => {
      console.log("[useEditInteractions] Cleaning up listeners...");
      controlsInstance?.removeEventListener("change", handleCameraChange);
      console.log("  - Removed camera 'change' listener.");

      container?.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      console.log("  - Removed mouse interaction listeners.");

      document.body.style.cursor = "auto";
    };
  }, [
    // Core dependencies
    editMode,
    isModelLoaded,
    // Refs
    containerRef,
    rendererRef,
    cameraRef,
    controlsRef,
    highlightRef,
    modelRef,
    // State/Props
    selectedCategory,
    currentPlacement,
    bodyPartMapping,
    // Memoized debounced function
    debouncedUpdateCameraMapping,
    // Include createInteractionHandlers if needed
    // createInteractionHandlers
  ]);
}
