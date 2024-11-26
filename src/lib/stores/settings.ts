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
    
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
            if ($settings.theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            localStorage.setItem('theme', $settings.theme);
        });
    }

    return {
        subscribe,
        toggleTheme: () => update(settings => ({
            ...settings,
            theme: settings.theme === 'light' ? 'dark' : 'light'
        })),
        setTemplate: (template: Template | null) => update(settings => ({
            ...settings,
            selectedTemplate: template
        })),
        clearTemplate: () => update(settings => ({
            ...settings,
            selectedTemplate: null
        }))
    };
};

export const settings = createSettingsStore();
