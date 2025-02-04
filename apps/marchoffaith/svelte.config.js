import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',
      split: false,
      // Make the output directory explicit
      outDir: '.vercel/output'
    }),
    alias: {
      "@/*": "./src/lib/*",
      "@ui": "./src/lib/components/ui",
      "@test-utils/*": './src/lib/test-utils/*',
      "@test/*": './tests/*'
    }
  },
  extensions: [".svelte"],
};

export default config;