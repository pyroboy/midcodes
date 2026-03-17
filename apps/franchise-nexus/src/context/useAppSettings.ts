import { useContext } from 'react';
import { AppSettingsContext } from './AppSettingsContext';
import { AppSettingsContextType } from './appSettingsTypes';

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  
  return context;
};