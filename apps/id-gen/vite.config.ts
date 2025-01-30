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
        host: true, // Allows access on the local network
      },
    // optimizeDeps: {
    //     include: ['three']
    // },
    // resolve: {
    //     alias: {
    //         'three/examples/jsm/objects/GroundProjectedSkybox': resolve('node_modules/three/examples/jsm/objects/GroundProjectedSkybox.js'),
    //         'three/examples/jsm': resolve('node_modules/three/examples/jsm')
    //     }
    // },
    ssr: {
        noExternal: ['three', '@threlte/core', '@threlte/extras']
    }
} as UserConfig);