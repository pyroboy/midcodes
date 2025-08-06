import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build'
    }),
    alias: {
      // $lib is built-in, but included for completeness
      // '$app/*': './tests/mocks/$app/*',
      // '$env/*': './tests/mocks/$env/*',
      '@test-utils/*': './src/lib/test-utils/*',
      '@test/*': './tests/*'
    }
  },
  extensions: [".svelte"],
};

export default config;