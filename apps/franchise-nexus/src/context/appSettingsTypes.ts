// Types for App Settings
export interface AppSettings {
  appName: string;
  logoUrl: string;
  themeColor: 'blue' | 'chrome';
}

export interface AppSettingsContextType {
  settings: AppSettings;
  updateAppName: (name: string) => void;
  updateLogoUrl: (url: string) => void;
  updateThemeColor: (color: 'blue' | 'chrome') => void;
  resetSettings: () => void;
}

// Default settings
export const defaultSettings: AppSettings = {
  appName: "Paengs Fried Chicken",
  logoUrl: '',
  themeColor: 'chrome',
};