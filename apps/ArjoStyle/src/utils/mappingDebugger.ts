import { debugMappings } from './mappingStorage';
import { forceLoadDefaultMappings, verifyMappingsForModel } from './forceMappings';

/**
 * Comprehensive mapping debugging and repair utility
 * This utility helps diagnose and fix issues with body part mappings
 */
export const runMappingDiagnostics = () => {
  console.group('🔍 Running Tattoo Tide Mapping Diagnostics');
  
  try {
    console.log('Step 1: Checking for existing mappings...');
    // Check if any mappings exist
    const hasMappings = debugMappings();
    
    if (!hasMappings) {
      console.log('Step 2: No mappings found, attempting to force load default mappings...');
      // If no mappings exist, try to force load them
      const forceLoadSuccess = forceLoadDefaultMappings();
      
      if (forceLoadSuccess) {
        console.log('✅ Successfully force loaded default mappings');
      } else {
        console.error('❌ Failed to force load default mappings');
      }
    } else {
      console.log('✅ Existing mappings found, verifying default model mappings...');
      // Verify the default model mappings
      const defaultModelMappings = verifyMappingsForModel('default-human');
      
      if (!defaultModelMappings) {
        console.log('Step 3: Default model mappings not found, attempting to force load...');
        // If default model mappings don't exist, try to force load them
        const forceLoadSuccess = forceLoadDefaultMappings();
        
        if (forceLoadSuccess) {
          console.log('✅ Successfully force loaded default mappings');
        } else {
          console.error('❌ Failed to force load default mappings');
        }
      } else {
        console.log('✅ Default model mappings verified successfully');
      }
    }
    
    // Final verification
    // console.log('Final verification of mappings:');
    // debugMappings();
    
  } catch (error) {
    console.error('❌ Error during mapping diagnostics:', error);
  }
  
  console.groupEnd();
};

/**
 * Run mapping diagnostics on application startup
 * This should be called early in the application lifecycle
 */
export const initializeMappingDiagnostics = () => {
  // Use setTimeout to ensure this runs after the application has initialized
  setTimeout(() => {
    console.log('🚀 Running mapping diagnostics on application startup');
    runMappingDiagnostics();
  }, 500);
};
