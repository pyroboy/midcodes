
import { createContext, useContext, useState, ReactNode } from 'react';

interface PartRecognitionSettings {
  autoSaveEnabled: boolean;
  confidenceThreshold: number;
  saveOnlyAutoParts: boolean;
}

interface PartRecognitionContextType {
  settings: PartRecognitionSettings;
  updateSettings: (newSettings: Partial<PartRecognitionSettings>) => void;
  savedImages: Array<{
    id: string;
    imageData: string;
    timestamp: string;
    confidence: number;
    analysis: any;
  }>;
  saveImage: (imageData: string, confidence: number, analysis: any) => void;
  clearSavedImages: () => void;
}

const defaultSettings: PartRecognitionSettings = {
  autoSaveEnabled: true,
  confidenceThreshold: 0.65,
  saveOnlyAutoParts: true,
};

const PartRecognitionContext = createContext<PartRecognitionContextType | undefined>(undefined);

export const PartRecognitionProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<PartRecognitionSettings>(defaultSettings);
  const [savedImages, setSavedImages] = useState<Array<{
    id: string;
    imageData: string;
    timestamp: string;
    confidence: number;
    analysis: any;
  }>>([]);

  const updateSettings = (newSettings: Partial<PartRecognitionSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveImage = (imageData: string, confidence: number, analysis: any) => {
    const newImage = {
      id: `img-${Date.now()}`,
      imageData,
      timestamp: new Date().toISOString(),
      confidence,
      analysis,
    };
    setSavedImages(prev => [newImage, ...prev]);
  };

  const clearSavedImages = () => {
    setSavedImages([]);
  };

  return (
    <PartRecognitionContext.Provider value={{
      settings,
      updateSettings,
      savedImages,
      saveImage,
      clearSavedImages,
    }}>
      {children}
    </PartRecognitionContext.Provider>
  );
};

export const usePartRecognition = () => {
  const context = useContext(PartRecognitionContext);
  if (context === undefined) {
    throw new Error('usePartRecognition must be used within a PartRecognitionProvider');
  }
  return context;
};
