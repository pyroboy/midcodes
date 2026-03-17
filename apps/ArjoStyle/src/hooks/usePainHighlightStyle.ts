import { useMemo } from "react";
import * as THREE from "three";
import { BodyPartMapping } from "@/types/mapping"; // Adjust path if needed

// Define the structure for color stops
export interface PainColorStop {
  level: number;
  color: THREE.Color; // Use THREE.Color directly
}

// Define the color stops (ensure sorted by level ascending)
// You can customize these colors
const defaultPainColors: PainColorStop[] = [
  { level: 1, color: new THREE.Color("#00FF80") }, // Teal green
  { level: 2, color: new THREE.Color("#00FF40") }, // Light green
  { level: 3, color: new THREE.Color("#00FF00") }, // Pure green
  { level: 4, color: new THREE.Color("#80FF00") }, // Chartreuse
  { level: 5, color: new THREE.Color("#FFFF00") }, // Pure yellow
  { level: 6, color: new THREE.Color("#FFBF00") }, // Amber
  { level: 7, color: new THREE.Color("#FF8000") }, // Pure orange
  { level: 8, color: new THREE.Color("#FF4000") }, // Orange-red
  { level: 9, color: new THREE.Color("#FF2000") }, // Bright red
  { level: 10, color: new THREE.Color("#FF0000") }, // Pure red
].sort((a, b) => a.level - b.level); // Ensure sorted just in case

// Define default/fallback styles
const NO_PAIN_INFO_COLOR = new THREE.Color("#9ca3af"); // Tailwind gray-400
const DEFAULT_OPACITY = 0.73; // Default opacity for pain levels
const EDIT_MODE_COLOR = new THREE.Color("#60a5fa"); // Tailwind blue-400 (example)
const EDIT_MODE_OPACITY = 0.6; // Slightly more opaque in edit mode

export interface HighlightStyle {
  color: THREE.Color;
  opacity: number;
}

/**
 * Hook to determine the highlight sphere's color and opacity based on
 * the mapping's pain level or edit mode.
 *
 * @param mapping - The BodyPartMapping object containing placementPainInfo.
 * @param editMode - Boolean indicating if the viewer is in edit mode.
 * @returns An object containing the calculated THREE.Color and opacity.
 */
export const usePainHighlightStyle = (
  mapping: BodyPartMapping | null | undefined,
  editMode: boolean
): HighlightStyle => {
  const highlightStyle = useMemo<HighlightStyle>(() => {
    // --- Edit Mode ---
    // If in edit mode, always return the specific edit mode style
    if (editMode) {
      return { color: EDIT_MODE_COLOR, opacity: EDIT_MODE_OPACITY };
    }

    // --- View Mode (Pain Level Calculation) ---
    const painLevel = mapping?.placementPainInfo?.level;

    // Check if painLevel is a valid number greater than 0
    if (
      typeof painLevel !== "number" ||
      !isFinite(painLevel) ||
      painLevel <= 0
    ) {
      // No valid pain level provided, use the default "no info" style
      return { color: NO_PAIN_INFO_COLOR, opacity: DEFAULT_OPACITY };
    }

    // Find the appropriate color stop
    for (const painStop of defaultPainColors) {
      if (painLevel <= painStop.level) {
        // Found the first threshold the pain level meets or falls below
        return { color: painStop.color, opacity: DEFAULT_OPACITY };
      }
    }

    // If painLevel is higher than the highest defined level, use the highest color
    if (defaultPainColors.length > 0) {
      const highestStop = defaultPainColors[defaultPainColors.length - 1];
      return { color: highestStop.color, opacity: DEFAULT_OPACITY };
    }

    // Fallback if defaultPainColors is empty (shouldn't happen with the definition above)
    return { color: NO_PAIN_INFO_COLOR, opacity: DEFAULT_OPACITY };
  }, [mapping, editMode]); // Recalculate only when mapping or editMode changes

  return highlightStyle;
};
