import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
  ssr: {
    // Ensure these packages are bundled for SSR on Vercel
    noExternal: [
      'bits-ui',
      'lucide-svelte',
      'svelte-sonner',
      'mode-watcher',
      '@supabase/ssr'
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
			'bits-ui',
			'svelte-sonner',
			'mode-watcher'
		]
	}
});
