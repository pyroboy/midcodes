import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'commonjs-polyfill',
			config() {
				// Polyfill CommonJS globals for SSR
				if (typeof (globalThis as any).exports === 'undefined') {
					(globalThis as any).exports = {};
				}
				if (typeof (globalThis as any).module === 'undefined') {
					(globalThis as any).module = { exports: (globalThis as any).exports };
				}
			}
		}
	],
  ssr: {
    // Ensure these packages are bundled for SSR on Vercel
    noExternal: [
      'bits-ui',
      'lucide-svelte',
      'svelte-sonner',
      'mode-watcher',
      '@supabase/ssr',
      'style-to-object',
      'svelte-toolbelt'
    ]
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
		]
	},
	define: {
		global: 'globalThis',
		exports: 'globalThis.exports',
		module: 'globalThis.module'
	},
	build: {
		commonjsOptions: {
			include: [/style-to-object/, /svelte-toolbelt/, /node_modules/],
			transformMixedEsModules: true
		}
	}
});
