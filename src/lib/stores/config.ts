import { writable } from 'svelte/store';

interface Config {
    adminUrl: string;
}

const DEFAULT_CONFIG: Config = {
    adminUrl: 'midcodes' // Fallback value if not super_admin
};

export const config = writable<Config>(DEFAULT_CONFIG);

// Load config from server
export async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const data = await response.json();
            config.set(data);
        } else {
            // If not authorized, use default config
            config.set(DEFAULT_CONFIG);
        }
    } catch (error) {
        console.error('Failed to load config:', error);
        // On error, use default config
        config.set(DEFAULT_CONFIG);
    }
}
