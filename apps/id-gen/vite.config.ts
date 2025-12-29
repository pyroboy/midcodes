import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import * as dotenv from 'dotenv';

// Explicitly load .env file into process.env for Windows compatibility
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Force restart to clear circular dependency cache
export default defineConfig(({ mode }) => {
	// Also use Vite's loadEnv as a fallback
	const env = loadEnv(mode, process.cwd(), '');

	// Merge into process.env for SSR
	Object.assign(process.env, env);

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			host: '127.0.0.1', // Bind to localhost specifically for Windows
			port: 5173
		},
		optimizeDeps: {
			exclude: ['ws', 'events', '@sveltejs/kit', '@threlte/core', '@threlte/extras'],
			include: ['jszip', 'three', 'bits-ui', 'tweakpane']
		},
		define: {
			global: 'globalThis'
		},
		ssr: {
			noExternal: ['webfontloader', '@threlte/core', '@threlte/extras', 'three'],
			external: ['@sveltejs/kit']
		},
		resolve: {
			dedupe: ['@sveltejs/kit', 'svelte']
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						'vendor-three': ['three', '@threlte/core', '@threlte/extras']
					}
				}
			}
		}
	} as UserConfig;
});
