import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    optimizeDeps: {
        include: ['three']
    },
    resolve: {
        alias: {
            'three/examples/jsm/objects/GroundProjectedSkybox': 'three/examples/jsm/objects/GroundProjectedSkybox.js'
        }
    },
    ssr: {
        noExternal: ['three', '@threlte/core', '@threlte/extras']
    }
} as UserConfig);