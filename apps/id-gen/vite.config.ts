import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [sveltekit()], // Temporarily disabled tailwindcss() to fix import issues
	server: {
		host: '127.0.0.1', // Bind to localhost specifically for Windows
		port: 5173
	},
	optimizeDeps: {
		exclude: ['ws', 'events', '@sveltejs/kit'],
		include: [
			'jszip', 
			'three', 
			'@threlte/core', 
			'@threlte/extras',
			'bits-ui'
		]
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
	}
} as UserConfig);
