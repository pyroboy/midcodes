import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { AppSettings, AppSettingsContextType, defaultSettings } from './appSettingsTypes';

// Create context
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// Provider component
export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Apply theme color to CSS variables
    const root = document.documentElement;
    if (settings.themeColor === 'chrome') {
      root.style.setProperty('--primary', '45 100% 50%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-primary', '45 100% 50%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--accent', '45 100% 50%');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-accent', '45 93% 47%');
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
      root.style.setProperty('--sidebar-ring', '45 100% 50%');
    } else {
      // Blue theme (default)
      root.style.setProperty('--primary', '210 100% 45%');
      root.style.setProperty('--primary-foreground', '210 40% 98%');
      root.style.setProperty('--sidebar-primary', '210 100% 45%');
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
      root.style.setProperty('--accent', '210 100% 45%');
      root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
      root.style.setProperty('--sidebar-accent', '210 40% 96.1%');
      root.style.setProperty('--sidebar-accent-foreground', '210 40% 98%');
      root.style.setProperty('--sidebar-ring', '210 100% 45%');
    }
  }, [settings]);

  const updateAppName = (name: string) => {
    setSettings(prev => ({ ...prev, appName: name }));
  };

  const updateLogoUrl = (url: string) => {
    setSettings(prev => ({ ...prev, logoUrl: url }));
  };

  const updateThemeColor = (color: 'blue' | 'chrome') => {
    setSettings(prev => ({ ...prev, themeColor: color }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        updateAppName,
        updateLogoUrl,
        updateThemeColor,
        resetSettings,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

// Export the context for use in hook
export { AppSettingsContext };