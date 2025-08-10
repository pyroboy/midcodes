import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: '127.0.0.1',
        port: 5173,
        hmr: {
            port: 5173,
            host: '127.0.0.1'
        },
        strictPort: false
    }
} as UserConfig);