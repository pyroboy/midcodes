import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
  ssr: { 
    external: ['@supabase/postgrest-js', 'style-to-object'], // exclude problematic packages from SSR
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
			'@supabase/supabase-js',
			'lucide-svelte',
			'svelte-sonner',
			'mode-watcher'
		],
		include: ['style-to-object', '@supabase/postgrest-js'] // pre-bundle for the browser
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
