import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debugMappings } from '@/utils/mappingStorage';
import { forceLoadDefaultMappings } from '@/utils/forceMappings';
import { Human3DModel } from '@/components/booking/Human3DModel';
import { defaultMappings } from '@/data/defaultMappings';

const MappingDebugPage: React.FC = () => {
  const [mappingKeys, setMappingKeys] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Arms');
  const [selectedPlacement, setSelectedPlacement] = useState('Inner Bicep');
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [isColor, setIsColor] = useState(false);
  
  // Get all categories and placements from default mappings
  const categories = Object.keys(defaultMappings);
  const placements = selectedCategory ? Object.keys(defaultMappings[selectedCategory] || {}) : [];
  
  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  // Run mapping diagnostics
  const runDiagnostics = () => {
    // Capture console output
    const originalConsole = { ...console };
    let output = '';
    
    console.group = (label: string) => {
      output += `\n=== ${label} ===\n`;
    };
    console.groupEnd = () => {
      output += '\n=== End Group ===\n';
    };
    console.log = (...args: unknown[]) => {
      output += args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsole.log(...args);
    };
    console.warn = (...args: unknown[]) => {
      output += '⚠️ ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsole.warn(...args);
    };
    console.error = (...args: unknown[]) => {
      output += '❌ ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsole.error(...args);
    };
    
    // Run debug mappings
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith('tattoo-tide-mappings-'))
      .map(key => key.replace('tattoo-tide-mappings-', ''));
    
    setMappingKeys(keys);
    // debugMappings();
    
    // Restore console
    Object.assign(console, originalConsole);
    
    // Update debug output
    setDebugOutput(output);
  };
  
  // Force load default mappings
  const handleForceLoad = () => {
    // Capture console output
    const originalConsole = { ...console };
    let output = '';
    
    console.group = (label: string) => {
      output += `\n=== ${label} ===\n`;
    };
    console.groupEnd = () => {
      output += '\n=== End Group ===\n';
    };
    console.log = (...args: unknown[]) => {
      output += args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsole.log(...args);
    };
    console.warn = (...args: unknown[]) => {
      output += '⚠️ ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsole.warn(...args);
    };
    console.error = (...args: unknown[]) => {
      output += '❌ ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
      originalConsole.error(...args);
    };
    
    // Force load mappings
    forceLoadDefaultMappings();
    
    // Restore console
    Object.assign(console, originalConsole);
    
    // Update debug output
    setDebugOutput(prev => prev + '\n' + output);
    
    // Refresh mapping keys
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith('tattoo-tide-mappings-'))
      .map(key => key.replace('tattoo-tide-mappings-', ''));
    
    setMappingKeys(keys);
  };
  
  // Clear all mappings from localStorage
  const handleClearMappings = () => {
    if (window.confirm('Are you sure you want to clear all mappings from localStorage?')) {
      Object.keys(localStorage)
        .filter(key => key.startsWith('tattoo-tide-'))
        .forEach(key => localStorage.removeItem(key));
      
      setMappingKeys([]);
      setDebugOutput(prev => prev + '\n\nAll mappings cleared from localStorage\n');
      
      // Run diagnostics again
      runDiagnostics();
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Tattoo Tide Mapping Debugger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Diagnostics</CardTitle>
              <CardDescription>
                Debug and fix issues with body part mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={runDiagnostics}>
                    Run Diagnostics
                  </Button>
                  <Button onClick={handleForceLoad} variant="secondary">
                    Force Load Default Mappings
                  </Button>
                  <Button onClick={handleClearMappings} variant="destructive">
                    Clear All Mappings
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Detected Mapping Models:</h3>
                  {mappingKeys.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {mappingKeys.map(key => (
                        <li key={key}>{key}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No mappings found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Debug Output</CardTitle>
              <CardDescription>
                Console output from mapping operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[400px] whitespace-pre-wrap">
                {debugOutput || 'No debug output yet'}
              </pre>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>3D Model Preview</CardTitle>
              <CardDescription>
                Visualize the current mapping configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                  <TabsTrigger value="controls" className="flex-1">Controls</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="aspect-square h-[400px] border rounded-md overflow-hidden">
                    <Human3DModel
                      modelId="default-human"
                      selectedCategory={selectedCategory}
                      currentPlacement={selectedPlacement}
                      isColor={isColor}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="controls" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Category
                      </label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          // Reset placement when category changes
                          if (defaultMappings[e.target.value]) {
                            setSelectedPlacement(Object.keys(defaultMappings[e.target.value])[0]);
                          }
                        }}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Placement
                      </label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={selectedPlacement}
                        onChange={(e) => setSelectedPlacement(e.target.value)}
                      >
                        {placements.map(placement => (
                          <option key={placement} value={placement}>
                            {placement}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-sm font-medium mr-2">
                        Color:
                      </label>
                      <input 
                        type="checkbox" 
                        checked={isColor}
                        onChange={(e) => setIsColor(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {isColor ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Current Mapping:</h4>
                      {selectedCategory && selectedPlacement && defaultMappings[selectedCategory]?.[selectedPlacement] ? (
                        <pre className="text-xs overflow-auto max-h-[100px]">
                          {JSON.stringify(defaultMappings[selectedCategory][selectedPlacement], null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-muted-foreground">No mapping selected</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MappingDebugPage;
