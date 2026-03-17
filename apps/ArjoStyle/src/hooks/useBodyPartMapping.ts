import { useState, useEffect, useMemo } from "react";
import { BodyPartMapping, BodyPartMappings } from "../types/mapping"; // Adjust path if needed
import { loadMappings } from "../utils/mappingStorage"; // Adjust path if needed
import { defaultMappings } from "../data/defaultMappings"; // Adjust path if needed

// Define a sensible default/fallback mapping structure
const ultimateFallbackMapping: BodyPartMapping = {
  position: [0, 0, 0] as [number, number, number],
  scale: 0.1,
  cameraAzimuth: 0,
  cameraPolar: Math.PI / 2,
  cameraDistance: 1.5,
  placementSizeLimits: { "min": 1, "max": 10, "multiplier": 1.2 },
  placementPainInfo: { "level": 5 }
};

export function useBodyPartMapping(
  modelId: string,
  propMappings: BodyPartMappings | undefined | null, // Allow null as prop
  selectedCategory: string,
  currentPlacement: string
): {
  bodyPartMapping: BodyPartMapping;
  areMappingsLoaded: boolean;
} {
  const [storedMappings, setStoredMappings] = useState<BodyPartMappings | null>(null);
  const [areMappingsLoaded, setAreMappingsLoaded] = useState(false);

  // Effect runs when modelId changes to load mappings from storage
  useEffect(() => {
    if (!modelId) {
      console.warn("[useBodyPartMapping Effect] modelId is missing. Skipping load.");
      setStoredMappings(null);
      setAreMappingsLoaded(true);
      return;
    }
    const logPrefix = `[useBodyPartMapping Effect(${modelId})]`;
    console.log(`${logPrefix} Loading stored mappings...`);
    setAreMappingsLoaded(false);
    let loaded: BodyPartMappings | null = null;
    try {
      loaded = loadMappings(modelId);
      // Log details inside loadMappings now
      setStoredMappings(loaded);
    } catch (error) {
      console.error(`${logPrefix} Critical error during loadMappings call:`, error);
      setStoredMappings(null);
    } finally {
      console.log(`${logPrefix} Loading attempt finished.`);
      setAreMappingsLoaded(true);
    }
  }, [modelId]);

  // Memoized calculation determines the *active* mapping based on current selection
  const bodyPartMapping = useMemo<BodyPartMapping>(() => {
    const logPrefix = `[useBodyPartMapping useMemo(${modelId})]`;

    // Always wait for initial load attempt before deciding
    if (!areMappingsLoaded) {
      console.log(`${logPrefix} Waiting for stored mappings load to complete... Returning ultimate fallback for now.`);
      return ultimateFallbackMapping;
    }

    if (selectedCategory && currentPlacement) {
      console.log(`${logPrefix} Determining mapping for: ${selectedCategory} / ${currentPlacement}`);

      // --- FIX: REVERSED PRIORITY ---

      // Priority 1: Check Prop Mappings (live state from parent)
      const prop = propMappings?.[selectedCategory]?.[currentPlacement];
      if (prop && typeof prop === 'object') {
        console.log(`${logPrefix} ✅ Using PROP mapping (Live State):`, JSON.stringify(prop));
        return prop; // Return live state first
      } else {
         console.log(`${logPrefix} ℹ️ No prop mapping found for this specific placement.`);
      }

      // Priority 2: Check Stored Mappings (loaded once on model change)
      const stored = storedMappings?.[selectedCategory]?.[currentPlacement];
      if (stored && typeof stored === 'object') {
        console.log(`${logPrefix} ✅ Using STORED mapping (Initial Load):`, JSON.stringify(stored));
        return stored; // Fallback to initially loaded data
      } else {
         console.log(`${logPrefix} ℹ️ No stored mapping found for this specific placement.`);
      }

      // Priority 3: Check Default Mappings
      const defaultMap = defaultMappings[selectedCategory]?.[currentPlacement];
      if (defaultMap && typeof defaultMap === 'object') {
        console.log(`${logPrefix} ✅ Using DEFAULT mapping:`, JSON.stringify(defaultMap));
        return defaultMap;
      } else {
         console.log(`${logPrefix} ℹ️ No default mapping found for this specific placement.`);
      }

      // Ultimate Fallback
      console.warn(`${logPrefix} ⚠️ No specific mapping found for ${selectedCategory}/${currentPlacement} in props, stored, or defaults. Using ultimate fallback.`);
      return ultimateFallbackMapping;

    } else {
      console.warn(`${logPrefix} Category ('${selectedCategory}') or Placement ('${currentPlacement}') is missing/invalid. Using ultimate fallback.`);
      return ultimateFallbackMapping;
    }
  }, [
    selectedCategory,
    currentPlacement,
    // Ensure correct dependencies: propMappings (live state) must be here!
    propMappings,
    storedMappings, // State holding initially loaded data
    areMappingsLoaded,
    modelId
  ]);

  // Ensure the log right before return shows the value determined by the logic above
  console.log(`[useBodyPartMapping] Returning final mapping for ${selectedCategory}/${currentPlacement}:`, JSON.stringify(bodyPartMapping));

  return { bodyPartMapping, areMappingsLoaded };
}