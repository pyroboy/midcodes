import { defaultMappings } from '../data/defaultMappings';
import { saveMappings, loadMappings, debugMappings } from './mappingStorage';

/**
 * Force load the default mappings for the default human model
 * This is a utility function to ensure mappings are properly loaded
 * when the normal initialization sequence might be failing
 */
export const forceLoadDefaultMappings = () => {
  console.group('🔄 Force Loading Default Mappings');
  console.log('Forcing default mappings to load for default-human model');
  
  try {
    // Force-save the default mappings for the default model
    // saveMappings('default-human', defaultMappings);
    
    // Verify storage
    const stored = localStorage.getItem('tattoo-tide-mappings-default-human');
    if (stored) {
      console.log('✅ Mappings stored successfully');
      
      // Parse and validate the stored mappings
      try {
        const parsedMappings = JSON.parse(stored);
        const categories = Object.keys(parsedMappings);
        console.log(`Stored ${categories.length} categories with a total of ${
          categories.reduce((count, category) => count + Object.keys(parsedMappings[category]).length, 0)
        } placements`);
      } catch (parseError) {
        console.error('❌ Failed to parse stored mappings:', parseError);
      }
    } else {
      console.error('❌ Failed to store mappings in localStorage');
    }
    
    // Run the debug utility to show all mappings
    // debugMappings();
    
  } catch (error) {
    console.error('❌ Error during force load:', error);
  }
  
  console.groupEnd();
  
  return !!localStorage.getItem('tattoo-tide-mappings-default-human');
};

/**
 * Verify that mappings can be loaded for a specific model
 * Returns the mappings if successful, null otherwise
 */
export const verifyMappingsForModel = (modelId: string) => {
  console.log(`Verifying mappings for model: ${modelId}`);
  const mappings = loadMappings(modelId);
  
  if (!mappings) {
    console.warn(`⚠️ No mappings found for model ${modelId}`);
    return null;
  }
  
  console.log(`✅ Successfully loaded mappings for model ${modelId}`);
  return mappings;
};
