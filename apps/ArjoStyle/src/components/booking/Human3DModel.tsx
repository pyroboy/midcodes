import React, { useRef } from "react";
import { BodyPartMapping, BodyPartMappings } from "../../types/mapping"; // Adjust path for types

// Import custom hooks (adjust paths as needed)
import { useThreeSetup } from "../../hooks/useThreeSetup";
import { useModelLoader } from "../../hooks/useModelLoader";
import { useBodyPartMapping } from "../../hooks/useBodyPartMapping";
import { useHighlightSphere } from "../../hooks/useHighlightSphere";
import { useCameraAnimation } from "../../hooks/useCameraAnimation";
import { useEditInteractions } from "../../hooks/useEditInteractions";

// Re-define the Props interface here
interface Human3DModelProps {
  selectedCategory: string;
  currentPlacement: string;
  isColor: boolean;
  modelUrl?: string;
  modelId: string;
  size: number | null;
  bodyPartMappings?: BodyPartMappings; // Renamed from propMappings for clarity if desired, or keep as propMappings
  editMode?: boolean;
  onMappingUpdate?: (
    category: string,
    placement: string,
    updatedValues: Partial<BodyPartMapping>
  ) => void;
}

// Default model URL if not provided
const DEFAULT_MODEL_URL =
  "https://res.cloudinary.com/dexcw6vg0/image/upload/v1741855043/male_low_poly_human_body_jtzm1e.glb";

export const Human3DModel: React.FC<Human3DModelProps> = ({
  selectedCategory,
  currentPlacement,
  modelId,
  isColor,
  modelUrl = DEFAULT_MODEL_URL, // Use default
  bodyPartMappings: propMappings, // Receive prop, pass it down
  editMode = false, // Use default
  onMappingUpdate,
  size,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Setup Core Three.js Environment ---
  // Pass editMode to configure controls correctly from the start
  const { sceneRef, cameraRef, rendererRef, controlsRef } = useThreeSetup(
    containerRef,
    editMode
  );

  // --- Mapping Logic ---
  // Loads/calculates the specific mapping data for the selected part
  const { bodyPartMapping /*, areMappingsLoaded */ } = useBodyPartMapping(
    // areMappingsLoaded might not be needed here directly
    modelId,
    propMappings,
    selectedCategory,
    currentPlacement
  );

  // --- Model Loading ---
  // Handles loading the 3D model file
  const { modelRef, isModelLoaded, hasError } = useModelLoader(
    sceneRef, // Pass the Ref containing the Scene object
    modelUrl,
    isColor
  );

  // --- Highlight Sphere ---
  // Manages the red sphere indicating the selected placement
  const highlightRef = useHighlightSphere(
    sceneRef, // Pass the Ref containing the Scene object
    bodyPartMapping, // Pass the calculated mapping data
    isModelLoaded, // Only create sphere when model is ready
    editMode,
    selectedCategory, // Needed for coordinate text label
    currentPlacement // Needed for coordinate text label
  );

  // --- Camera Movement ---
  // Handles animating or snapping the camera based on mode and selection
  // This hook doesn't return anything, it just performs side effects
  useCameraAnimation(
    cameraRef, // Pass Refs
    controlsRef,
    highlightRef, // Pass Ref to the sphere Mesh
    bodyPartMapping, // Target mapping data
    editMode,
    isModelLoaded,
    hasError,
    selectedCategory,
    currentPlacement
  );

  // --- Edit Mode Interactions ---
  // Sets up listeners for camera changes and sphere dragging in edit mode
  // This hook doesn't return anything, it just performs side effects
  useEditInteractions(
    containerRef,
    rendererRef,
    cameraRef,
    controlsRef,
    highlightRef,
    modelRef, // Pass all necessary Refs
    isModelLoaded,
    editMode,
    selectedCategory,
    currentPlacement,
    bodyPartMapping, // Current mapping needed for interaction logic
    onMappingUpdate // Pass the callback function down
  );

  // --- Render ---
  // Display an error message if the model failed to load
  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg aspect-square">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium mb-2">
            Unable to load 3D model
          </p>
          <p className="text-sm text-gray-600">
            Please check the console or try refreshing.
          </p>
        </div>
      </div>
    );
  }

  // Render the container div for the Three.js canvas
  // Added aspect-square for consistent sizing like in original error UI example
  return (
    <div
      ref={containerRef}
      className="aspect-square w-full h-full rounded-lg overflow-hidden bg-gray-200" // Added a light bg color while loading
    />
  );
};

export default Human3DModel; // Optional: export default if it's the main export
