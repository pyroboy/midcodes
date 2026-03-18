import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
  ssr: {
    external: ['style-to-object', 'runed'],
    noExternal: []
  },
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
			'svelte-sonner',
			'mode-watcher'
		],
		include: ['style-to-object', 'lucide-svelte']
	},
	define: {
		global: 'globalThis'
	},
	build: {
		ssr: false, // turn server-side rendering OFF
		commonjsOptions: {
			include: [/style-to-object/, /svelte-toolbelt/, /node_modules/],
			transformMixedEsModules: true
		}
	}
});
