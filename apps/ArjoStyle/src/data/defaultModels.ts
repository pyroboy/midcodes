import { ModelConfigList } from '../types/models';
const MODEL_CONFIGS_KEY = 'tattoo-tide-model-configs';

/**
 * Default model configurations
 */
export const defaultModels: ModelConfigList = [
  {
    id: 'default-human',
    name: 'Default Human',
    url: 'https://res.cloudinary.com/dexcw6vg0/image/upload/v1741855043/male_low_poly_human_body_jtzm1e.glb',
    scale: [1, 1, 1],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    mappings: {} // Will be populated from defaultMappings.ts
  }
];

/**
 * Initialize default models in storage if none exist
 */
export const initializeDefaultModels = () => {
  console.group('🔄 [DefaultModels] Initializing Default Models Check');
  console.log('[DefaultModels] Starting initialization check...');

  // Use async function to handle dynamic imports and localStorage access
  const initializeModels = async () => {
    // Check localStorage availability first
    if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('[DefaultModels] localStorage not available. Skipping initialization.');
        console.groupEnd();
        return;
    }

    try {
      console.log('[DefaultModels] Loading modelManager module dynamically...');
      // Import module dynamically to break potential circular dependencies
      const modelManagerModule = await import('../utils/modelManager');

      // Ensure the expected functions are exported by the module
      if (!modelManagerModule || typeof modelManagerModule.loadModelConfigs !== 'function' || typeof modelManagerModule.saveModelConfigs !== 'function') {
          console.error('[DefaultModels] modelManager module or required functions (loadModelConfigs, saveModelConfigs) not found. Aborting initialization.');
          console.groupEnd();
          return;
      }
      const { loadModelConfigs, saveModelConfigs } = modelManagerModule;

      console.log('[DefaultModels] Checking for existing models using loadModelConfigs...');
      // loadModelConfigs should handle internal try/catch for localStorage access/parsing
      // and return [] if empty, invalid, or error.
      const existingModels = loadModelConfigs();

      // Add a safety check that loadModelConfigs returned an array
      if (!Array.isArray(existingModels)) {
          console.error(`[DefaultModels] loadModelConfigs did not return an array. Received: ${typeof existingModels}. Aborting initialization.`);
          // Log the actual item from storage for debugging if it exists
          try {
              const rawData = localStorage.getItem(MODEL_CONFIGS_KEY);
              console.error(`[DefaultModels] Raw data in localStorage for key "${MODEL_CONFIGS_KEY}": ${rawData ? rawData.substring(0, 200) + '...' : 'null'}`);
          } catch (e) { /* ignore localStorage read error here */ }
          console.groupEnd();
          return;
      }

      // --- Core Logic: Only initialize if no valid models were loaded ---
      if (existingModels.length === 0) {
        console.log('[DefaultModels] No valid existing models found. Attempting to save default models...');
        // saveModelConfigs should handle internal try/catch for localStorage write
        saveModelConfigs(defaultModels);
        console.log('[DefaultModels] ✅ Default models save operation initiated.');

        // --- Verification Step ---
        console.log('[DefaultModels] Verifying storage after save attempt...');
        let storedModelsRaw = null;
        try {
            storedModelsRaw = localStorage.getItem(MODEL_CONFIGS_KEY);
        } catch (e) {
             console.error('[DefaultModels] Error reading localStorage during verification:', e);
        }

        if (storedModelsRaw) {
          console.log(`[DefaultModels] ✅ Found raw data in localStorage for key "${MODEL_CONFIGS_KEY}". Verifying content...`);
          try {
            const parsedModels = JSON.parse(storedModelsRaw);
            if (Array.isArray(parsedModels) && parsedModels.length > 0 && parsedModels[0]?.id === defaultModels[0].id) {
                console.log(`[DefaultModels] ✅ Successfully parsed stored models. Count: ${parsedModels.length}. Default model ID matches.`);
            } else {
                 console.error(`[DefaultModels] ❌ Stored data for "${MODEL_CONFIGS_KEY}" seems invalid or empty after save. Parsed type: ${typeof parsedModels}`);
            }
          } catch (parseError) {
            console.error(`[DefaultModels] ❌ Failed to parse stored models from key "${MODEL_CONFIGS_KEY}" during verification:`, parseError);
            console.error(`[DefaultModels] Raw data snippet: ${storedModelsRaw.substring(0, 100)}...`);
          }
        } else {
          console.error(`[DefaultModels] ❌ Failed to find data in localStorage for key "${MODEL_CONFIGS_KEY}" after save attempt.`);
        }
        // --- End Verification Step ---

      } else {
        console.log(`[DefaultModels] Found ${existingModels.length} existing model(s). Skipping initialization.`);
      }
    } catch (error) {
      // Catch errors from dynamic import or unexpected issues
      console.error('[DefaultModels] ❌ Unexpected error during default model initialization process:', error);
    } finally {
         console.groupEnd(); // Ensure group is always ended
    }
  };

  // Schedule the async function to run.
  // The setTimeout helps ensure the module system is stable and potentially avoids race conditions at startup.
  // Adjust delay if needed, or consider triggering this from a main application initialization point.
  console.log('[DefaultModels] Scheduling initialization check with setTimeout...');
  setTimeout(initializeModels, 150); // Using a slightly different delay might help debug timing issues
};
// Initialize default models when this module is imported
// Use setTimeout to defer execution to next event loop tick
// This helps prevent issues during module initialization
console.log('🚀 Default Models module loaded - Calling initializeDefaultModels which will schedule the check.');
initializeDefaultModels(); // This now calls the function which sets the timeout internally