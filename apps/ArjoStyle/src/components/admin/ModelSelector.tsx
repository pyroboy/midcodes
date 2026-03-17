import React from 'react';
import { ModelConfig } from '../../types/models';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  selectedModelId, 
  onModelChange 
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Select 3D Model</h2>
      
      {models.length === 0 ? (
        <p className="text-amber-400">No models available. Please add a model configuration.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col">
            <label htmlFor="model-select" className="text-sm font-medium mb-1 text-gray-300">
              Model
            </label>
            <select
              id="model-select"
              value={selectedModelId}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full p-2 rounded border border-gray-600 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedModelId && (
            <div className="text-sm text-gray-300">
              <p>Model URL: <span className="font-mono text-xs break-all text-gray-400">{models.find(m => m.id === selectedModelId)?.url}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
