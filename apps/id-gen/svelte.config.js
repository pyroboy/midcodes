import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x',
			split: true  // Enable per-route code splitting for faster page loads
		}),
		experimental: {
			remoteFunctions: true
		},
		alias: {
			// $lib is built-in, but included for completeness
			// '$app/*': './tests/mocks/$app/*',
			// '$env/*': './tests/mocks/$env/*',
			'@test-utils/*': './src/lib/test-utils/*',
			'@test/*': './tests/*'
		}
	},
	extensions: ['.svelte']
};

export default config;
