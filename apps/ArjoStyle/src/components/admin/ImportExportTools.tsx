import React, { useState, useRef } from 'react';
import { BodyPartMappings } from '../../types/mapping';
import { exportMappingsToJson, importMappingsFromJsonString } from '../../utils/mappingStorage';

interface ImportExportToolsProps {
  selectedModelId: string;
  modelName: string;
  onImport: (mappings: BodyPartMappings) => void;
}

const ImportExportTools: React.FC<ImportExportToolsProps> = ({
  selectedModelId,
  modelName,
  onImport
}) => {
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExport = () => {
    if (!selectedModelId) {
      setImportStatus('No model selected for export');
      return;
    }
    
    try {
      exportMappingsToJson(selectedModelId, modelName);
      setImportStatus('Mappings exported successfully');
    } catch (error) {
      console.error('Error exporting mappings:', error);
      setImportStatus('Error exporting mappings');
    }
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedModelId) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error('Failed to read file content');
        }
        
        // Use the new function to import mappings from JSON string
        const mappings = importMappingsFromJsonString(selectedModelId, content);
        
        // Call the onImport callback with the imported mappings
        onImport(mappings);
        
        setImportStatus('Mappings imported successfully');
      } catch (error) {
        console.error('Error importing mappings:', error);
        setImportStatus('Error importing mappings: Invalid format');
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Import/Export</h2>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={!selectedModelId}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !selectedModelId 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Export Mappings
          </button>
          
          <button
            onClick={handleImportClick}
            disabled={!selectedModelId}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !selectedModelId 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Import Mappings
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
        
        {importStatus && (
          <div className={`text-sm p-2 rounded ${
            importStatus.includes('Error') 
              ? 'bg-red-900 text-red-200' 
              : 'bg-green-900 text-green-200'
          }`}>
            {importStatus}
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-2">
          <p>Export: Saves current mappings to a JSON file</p>
          <p>Import: Loads mappings from a JSON file</p>
        </div>
      </div>
    </div>
  );
};

export default ImportExportTools;
