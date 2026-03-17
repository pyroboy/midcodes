import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ModelConfig } from '../../types/models';
import { BodyPartMapping, BodyPartMappings } from '../../types/mapping'; // Ensure type is imported
import { loadModelConfigs, saveModelConfigs, getModelConfig, updateModelConfig } from '../../utils/modelManager';
import { loadMappings, saveMappings } from '../../utils/mappingStorage';
import { defaultMappings } from '../../data/defaultMappings';
import ModelSelector from './ModelSelector';
import MappingControls from './MappingControls';
import MappingPreview from './MappingPreview';
import ImportExportTools from './ImportExportTools';
import { toast } from 'sonner'; // Added toast import

const ModelMappingEditor: React.FC = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [placements, setPlacements] = useState<string[]>([]);
  const [mappings, setMappings] = useState<BodyPartMappings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // New state for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialMappingRef = useRef<BodyPartMapping | null>(null);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = () => {
      try {
        const availableModels = loadModelConfigs();
        setModels(availableModels);
        
        if (availableModels.length > 0) {
          setSelectedModelId(availableModels[0].id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setStatusMessage('Error loading models. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadModels();
  }, []);

  // Load categories and the full mappings object when model changes
  useEffect(() => {
    if (!selectedModelId) return;
    
    let loadedMappings: BodyPartMappings = {}; // Define scope outside try
    const loadModelData = () => {
      try {
        // Load mappings for the selected model
        loadedMappings = loadMappings(selectedModelId) || defaultMappings;
        console.log('[ModelMappingEditor] Loaded mappings for model', selectedModelId, ':', loadedMappings); // <-- Add Log
        
        // *** Store the complete mappings object in state ***
        setMappings(loadedMappings);
        
        // Extract categories from the loaded mappings
        const modelCategories = Object.keys(loadedMappings);
        setCategories(modelCategories);
        
        // Reset category/placement when model changes to avoid invalid states
        if (modelCategories.length > 0) {
          const firstCategory = modelCategories[0];
          setSelectedCategory(firstCategory);
          // Reset placement too, it will be set by the placement effect
          setSelectedPlacement(''); 
        } else {
          setSelectedCategory('');
          setSelectedPlacement('');
        }
      } catch (error) {
        console.error('Error loading model data:', error);
        setStatusMessage('Error loading model data. Please try again.');
        setMappings({}); // Clear mappings on error
      }
    };
    
    loadModelData();
  }, [selectedModelId]); // Only depend on selectedModelId

  // Load placements when category changes
  useEffect(() => {
    if (!selectedModelId || !selectedCategory) return;
    
    const loadPlacements = () => {
      try {
        // Extract placements for the selected category from the STATE variable
        const categoryPlacements = Object.keys(mappings[selectedCategory] || {}); // Use mappings state
        setPlacements(categoryPlacements);
        
        // If current placement is not valid for the selected category, select the first one
        if (categoryPlacements.length > 0) {
          if (!categoryPlacements.includes(selectedPlacement)) {
            setSelectedPlacement(categoryPlacements[0]);
          } // Otherwise, keep the existing valid selection
        } else {
          setSelectedPlacement(''); // No placements available
        }
      } catch (error) {
        console.error('Error loading placements:', error);
        setStatusMessage('Error loading placements. Please try again.');
        setPlacements([]); // Clear placements on error
      }
    };
    
    loadPlacements();
  }, [selectedModelId, selectedCategory, mappings, selectedPlacement]); // Depend on mappings state now

  // Derive the current mapping to be passed down based on selections
  const effectiveMapping = useMemo(() => {
    if (!mappings || !selectedCategory || !selectedPlacement) {
      return null; // No selection, no specific mapping
    }
    const categoryMappings = mappings[selectedCategory];
    const placementMapping = categoryMappings?.[selectedPlacement];
    const defaultMapping = defaultMappings[selectedCategory]?.[selectedPlacement];

    const result = placementMapping || defaultMapping;
    // console.log(`[ModelMappingEditor Derived] Effective mapping for ${selectedCategory}/${selectedPlacement}:`, result);
    return result;
  }, [mappings, selectedCategory, selectedPlacement]); // Recalculates when mappings or selection changes

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    // Check for unsaved changes before changing model
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setSelectedModelId(modelId);
        setHasUnsavedChanges(false);
      }
    } else {
      setSelectedModelId(modelId);
    }
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    // Check for unsaved changes before changing category
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setSelectedCategory(category);
        setHasUnsavedChanges(false);
      }
    } else {
      setSelectedCategory(category);
    }
  };

  // Handle placement selection
  const handlePlacementChange = (placement: string) => {
    // Check for unsaved changes before changing placement
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setSelectedPlacement(placement);
        setHasUnsavedChanges(false);
      }
    } else {
      setSelectedPlacement(placement);
    }
  };

  // Handle mapping update from MappingControls
  const handleMappingUpdate = useCallback((category: string, placement: string, updatedValues: Partial<BodyPartMapping>) => {
    console.log('[ModelMappingEditor] handleMappingUpdate received:', { category, placement, updatedValues });
    if (!selectedModelId || !category || !placement) {
      console.error("Cannot update mapping: Missing model, category, or placement.");
      return;
    }

    // Ensure we use the correct defaults for the specific category/placement
    const placementDefault = defaultMappings[category]?.[placement] || {
      position: [0, 0, 0], scale: 0.1, cameraAzimuth: 0, cameraPolar: Math.PI / 2, cameraDistance: 1.2
    };

    setMappings(prevMappings => {
      if (!prevMappings) return null; // Should not happen if model is selected

      const currentCategoryMappings = prevMappings[category] || {};
      const currentPlacementMapping = currentCategoryMappings[placement] || placementDefault;

      const newPlacementMapping: BodyPartMapping = { // Explicitly type the result
        ...currentPlacementMapping,
        ...updatedValues, // Merge the partial updates
        // Ensure required fields exist, falling back if necessary
        position: updatedValues.position ? [...updatedValues.position] : [...currentPlacementMapping.position],
        scale: updatedValues.scale !== undefined ? updatedValues.scale : currentPlacementMapping.scale,
        cameraAzimuth: updatedValues.cameraAzimuth !== undefined ? updatedValues.cameraAzimuth : currentPlacementMapping.cameraAzimuth,
        cameraPolar: updatedValues.cameraPolar !== undefined ? updatedValues.cameraPolar : currentPlacementMapping.cameraPolar,
        cameraDistance: updatedValues.cameraDistance !== undefined ? updatedValues.cameraDistance : currentPlacementMapping.cameraDistance,
      };

      const newMappings: BodyPartMappings = { // Explicitly type the result
        ...prevMappings,
        [category]: {
          ...currentCategoryMappings,
          [placement]: newPlacementMapping,
        },
      };

      console.log('[ModelMappingEditor] Updated Mappings State:', newMappings);

      // Optionally save immediately, or rely on a separate save button/mechanism
      // saveMappings(selectedModelId, newMappings); 

      // Trigger save after state update completes (ensure atomicity if possible)
      // Consider moving save to a separate useEffect triggered by mappings change if needed
      if (selectedModelId) {
        saveMappings(selectedModelId, newMappings);
        // Removed .catch as saveMappings might not return a promise
        // TODO: Implement robust error handling for saving
      }
      return newMappings;
    });

    // Update unsaved changes flag
    setHasUnsavedChanges(true);
  }, [selectedModelId]); // Removed mappings, it's not used directly inside
 
   // Adapter function for MappingPreview component which provides full updates
   const handleMappingUpdateAdapter = (category: string, placement: string, mapping: BodyPartMapping) => {
     // Call the main handler with the full mapping as the update
     console.log('[ModelMappingEditor] Adapter received full mapping update from preview:', { category, placement, mapping });
     handleMappingUpdate(category, placement, mapping); // Pass the full object as updatedValues
   };

  // Handle save mapping
  const handleSaveMapping = async () => {
    if (!selectedModelId || !selectedCategory || !selectedPlacement || !effectiveMapping) return;
    
    setIsSaving(true);
    
    try {
      // Get current mappings for the model
      const existingMappings = loadMappings(selectedModelId) || {};
      
      // Create a deep copy of existing mappings
      const updatedMappings: BodyPartMappings = JSON.parse(JSON.stringify(existingMappings));
      
      // Initialize category if it doesn't exist
      if (!updatedMappings[selectedCategory]) {
        updatedMappings[selectedCategory] = {};
      }
      
      // Update the mapping
      updatedMappings[selectedCategory][selectedPlacement] = effectiveMapping;
      
      // Save the updated mappings
      await saveMappings(selectedModelId, updatedMappings);
      
      // Update initial mapping reference
      initialMappingRef.current = JSON.parse(JSON.stringify(effectiveMapping));
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      setStatusMessage('Mapping saved successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Error saving mapping:', error);
      setStatusMessage('Error saving mapping. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle import of mappings
  const handleImportMappings = (mappings: BodyPartMappings) => {
    if (!selectedModelId) return;
    
    try {
      // Save imported mappings
      saveMappings(selectedModelId, mappings);
      
      // Reload categories
      const modelCategories = Object.keys(mappings);
      setCategories(modelCategories);
      
      // Select first category if available
      if (modelCategories.length > 0) {
        setSelectedCategory(modelCategories[0]);
        
        // Reload placements for the selected category
        const categoryPlacements = Object.keys(mappings[modelCategories[0]] || {});
        setPlacements(categoryPlacements);
        
        // Select first placement if available
        if (categoryPlacements.length > 0) {
          setSelectedPlacement(categoryPlacements[0]);
          
          // Load mapping for the selected placement
          const effectiveMapping = mappings[modelCategories[0]][categoryPlacements[0]] || null;
          // Update initial mapping reference
          initialMappingRef.current = effectiveMapping 
            ? JSON.parse(JSON.stringify(effectiveMapping))
            : null;
          
          // Reset unsaved changes flag
          setHasUnsavedChanges(false);
        }
      }
      
      setStatusMessage('Mappings imported successfully.');
    } catch (error) {
      console.error('Error importing mappings:', error);
      setStatusMessage('Error importing mappings. Please try again.');
    }
  };

  console.log('[ModelMappingEditor Pre-Render] State:', {
    isLoading,
    selectedModelId,
    mappingsKeys: Object.keys(mappings || {}),
    selectedCategory,
    selectedPlacement,
    effectiveMappingExists: !!effectiveMapping,
  });

  return (
    <div className="container mx-auto p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">3D Body Part Mapping Editor</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <ModelSelector 
                models={models}
                selectedModelId={selectedModelId}
                onModelChange={handleModelChange}
              />
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <MappingControls 
                mapping={effectiveMapping}
                onUpdate={handleMappingUpdate}
                category={selectedCategory}
                placement={selectedPlacement}
                onCategoryChange={handleCategoryChange}
                onPlacementChange={handlePlacementChange}
                bodyPartMappings={mappings}
              />
              
              {/* Save Changes Button */}
              {effectiveMapping && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      hasUnsavedChanges
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={handleSaveMapping}
                    disabled={!hasUnsavedChanges || isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                        Saving...
                      </span>
                    ) : hasUnsavedChanges ? (
                      'Save Changes'
                    ) : (
                      'No Changes to Save'
                    )}
                  </button>
                </div>
              )}
              
              {/* Unsaved Changes Warning */}
              {hasUnsavedChanges && (
                <div className="mt-3 p-2 bg-yellow-900 text-yellow-200 text-sm rounded-lg">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    You have unsaved changes
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <ImportExportTools 
                selectedModelId={selectedModelId}
                modelName={models.find(m => m.id === selectedModelId)?.name || ''}
                onImport={handleImportMappings}
              />
            </div>
            
            {statusMessage && (
              <div className={`p-3 rounded-lg ${statusMessage.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                {statusMessage}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-4 rounded-lg shadow h-full border border-gray-700">
              <MappingPreview 
                selectedModelId={selectedModelId} // Correct prop name
                selectedCategory={selectedCategory} // Correct prop name
                selectedPlacement={selectedPlacement} // Correct prop name
                mappings={mappings}
                onMappingUpdate={handleMappingUpdateAdapter}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelMappingEditor;
