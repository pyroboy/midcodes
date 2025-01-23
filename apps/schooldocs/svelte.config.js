import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',
      split: false
    }),
    alias: {
      "@/*": "./src/lib/*",
      "@ui": "./src/lib/components/ui",
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