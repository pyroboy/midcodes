import { mdsvex } from "mdsvex";
// import adapter from "@sveltejs/adapter-static";
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// see below for options that can be set here
		})
	},

  preprocess: [mdsvex()],
  extensions: [".svelte", ".svx"],
};

export default config;