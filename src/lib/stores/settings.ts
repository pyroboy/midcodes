import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Template {
    id: string;
    name: string;
    user_id: string;
}

interface Settings {
    theme: 'light' | 'dark';
    selectedTemplate: Template | null;
}

// Get initial theme from localStorage or system preference
const getInitialTheme = (): 'light' | 'dark' => {
    if (!browser) return 'light';
    
    // Always default to light theme for first-time users
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
};

const createSettingsStore = () => {
    // Initialize store with saved values or defaults
    const initialSettings: Settings = {
        theme: getInitialTheme(),
        selectedTemplate: null
    };

    const { subscribe, set, update } = writable<Settings>(initialSettings);

    // Apply theme class to document
    if (browser) {
        subscribe(($settings) => {
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add($settings.theme);
            localStorage.setItem('theme', $settings.theme);
        });
    }

    return {
        subscribe,
        setTheme: (theme: 'light' | 'dark') => 
            update(settings => ({ ...settings, theme })),
        toggleTheme: () => 
            update(settings => ({
                ...settings,
                theme: settings.theme === 'light' ? 'dark' : 'light'
            })),
        setSelectedTemplate: (template: Template | null) =>
            update(settings => ({ ...settings, selectedTemplate: template }))
    };
};

export const settings = createSettingsStore();
