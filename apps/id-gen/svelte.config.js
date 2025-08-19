import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

let adapter;
try {
    adapter = (await import('@sveltejs/adapter-vercel')).default;
} catch (e) {
    try {
        adapter = (await import('@sveltejs/adapter-auto')).default;
    } catch {
        adapter = () => ({ name: 'noop-adapter', adapt: async () => {} });
    }
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x',
			split: false
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
