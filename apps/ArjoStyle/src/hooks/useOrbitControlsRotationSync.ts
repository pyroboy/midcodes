import { useEffect, useCallback, useRef, useState } from 'react';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PerspectiveCamera, Euler } from 'three';
import type { BodyPartMapping } from '../types/mapping';

// Debounce utility function (adjust delay as needed)
// Use generic types for better safety
const debounce = <T extends unknown[]>(func: (...args: T) => void, waitFor: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: T): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
};

// Helper to convert radians to degrees and format
const formatDegrees = (radians: number): number => {
    // Normalize degrees to be within [0, 360)
    let degrees = (radians * 180) / Math.PI;
    degrees = ((degrees % 360) + 360) % 360; // Ensure positive modulo
    return parseFloat(degrees.toFixed(2)); // Keep two decimal places
};

// Define the type for the partial update the hook will send
// Only includes properties the hook is responsible for updating
// NOTE: BodyPartMapping does not have a 'rotation' field. Use the correct key or define it inline.
export type RotationMappingUpdate = {
  rotation: [number, number, number];
};

interface UseOrbitControlsRotationSyncProps {
    controlsRef: React.RefObject<OrbitControls | null>;
    cameraRef: React.RefObject<PerspectiveCamera | null>;
    editMode: boolean;
    onMappingUpdate: (updatedRotation: RotationMappingUpdate) => void;
    debounceDelay?: number; // Debounce for the 'end' event
}

/**
 * Custom hook to synchronize OrbitControls camera rotation changes
 * with a BodyPartMapping update when in edit mode.
 */
export const useOrbitControlsRotationSync = ({
    controlsRef,
    cameraRef,
    editMode,
    onMappingUpdate,
    debounceDelay = 300, // Debounce applied to the 'end' event handler
}: UseOrbitControlsRotationSyncProps): void => {

    const previousRotationRef = useRef<Euler | null>(null);
    // State to track if interaction is ongoing (optional, but can be useful)
    const [isInteracting, setIsInteracting] = useState(false);

    // The core logic to calculate and call onMappingUpdate
    const handleInteractionEnd = useCallback(() => {
        setIsInteracting(false); // Mark interaction as ended

        if (!editMode || !onMappingUpdate || !cameraRef.current) {
            // console.log('Rotation Sync (End): Skipping update (not edit mode or missing refs/props)');
            return;
        }

        const currentRotation = cameraRef.current.rotation;

        // Compare with the rotation *before* this interaction sequence started,
        // OR just update unconditionally on end, assuming any interaction warrants an update.
        // Let's update unconditionally on 'end' for simplicity now.

        // Optional threshold check against previous saved state can still be added here if desired
        // if (!previousRotationRef.current || ...)

        const rotationDegrees: [number, number, number] = [
            formatDegrees(currentRotation.x),
            formatDegrees(currentRotation.y),
            formatDegrees(currentRotation.z),
        ];

        console.log(`Rotation Sync (End): Calling onMappingUpdate with rotation:`, rotationDegrees);
        onMappingUpdate({
            rotation: rotationDegrees,
        });

        // Update the reference *after* potentially updating
        previousRotationRef.current = currentRotation.clone();

    }, [editMode, onMappingUpdate, cameraRef]); // Dependencies for the core logic

    // Debounce the end handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedEndHandler = useCallback(
        debounce(handleInteractionEnd, debounceDelay),
        [handleInteractionEnd, debounceDelay] // Recreate if logic or delay changes
    );

    // Handler for when interaction starts
    const handleInteractionStart = useCallback(() => {
        setIsInteracting(true);
        // Optionally store the rotation *at the start* of interaction if needed for comparison later
        if (cameraRef.current) {
             previousRotationRef.current = cameraRef.current.rotation.clone();
        }
        // console.log('Rotation Sync: Interaction Start');
    }, [cameraRef]);


    // Effect to add/remove event listeners
    useEffect(() => {
        const controls = controlsRef.current;
        if (controls && editMode) {
            // console.log('Rotation Sync: Adding start/end listeners');
            controls.addEventListener('start', handleInteractionStart);
            controls.addEventListener('end', debouncedEndHandler);

            // No longer need the 'change' listener for triggering updates
            // controls.addEventListener('change', someChangeHandlerIfNeeded);

            return () => {
                // console.log('Rotation Sync: Removing start/end listeners');
                controls.removeEventListener('start', handleInteractionStart);
                controls.removeEventListener('end', debouncedEndHandler);
                // controls.removeEventListener('change', someChangeHandlerIfNeeded);
            };
        } else if (controls) {
            // Ensure listeners are removed if we switch out of edit mode or controls change
            // console.log('Rotation Sync: Not in edit mode, ensuring listeners removed.');
            controls.removeEventListener('start', handleInteractionStart);
            controls.removeEventListener('end', debouncedEndHandler);
            // controls.removeEventListener('change', someChangeHandlerIfNeeded);
        }
        return undefined;
    }, [controlsRef, editMode, handleInteractionStart, debouncedEndHandler]); // Dependencies for setting up listeners

};
