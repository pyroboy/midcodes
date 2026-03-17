import { BodyPartMapping, BodyPartMappings } from '../types/mapping'; // Adjust path if needed

export const MAPPINGS_KEY_PREFIX = 'tattoo-tide-mappings-';

/**
 * Save body part mappings to localStorage for a specific model
 */
export const saveMappings = (modelId: string, mappings: BodyPartMappings): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn(`[saveMappings(${modelId})] localStorage not available. Skipping save.`);
    return;
  }
  try {
    const key = `${MAPPINGS_KEY_PREFIX}${modelId}`;
    localStorage.setItem(key, JSON.stringify(mappings));
    console.log(`✅ Successfully saved mappings for model ${modelId} with key ${key}`);
  } catch (error) {
    console.error(`Error saving mappings for model ${modelId}:`, error);
    // Consider re-throwing or providing more user feedback if saving is critical
  }
};

/**
 * Load body part mappings from localStorage for a specific model
 */
export const loadMappings = (modelId: string): BodyPartMappings | null => {
  const logPrefix = `[loadMappings(${modelId})]`;

  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn(`${logPrefix} localStorage not available.`);
    return null;
  }

  const key = `${MAPPINGS_KEY_PREFIX}${modelId}`;
  console.log(`${logPrefix} Attempting to load item with key: ${key}`);

  // -------- FIX APPLIED: Removed the faulty 'if (localStorage.getItem(key) !== null)' block --------
  // The code below will now run on every load attempt, allowing full validation and logging.

  let storedMappings: string | null = null;
  try {
    storedMappings = localStorage.getItem(key); // Get item

    if (!storedMappings) {
      // This is normal if no mappings have been saved yet for this model.
      console.log(`${logPrefix} No item found in localStorage for key: ${key}. Returning null.`);
      return null;
    }
    console.log(`${logPrefix} Found raw data for key ${key}. Length: ${storedMappings.length}`);

    console.log(`${logPrefix} Attempting JSON.parse...`);
    const parsedJson = JSON.parse(storedMappings);
    console.log(`${logPrefix} JSON.parse successful.`);
    console.log(`${logPrefix} Type of parsed JSON data: ${typeof parsedJson}`);

    // Basic type check first
    if (typeof parsedJson !== 'object' || parsedJson === null) {
      console.error(`${logPrefix} Parsed data for key ${key} is not a valid object. Actual type: ${typeof parsedJson}. Raw data: ${storedMappings.substring(0, 100)}... Removing invalid data.`);
      // Optionally remove corrupted data
      // localStorage.removeItem(key);
      return null;
    }

    // Assert the specific type *after* the basic check
    // You might want more robust validation here depending on needs
    const parsedMappings = parsedJson as BodyPartMappings;

    // Log counts using the typed variable + add safety checks
    try {
        const categoryKeys = Object.keys(parsedMappings);
        const numPlacements = Object.values(parsedMappings).reduce((acc: number, category) => {
            if (typeof category === 'object' && category !== null) {
                // Ensure placement values are also objects before counting
                return acc + Object.keys(category).filter(placementKey =>
                    typeof category[placementKey] === 'object' && category[placementKey] !== null
                ).length;
            }
            console.warn(`${logPrefix} Encountered non-object category during placement count.`);
            return acc;
        }, 0);

        console.log(`${logPrefix} Number of categories found: ${categoryKeys.length}`);
        console.log(`${logPrefix} Total number of valid placements found: ${numPlacements}`);
    } catch (e) {
         console.error(`${logPrefix} Error calculating counts from parsed data:`, e);
         // Consider returning null if structure is critically wrong
    }

    // Return the typed object (further validation might happen in validateMappings if used during import)
    console.log(`${logPrefix} Parsed data structure appears valid. Returning.`);
    return parsedMappings;

  } catch (error) {
    // Catches JSON.parse errors or other unexpected issues
    console.error(`${logPrefix} CRITICAL ERROR loading or parsing mappings for key ${key}:`, error);
    console.error(`${logPrefix} Raw data causing error: ${storedMappings ? storedMappings.substring(0, 200) + '...' : '(unable to read raw data)'}`);
    // Consider removing the item if parsing fails consistently
    // localStorage.removeItem(key);
    return null;
  }
};

/**
 * Export mappings to a JSON file for download
 */
export const exportMappingsToJson = (modelId: string, modelName: string): void => {
  const mappings = loadMappings(modelId);

  if (!mappings) {
    alert('No mappings found to export for model ID: ' + modelId);
    console.warn(`[exportMappingsToJson] No mappings loaded for model ${modelId}.`);
    return;
  }

  try {
    // Create a JSON blob
    const jsonData = JSON.stringify(mappings, null, 2); // Pretty print JSON
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    // Sanitize filename
    const safeModelName = modelName.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'model';
    link.download = `${safeModelName}-mappings-${modelId}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`[exportMappingsToJson] Successfully initiated download for model ${modelId}.`);
  } catch (error) {
    console.error(`[exportMappingsToJson] Error during export for model ${modelId}:`, error);
    alert('Failed to export mappings. Check console for details.');
  }
};

/**
 * Import mappings from a JSON file
 */
export const importMappingsFromJson = (modelId: string, file: File): Promise<BodyPartMappings> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || file.type !== 'application/json') {
        return reject(new Error('Invalid file type. Please select a JSON file.'));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          return reject(new Error('Failed to read file content.'));
        }

        const jsonString = event.target.result as string;
        const mappings = JSON.parse(jsonString) as BodyPartMappings;

        // Validate mappings structure *before* saving
        if (!validateMappings(mappings)) {
          // Provide more specific feedback if possible from validateMappings
          return reject(new Error('Invalid mappings format in JSON file.'));
        }

        // Save validated mappings to localStorage
        saveMappings(modelId, mappings);
        console.log(`[importMappingsFromJson] Successfully imported and saved mappings for model ${modelId} from file ${file.name}.`);
        resolve(mappings); // Resolve with the imported mappings

      } catch (error) {
        console.error(`[importMappingsFromJson] Error parsing or processing file ${file.name}:`, error);
        if (error instanceof SyntaxError) {
            reject(new Error(`Failed to parse JSON file: ${error.message}`));
        } else if (error instanceof Error) {
             reject(error); // Use the error message from validateMappings or other errors
        } else {
             reject(new Error('An unknown error occurred during import.'));
        }
      }
    };

    reader.onerror = (event) => {
      console.error(`[importMappingsFromJson] FileReader error occurred for file ${file.name}:`, event);
      reject(new Error('Error reading file.'));
    };

    reader.readAsText(file);
  });
};

/**
 * Import mappings from a JSON string
 */
export const importMappingsFromJsonString = (modelId: string, jsonString: string): BodyPartMappings => {
  // Added log prefix for clarity
   const logPrefix = `[importMappingsFromJsonString(${modelId})]`;
  try {
    console.log(`${logPrefix} Attempting to parse JSON string...`);
    const mappings = JSON.parse(jsonString) as BodyPartMappings;
    console.log(`${logPrefix} JSON parsing successful. Validating structure...`);

    // Validate mappings structure
    if (!validateMappings(mappings)) {
       console.error(`${logPrefix} Validation failed.`);
      throw new Error('Invalid mappings format provided in JSON string.');
    }
     console.log(`${logPrefix} Validation successful. Saving mappings...`);

    // Save validated mappings to localStorage
    saveMappings(modelId, mappings);
    console.log(`${logPrefix} Mappings saved successfully.`);

    return mappings;
  } catch (error) {
    console.error(`${logPrefix} Error importing mappings:`, error);
    // Re-throw the original error for the caller to handle
    throw error;
  }
};

/**
 * Validate the structure of mappings based on expected BodyPartMapping fields.
 * NOTE: Adjust checks to match your ACTUAL BodyPartMapping type definition.
 */
export const validateMappings = (mappings: unknown): mappings is BodyPartMappings => {
  if (!mappings || typeof mappings !== 'object' || Array.isArray(mappings)) {
     console.error('[validateMappings] Root level is not a valid object.');
    return false;
  }

  // Check if each category is an object containing placement objects
  for (const categoryKey in mappings as Record<string, unknown>) {
      const categoryValue = (mappings as Record<string, unknown>)[categoryKey];
    if (!categoryValue || typeof categoryValue !== 'object' || Array.isArray(categoryValue)) {
        console.error(`[validateMappings] Category "${categoryKey}" is not a valid object.`);
      return false;
    }

    // Check if each placement within the category is an object matching BodyPartMapping structure
    for (const placementKey in categoryValue as Record<string, unknown>) {
        const mapping = (categoryValue as Record<string, unknown>)[placementKey];

      // Check if mapping itself is an object
      if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
           console.error(`[validateMappings] Placement "${placementKey}" in category "${categoryKey}" is not a valid object.`);
           return false;
      }

      const mappingRecord = mapping as Record<string, unknown>;

      // --- Adjust checks below to match your BodyPartMapping type ---
      const hasValidPosition = Array.isArray(mappingRecord.position) &&
                               mappingRecord.position.length === 3 &&
                               mappingRecord.position.every(p => typeof p === 'number');

      // Rotation check removed - add back ONLY if your type includes it
      // const hasValidRotation = Array.isArray(mappingRecord.rotation) &&
      //                          mappingRecord.rotation.length === 3 &&
      //                          mappingRecord.rotation.every(r => typeof r === 'number');

      const hasValidScale = typeof mappingRecord.scale === 'number';

      // Add checks for camera properties if they are mandatory
      const hasValidCameraAzimuth = typeof mappingRecord.cameraAzimuth === 'number';
      const hasValidCameraPolar = typeof mappingRecord.cameraPolar === 'number';
      const hasValidCameraDistance = typeof mappingRecord.cameraDistance === 'number';
      // --- End of type-specific checks ---


      // Combine checks (adjust based on which fields are mandatory)
      // Assumes position, scale, and camera fields are always expected
      if (!hasValidPosition || !hasValidScale || !hasValidCameraAzimuth || !hasValidCameraPolar || !hasValidCameraDistance) {
        console.error(`[validateMappings] Placement "${placementKey}" in category "${categoryKey}" has invalid structure or missing fields. Position: ${hasValidPosition}, Scale: ${hasValidScale}, CamAzimuth: ${hasValidCameraAzimuth}, CamPolar: ${hasValidCameraPolar}, CamDistance: ${hasValidCameraDistance}`);
        console.error(`[validateMappings] Offending mapping data:`, JSON.stringify(mappingRecord));
        return false;
      }
    }
  }
  // If all checks pass
  return true;
};


/**
 * Debug utility to inspect all mappings in localStorage
 */
export const debugMappings = () => {
  console.groupCollapsed('🔍 Tattoo Tide Mappings Debug');

  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage not available. Skipping debug.');
    console.groupEnd();
    return; // This function implicitly returns void
  }

  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(MAPPINGS_KEY_PREFIX));
    console.log(`Found ${keys.length} mapping keys in localStorage:`, keys);

    if (keys.length === 0) {
      console.log('No mappings found matching prefix.');
    }

    keys.forEach(key => {
      // Improved modelId extraction: get substring after the prefix
       const modelId = key.substring(MAPPINGS_KEY_PREFIX.length);

      if (!modelId) { // Check if modelId is empty after removing prefix
          console.warn(`Could not extract valid modelId from key: ${key}. Skipping.`);
          return;
      }

      console.log(`\n--- Debugging Key: ${key} (Extracted Model ID: ${modelId}) ---`);
      const mappings = loadMappings(modelId); // Call the enhanced loadMappings

      if (!mappings) {
        // loadMappings now logs detailed errors
        console.error(`[debugMappings] Confirmed: loadMappings returned null for model ${modelId} (key: ${key}). Check previous logs from loadMappings for details.`);
      } else {
         try {
           const categories = Object.keys(mappings);
           const totalPlacements = categories.reduce((count, categoryKey) => {
               const category = mappings[categoryKey];
               // Ensure category is an object before counting keys
               return count + (typeof category === 'object' && category !== null ? Object.keys(category).length : 0);
           }, 0);
           console.log(`[debugMappings] ✅ Successfully loaded and parsed. Found ${categories.length} categories with ${totalPlacements} total placements for model ${modelId}.`);
           // Optionally log the mapping object itself for deeper inspection
           // console.log(`[debugMappings] Content for ${modelId}:`, mappings);
         } catch (error) {
             console.error(`[debugMappings] ❌ Error processing loaded mappings structure for ${modelId}:`, error);
         }
      }
    });
  } catch (error) {
      console.error('[debugMappings] An unexpected error occurred while iterating localStorage keys:', error);
  } finally {
      console.groupEnd();
  }
  // No explicit return needed for a void function
};