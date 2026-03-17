import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Assume DRACO decoder files are served from this path or adjust as needed
const DRACO_DECODER_PATH =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

export function useModelLoader(
  sceneRef: React.RefObject<THREE.Scene | null>,
  modelUrl: string | undefined,
  isColor: boolean
): {
  modelRef: React.MutableRefObject<THREE.Group | null>;
  isModelLoaded: boolean;
  hasError: boolean;
} {
  const modelRef = useRef<THREE.Group | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const currentModelUrl = useRef<string | undefined>(undefined); // Track loaded URL

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelUrl) {
      // Clear previous model if URL/scene becomes invalid
      if (modelRef.current && modelRef.current.parent === scene) {
        scene?.remove(modelRef.current);
        // Note: Geometry/Material disposal is handled by useThreeSetup cleanup
        modelRef.current = null;
      }
      setIsModelLoaded(false);
      currentModelUrl.current = undefined;
      return;
    }

    // Only reload if modelUrl has changed
    if (modelUrl === currentModelUrl.current && modelRef.current) {
      // Model already loaded, maybe just update color?
      modelRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const color = isColor ? 0x888888 : 0xffffff;
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              if (
                mat instanceof THREE.MeshStandardMaterial ||
                mat instanceof THREE.MeshBasicMaterial
              )
                mat.color.setHex(color);
            });
          } else if (
            object.material instanceof THREE.MeshStandardMaterial ||
            object.material instanceof THREE.MeshBasicMaterial
          ) {
            object.material.color.setHex(color);
          }
        }
      });
      setIsModelLoaded(true); // Ensure it's marked as loaded
      return;
    }

    console.log(`[useModelLoader] Loading model: ${modelUrl}`);
    setIsModelLoaded(false);
    setHasError(false);

    // --- Cleanup previous model before loading new one ---
    if (modelRef.current && modelRef.current.parent === scene) {
      console.log("[useModelLoader] Removing previous model from scene.");
      scene.remove(modelRef.current);
      // Rely on useThreeSetup for actual disposal of geometry/materials during scene cleanup
      modelRef.current = null;
    }
    // --- End Cleanup ---

    const manager = new THREE.LoadingManager();
    const dracoLoader = new DRACOLoader(manager);
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader(manager);
    loader.setDRACOLoader(dracoLoader);

    let isMounted = true; // Track mount status for async operation

    manager.onError = (url) => {
      if (!isMounted) return;
      console.error(`[useModelLoader] Error loading model: ${url}`);
      setHasError(true);
      setIsModelLoaded(false);
      modelRef.current = null;
      currentModelUrl.current = undefined;
    };

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMounted || !sceneRef.current) return; // Check mount status and scene validity again
        console.log("[useModelLoader] Model loaded successfully.");
        const model = gltf.scene;

        model.scale.set(1, 1, 1);
        model.position.set(0, -1, 0); // Default position
        model.rotation.set(0, 0, 0);
        model.userData.modelUrl = modelUrl; // Store URL for change detection

        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.material) {
              object.material.side = THREE.DoubleSide;
              const color = isColor ? 0x888888 : 0xffffff;
              if (Array.isArray(object.material)) {
                object.material.forEach((mat) => {
                  if (
                    mat instanceof THREE.MeshStandardMaterial ||
                    mat instanceof THREE.MeshBasicMaterial
                  )
                    mat.color.setHex(color);
                });
              } else if (
                object.material instanceof THREE.MeshStandardMaterial ||
                object.material instanceof THREE.MeshBasicMaterial
              ) {
                object.material.color.setHex(color);
              }
            }
          }
        });

        sceneRef.current.add(model);
        modelRef.current = model;
        currentModelUrl.current = modelUrl; // Update tracked URL
        setIsModelLoaded(true);
        setHasError(false);
      },
      (xhr) => {
        // Loading progress - Optional: expose progress state if needed
        // const progress = (xhr.loaded / xhr.total) * 100;
        // console.log(`[useModelLoader] Loading progress: ${Math.round(progress)}%`);
      },
      (error) => {
        // This is often caught by manager.onError, but handle here too just in case
        if (!isMounted) return;
        console.error("[useModelLoader] GLTFLoader error callback:", error);
        setHasError(true);
        setIsModelLoaded(false);
        modelRef.current = null;
        currentModelUrl.current = undefined;
      }
    );

    return () => {
      isMounted = false;
      // Note: Don't remove the model here directly on unmount,
      // let useThreeSetup handle scene cleanup. Only remove if dependencies change.
      console.log("[useModelLoader] Unmount/dependency change cleanup.");
    };
  }, [modelUrl, sceneRef, isColor]); // Rerun if modelUrl, sceneRef instance, or isColor changes

  return { modelRef, isModelLoaded, hasError };
}
