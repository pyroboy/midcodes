import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Use 'edge' for edge runtime, or 'nodejs18.x' for Node.js runtime
      runtime: 'nodejs18.x',

      // an array of dependencies that esbuild should not bundle
      // 'external': [],

      // if true, will split your app into multiple functions
      // instead of creating a single one for the entire app
      split: false
    })
  }
};

export default config;