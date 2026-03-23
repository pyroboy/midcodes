import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: true,
		port: 5176
	},
	test: {
		globals: true,
		environment: 'node'
	}
});
