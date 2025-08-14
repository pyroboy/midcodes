import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwind from 'tailwindcss';

export default defineConfig({
    plugins: [
        sveltekit(),
        tailwind()
    ],
    server: {
        host: '127.0.0.1', // Bind to localhost specifically for Windows
        port: 5173
    },
    optimizeDeps: {
        exclude: ['ws', 'events'],
        include: ['jszip', 'three', '@threlte/core', '@threlte/extras', 'bits-ui', 'lucide-svelte']
    },
    define: {
        global: 'globalThis'
    }
} as UserConfig);