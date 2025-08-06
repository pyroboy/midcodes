import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    // optimizeDeps: {
    //     exclude: [
    //         'bits-ui',
    //         'lucide-svelte',
    //         'sveltekit-superforms',
    //     ]
    // },
    // server: {
    //     fs: {
    //         allow: ['..']
    //     }
    // }
} as UserConfig);