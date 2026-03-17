import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BodyPartMapping, BodyPartMappings } from '../../types/mapping';
import { getModelConfig } from '../../utils/modelManager';
import { defaultMappings } from '../../data/defaultMappings';
import Human3DModel from '../booking/Human3DModel';

interface MappingPreviewProps {
  selectedModelId: string;
  selectedCategory: string;
  selectedPlacement: string;
  mappings: BodyPartMappings | null;
  onMappingUpdate: (category: string, placement: string, mapping: BodyPartMapping) => void;
}

const MappingPreview: React.FC<MappingPreviewProps> = ({
  selectedModelId,
  selectedCategory,
  selectedPlacement,
  mappings,
  onMappingUpdate
}) => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState(true);

  useEffect(() => {
    if (!selectedModelId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const modelConfig = getModelConfig(selectedModelId);
      
      if (!modelConfig) {
        setError('Model configuration not found');
        setIsLoading(false);
        return;
      }

      setModelUrl(modelConfig.url);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading model data:', error);
      setError('Failed to load model data');
      setIsLoading(false);
    }
  }, [selectedModelId]);

  const effectiveMapping = useMemo(() => {
    if (!mappings || !selectedCategory || !selectedPlacement) {
      return null;
    }
    const defaultMappingForPlacement = defaultMappings[selectedCategory]?.[selectedPlacement];
    return mappings[selectedCategory]?.[selectedPlacement] || defaultMappingForPlacement;
  }, [mappings, selectedCategory, selectedPlacement]);

  const handleMappingUpdate = (category: string, placement: string, mapping: BodyPartMapping) => {
    console.log('MappingPreview - handleMappingUpdate: Calling parent with', category, placement, mapping);
    onMappingUpdate(category, placement, mapping);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">3D Preview</h2>
        <button 
          onClick={toggleEditMode}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            editMode 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {editMode ? 'Switch to Preview' : 'Switch to Edit'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : !selectedModelId ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-gray-500">Please select a model</div>
        </div>
      ) : !selectedCategory || !selectedPlacement ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-gray-500">Please select a category and placement</div>
        </div>
      ) : (
        <div className="flex-1 relative bg-gray-100 rounded-lg">
          <div className="absolute inset-0">
            <Human3DModel
              key={`${selectedCategory}-${selectedPlacement}`}
              selectedCategory={selectedCategory}
              currentPlacement={selectedPlacement}
              modelId={selectedModelId}
              isColor={false}
              modelUrl={modelUrl}
              bodyPartMappings={mappings}
              editMode={editMode}
              onMappingUpdate={handleMappingUpdate}
              size={undefined}
            />
          </div>
          
          <div className="absolute top-4 right-4 bg-white bg-opacity-80 p-2 rounded-lg text-xs">
            <div className="font-medium text-gray-800">
              {editMode ? 'Edit Mode' : 'Preview Mode'}
            </div>
          </div>
          
          {editMode && (
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-80 p-3 rounded-lg text-xs">
              <h3 className="font-medium mb-1">Keyboard Controls:</h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                <li><span className="font-medium">Arrow Keys:</span> Move position (X/Y)</li>
                <li><span className="font-medium">Page Up/Down:</span> Move position (Z)</li>
                <li><span className="font-medium">Alt + Arrows:</span> Adjust rotation</li>
                <li><span className="font-medium">Ctrl + Up/Down:</span> Adjust scale</li>
                <li><span className="font-medium">Shift + Any:</span> Fine adjustment</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MappingPreview;
