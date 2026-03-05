import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__BUILD_DATE__: JSON.stringify(new Date().toISOString()),
		__BUILD_MODE__: JSON.stringify(process.env.NODE_ENV ?? 'development'),
		'process.env': {},
		'process': { env: {} }
	},
	server: {
		host: '0.0.0.0', // expose on LAN for tablet access
		port: 5173,
		allowedHosts: true
	},
	preview: {
		allowedHosts: true
	}
});
