// src/hooks/useHighlightSphere.ts

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
// Adjust paths as needed
import { BodyPartMapping } from "../types/mapping";
import { createCoordinateText } from "../components/booking/Human3DModelUtils"; // Ensure this path is correct

const HIDE_SCALE_THRESHOLD = 1e-5; // Scale below which the highlight is considered invisible

// --- Helper Function for Resource Disposal ---
/**
 * Helper function to dispose geometry and material resources of a THREE object.
 * Handles THREE.Mesh and attempts basic recursive disposal for THREE.Group.
 * @param object - The THREE.Object3D to dispose resources for.
 */
function disposeObjectResources(object: THREE.Object3D | null) {
  if (!object) return;
  try {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      // Dispose material(s)
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material?.dispose());
      } else if (object.material) {
        object.material.dispose();
      }
      // console.log(`[disposeObjectResources] Disposed Mesh resources: ${object.uuid}`);
    } else if (object instanceof THREE.Group) {
      // Recursively dispose children and remove them
      while (object.children.length > 0) {
        const child = object.children[0];
        object.remove(child); // Remove from parent first
        disposeObjectResources(child); // Then dispose
      }
      // console.log(`[disposeObjectResources] Disposed Group children: ${object.uuid}`);
    }
    // Add disposal for other object types if needed (e.g., Lights, textures on materials not handled above)
  } catch (error) {
    console.error("[disposeObjectResources] Error during disposal:", error, object);
  }
}

// --- The Custom Hook ---
/**
 * Custom hook to manage the lifecycle and state (position, scale, visibility)
 * of a highlight sphere mesh and its associated coordinate text display (in edit mode).
 * Ensures the sphere reflects the latest bodyPartMapping data.
 *
 * @param sceneRef - React ref to the THREE.Scene.
 * @param bodyPartMapping - Mapping data for the currently selected body part. Can be null/undefined.
 * @param isModelLoaded - Boolean indicating if the main 3D model is loaded.
 * @param editMode - Boolean indicating if edit mode is active.
 * @param selectedCategory - String identifier for the selected category.
 * @param currentPlacement - String identifier for the selected placement.
 * @returns A mutable ref object containing the THREE.Mesh of the highlight sphere, or null.
 */
export function useHighlightSphere(
  sceneRef: React.RefObject<THREE.Scene | null>,
  bodyPartMapping: BodyPartMapping | undefined | null,
  isModelLoaded: boolean,
  editMode: boolean,
  selectedCategory: string,
  currentPlacement: string
): React.MutableRefObject<THREE.Mesh | null> {
  // Ref to hold the sphere mesh instance
  const highlightRef = useRef<THREE.Mesh | null>(null);
  // Ref to hold the coordinate text mesh instance (used in edit mode)
  const coordinateTextRef = useRef<THREE.Object3D | null>(null);
  const logPrefix = "[useHighlightSphere]"; // Prefix for console logs

  // --- Effect 1: Sphere Mesh Creation & Removal ---
  // Manages adding/removing the mesh from the scene based on model load status.
  useEffect(() => {
    const scene = sceneRef.current; // Capture scene ref value inside the effect
    const effectPrefix = `${logPrefix} Effect 1 (Creation/Removal)`;

    // Conditions for creating the sphere: scene exists, model is loaded, sphere ref is currently null
    if (scene && isModelLoaded && !highlightRef.current) {
      console.log(`${effectPrefix}: Conditions met. Creating highlight sphere mesh.`);
      const geometry = new THREE.SphereGeometry(0.5, 32, 16);
      // Unit radius allows scaling
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000, // Red
        transparent: true,
        opacity: 0.5, // Semi-transparent
        depthTest: true, // Render on top of other objects
        visible: true, // Start invisible; Effect 2 sets state based on mapping
      });
      const highlight = new THREE.Mesh(geometry, material);
      highlight.renderOrder = 999; // High render order to draw last (helps with transparency)
      highlight.name = "HighlightSphere"; // Name for easier debugging in DevTools
      scene.add(highlight);
      highlightRef.current = highlight; // Store the created mesh in the ref
      console.log(`${effectPrefix}: Sphere mesh CREATED (ID: ${highlight.uuid}) and added to scene.`);
    }

    // Cleanup function for this effect: Removes the sphere when dependencies change or component unmounts
    return () => {
      const effectCleanupPrefix = `${logPrefix} Effect 1 CLEANUP`;
      const sphere = highlightRef.current;
      // Use the captured 'scene' value for safety during cleanup
      if (sphere && scene && sphere.parent === scene) {
        console.log(`${effectCleanupPrefix}: Removing highlight sphere mesh (ID: ${sphere.uuid}) from scene.`);
        scene.remove(sphere);
        // Optional: Dispose geometry/material here if NOT handled by main scene cleanup
        // disposeObjectResources(sphere);
        console.log(`${effectCleanupPrefix}: Sphere mesh REMOVED.`);
      }
      // Always nullify the ref on cleanup related to creation dependencies
      highlightRef.current = null;
      // console.log(`${effectCleanupPrefix}: Ref nulled.`); // Less noisy log
    };
    // Dependencies: Re-run creation/removal logic only if the scene instance or model load status changes.
  }, [sceneRef, isModelLoaded]);

  // --- Effect 2: Sphere State Update ---
  // Updates position, scale, and visibility based on bodyPartMapping changes *after* the sphere exists.
  useEffect(() => {
    const sphere = highlightRef.current; // Get current sphere from ref
    const effectPrefix = `${logPrefix} Effect 2 (State Update)`;

    // Guard: Only run if the sphere mesh actually exists in the ref
    if (!sphere) {
      // This is normal if Effect 1 hasn't run yet or has cleaned up
      // console.log(`${effectPrefix}: Sphere ref is null. Skipping state update.`);
      return;
    }

    // Check if we have valid mapping data to apply
    if (
      bodyPartMapping &&
      bodyPartMapping.position &&
      Array.isArray(bodyPartMapping.position) &&
      bodyPartMapping.position.length === 3 &&
      typeof bodyPartMapping.scale === "number" &&
      !isNaN(bodyPartMapping.scale) // Ensure scale is a valid number, not NaN
    ) {
      // Log the incoming valid mapping data
      console.log(`${effectPrefix}: Valid mapping received. Updating sphere state. Mapping:`, JSON.stringify(bodyPartMapping));

      try {
        // --- Update Sphere Position ---
        // Ensure all position components are finite numbers before setting
        const [posX, posY, posZ] = bodyPartMapping.position;
        if (isFinite(posX) && isFinite(posY) && isFinite(posZ)) {
          sphere.position.set(posX, posY, posZ);
        } else {
          console.error(`${effectPrefix}: Invalid position data detected!`, bodyPartMapping.position);
          sphere.position.set(0, 0, 0); // Fallback position
        }

        // --- Update Sphere Scale ---
        // Ensure scale is non-negative
        const newScale = Math.max(0, bodyPartMapping.scale);
        sphere.scale.set(newScale, newScale, newScale);

        // --- Update Sphere Visibility ---
        // Hide if scale is effectively zero
        sphere.visible = newScale > HIDE_SCALE_THRESHOLD;

        // --- IMPORTANT DEBUGGING NOTE ---
        // If the log below shows "Visible: true" and a positive scale, but you STILL don't see the sphere:
        // 1. Check the scale value: Is it large enough to be seen in your scene (e.g., 0.05 might be tiny)?
        //    -> Test by manually increasing scale in DevTools or forcing a larger scale here temporarily.
        // 2. Check Camera: Is the camera position/angle correct? Is the sphere within the near/far clipping planes?
        //    -> Use DevTools to inspect camera and sphere positions.
        // 3. Check Rendering: Is the main render loop running? Is CSS hiding the canvas?
        //    -> Check console for render loop logs and inspect element styles.
        // ------------------------------------
        console.log(`${effectPrefix}: Sphere state UPDATED - Pos: [${sphere.position.toArray().map(p => p.toFixed(2)).join(',')}] Scale: ${newScale.toFixed(3)}, Visible: ${sphere.visible}`);

      } catch (error) {
        console.error(`${effectPrefix}: Error applying mapping state to sphere:`, error);
        // Reset to a known safe/invisible state on error
        sphere.position.set(0, 0, 0);
        sphere.scale.set(0, 0, 0);
        sphere.visible = false;
      }
    } else {
      // Mapping data is invalid or missing, ensure the sphere is hidden
      console.warn(`${effectPrefix}: Invalid or missing mapping data received. Hiding sphere. Mapping:`, bodyPartMapping);
      sphere.position.set(0, 0, 0); // Reset position
      sphere.scale.set(0, 0, 0); // Reset scale
      sphere.visible = false;
    }

    // No cleanup needed specifically for this effect, as it only modifies the state of the existing sphere.
    // Dependencies: Re-run this logic whenever the mapping data changes, or the sphere ref itself updates (unlikely).
  }, [bodyPartMapping, highlightRef]);

  // --- Effect 3: Coordinate Text Lifecycle & Update ---
  // Manages the debug text display shown only in edit mode.
  useEffect(() => {
    const scene = sceneRef.current; // Capture scene ref value inside the effect
    const effectPrefix = `${logPrefix} Effect 3 (Coord Text)`;

    // Guard: Scene must exist for adding/removing text
    if (!scene) {
      if (coordinateTextRef.current) {
        // Scene disappeared, clean up any existing text
        console.warn(`${effectPrefix}: Scene became null. Disposing existing text.`);
        disposeObjectResources(coordinateTextRef.current);
        coordinateTextRef.current = null;
      }
      return; // Cannot proceed without a scene
    }

    // Determine if text should be displayed based on mode and data validity
    const shouldDisplayText = editMode && isModelLoaded;
    let textNeedsUpdateOrCreation = false;
    let newTextContent = "";
    let newTextPosition: [number, number, number] | null = null;

    // Prepare text content and position if it should be displayed
    if (shouldDisplayText) {
      if (
        bodyPartMapping?.position &&
        Array.isArray(bodyPartMapping.position) &&
        bodyPartMapping.position.length === 3 &&
        // Ensure position values are valid numbers
        bodyPartMapping.position.every(p => typeof p === 'number' && isFinite(p)) &&
        selectedCategory && // Need category/placement for label
        currentPlacement
      ) {
        // Data is valid for text display
        newTextContent = `${selectedCategory} / ${currentPlacement}`; // Use '/' for brevity
        newTextPosition = bodyPartMapping.position as [number, number, number];
        textNeedsUpdateOrCreation = true; // Flag that text needs to be present/updated
      } else {
        // Conditions to display are met, but mapping data is bad - ensure text is hidden
        // console.warn(`${effectPrefix}: Cannot display text - invalid mapping position data.`, bodyPartMapping); // Less noisy log
        textNeedsUpdateOrCreation = false; // Ensure text is removed/not created
      }
    } else {
      // Not in edit mode or model not loaded - ensure text is hidden
      textNeedsUpdateOrCreation = false;
    }

    // Apply Changes to the Text Mesh
    const existingText = coordinateTextRef.current;

    if (textNeedsUpdateOrCreation && newTextPosition) {
      // --- Text should be visible and data is valid ---

      // If text mesh already exists, update its position
      if (existingText) {
        // Only log if position actually changed? For now, log on every valid update.
        // console.log(`${effectPrefix}: Updating existing text position to [${newTextPosition.map(p => p.toFixed(2)).join(',')}]`);
        existingText.position.set(...newTextPosition);
        // NOTE: If text *content* needs updating, you might need to recreate the mesh
        // using createCoordinateText, as updating canvas textures can be complex.
        // Assuming recreation if content changes (or always recreating for simplicity):
        // remove/dispose existingText, then create new one below.
        // For now, we only update position. If content changes, it might require recreating.
      } else {
        // Text doesn't exist, create it
        console.log(`${effectPrefix}: Creating new coordinate text: "${newTextContent}"`);
        try {
          const textMesh = createCoordinateText(newTextPosition, newTextContent);
          if (textMesh) {
            textMesh.userData.isCoordinateDisplay = true; // Mark for identification if needed
            textMesh.name = "CoordinateTextDisplay"; // Name for debugging
            scene.add(textMesh);
            coordinateTextRef.current = textMesh; // Store ref to the new mesh
            console.log(`${effectPrefix}: Text CREATED and added at [${newTextPosition.map(p => p.toFixed(2)).join(',')}]`);
          } else {
            console.error(`${effectPrefix}: createCoordinateText function returned null/undefined.`);
          }
        } catch (error) {
          console.error(`${effectPrefix}: Error calling createCoordinateText:`, error);
        }
      }
    } else {
      // --- Text should NOT be displayed (or data invalid) ---
      // If text mesh currently exists, remove and dispose of it
      if (existingText) {
        console.log(`${effectPrefix}: Conditions not met or data invalid. Removing existing text.`);
        if (existingText.parent === scene) { // Check parent before removing
          scene.remove(existingText);
        }
        disposeObjectResources(existingText);
        coordinateTextRef.current = null; // Clear the ref
        console.log(`${effectPrefix}: Text REMOVED and disposed.`);
      }
    }

    // Cleanup function for this effect: Removes text when dependencies change or component unmounts
    return () => {
      const effectCleanupPrefix = `${logPrefix} Effect 3 CLEANUP`;
      const currentText = coordinateTextRef.current;
      // Use the captured 'scene' value from the start of the effect for safe cleanup
      if (currentText && scene && currentText.parent === scene) {
          // console.log(`${effectCleanupPrefix}: Removing coordinate text.`); // Less noisy log
          scene.remove(currentText);
          disposeObjectResources(currentText);
          // Check ref hasn't been changed by another effect run before nullifying
          if (coordinateTextRef.current === currentText) {
             coordinateTextRef.current = null;
          }
      } else if (currentText) {
          // Scene might be gone, but we still have a text ref -> try disposing anyway
          // console.log(`${effectCleanupPrefix}: Scene gone or parent mismatch. Disposing text.`); // Less noisy log
          disposeObjectResources(currentText);
          if (coordinateTextRef.current === currentText) {
             coordinateTextRef.current = null;
          }
      }
    };
    // Dependencies driving text visibility, content, and position
  }, [
    sceneRef,
    editMode,
    isModelLoaded,
    bodyPartMapping, // Update text position/content if mapping changes
    selectedCategory,
    currentPlacement,
    // createCoordinateText // Include if its definition changes
  ]);

  // Return the ref to the sphere mesh so parent components or other hooks can access it if needed
  return highlightRef;
}