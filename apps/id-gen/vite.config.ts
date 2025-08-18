import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit()
    ],
    server: {
        host: '127.0.0.1', // Bind to localhost specifically for Windows
        port: 5173
    },
    optimizeDeps: {
        exclude: ['ws', 'events'],
        include: ['jszip', 'three', '@threlte/core', '@threlte/extras', 'bits-ui']
    },
    define: {
        global: 'globalThis'
    },
    ssr: {
        noExternal: ['webfontloader']
    }
} as UserConfig);
