// src/components/three/Model.tsx
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib'; // Import GLTF type for better typing

// Extend GLTF result type if needed, e.g., for specific node names
// interface CustomGLTF extends GLTF {
//   nodes: { [name: string]: THREE.Mesh };
//   materials: { [name: string]: THREE.Material };
// }

interface ModelProps {
  modelUrl: string;
  isColor: boolean;
  onLoad?: (model: THREE.Group) => void;
  onError?: (error: Error | unknown) => void; // Accept Error or unknown
}

// Optional: Preload models if URLs are known ahead of time
// useGLTF.preload(YOUR_MODEL_URL);

export function Model({ modelUrl, isColor, onLoad, onError }: ModelProps) {
  // Note: useGLTF throws an error during suspense if loading fails,
  // which should be caught by an ErrorBoundary higher up.
  // The `onError` prop here serves as a secondary notification mechanism
  // after the initial load attempt.
  const { scene /* , parser */ } = useGLTF(modelUrl, true) /* as CustomGLTF */; // Cast if using custom type

  useEffect(() => {
    // scene will be populated once loaded successfully by useGLTF
    if (scene) {
        console.log(`[Model] Processing loaded model: ${modelUrl}`);
        const model = scene; // Use the loaded scene directly

        // --- Apply Initial Transformations ---
        // It's often better to handle positioning/scaling in the parent
        // component or scene setup, but applying defaults here is possible.
        model.scale.set(1, 1, 1);     // Default scale
        model.position.set(0, -1, 0); // Default position (adjust Y to place base at origin)
        model.rotation.set(0, 0, 0);   // Default rotation

        // --- Apply Material Settings ---
        const colorValue = isColor ? 0x888888 : 0xffffff; // Grey if color, white otherwise
        model.traverse((object) => {
            // Check if it's a Mesh with a material
            if (object instanceof THREE.Mesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];

                materials.forEach((material) => {
                    // Ensure double side rendering if models require it (e.g., clothing planes)
                    // This can impact performance, only enable if necessary.
                     material.side = THREE.DoubleSide;

                    // Apply color based on isColor prop
                    if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
                        material.color.setHex(colorValue);
                    }

                    // Optional: Other material adjustments
                    // if (material instanceof THREE.MeshStandardMaterial) {
                    //   material.roughness = 0.8;
                    //   material.metalness = 0.1;
                    // }

                    // Optional: Mark material for update if properties changed drastically
                    // material.needsUpdate = true;
                });
            }
        });

        // --- Invoke onLoad Callback ---
        if (onLoad) {
            try {
                 onLoad(model.clone()); // Pass a clone to prevent accidental modification? Or pass original.
                 console.log(`[Model] Model processed and onLoad called.`);
            } catch (e) {
                 console.error("[Model] Error executing onLoad callback:", e);
                 if(onError) onError(e); // Notify about error in callback itself
            }

        }
    }
    // No explicit 'else if' for error needed here, as useGLTF handles errors via Suspense/ErrorBoundary.
    // The `onError` prop could be used if useGLTF provided a direct error callback, but it doesn't.
    // We rely on the parent component's error handling.

    // Dependencies: Rerun effect if any of these change.
  }, [scene, modelUrl, isColor, onLoad, onError]);

  // Render the loaded scene as a primitive
  // 'key' prop ensures component remounts and reloads if modelUrl changes
  // Returns null while loading (handled by <Suspense>)
  return scene ? <primitive object={scene} key={modelUrl} /> : null;
}

// Optional: Default props
// Model.defaultProps = {
//   isColor: true,
// };