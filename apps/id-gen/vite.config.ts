import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: true, // Allows access on the local network
        port: 5731, // Optional: Specify your port
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