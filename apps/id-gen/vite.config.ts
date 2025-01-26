import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    optimizeDeps: {
        include: ['three', 'three/examples/jsm/objects/GroundProjectedSkybox']
    },
    build: {
        rollupOptions: {
            external: ['three/examples/jsm/objects/GroundProjectedSkybox']
        }
    }
} as UserConfig);