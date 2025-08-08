import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '127.0.0.1',
		port: 5173,
		hmr: {
			port: 5173,
			host: '127.0.0.1'
		}
	},
	optimizeDeps: {
		exclude: [
			'@supabase/supabase-js',
			'lucide-svelte',
			'bits-ui',
			'svelte-sonner',
			'mode-watcher'
		]
	}
});
