import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    optimizeDeps: {
        exclude: [
            '@threlte/core',
            '@threlte/extras', 
            'three',
            'three-inspect',
            'html5-qrcode',
            'jszip'
        ]
    },
    server: {
        fs: {
            allow: ['..']
        }
    }
} as UserConfig);