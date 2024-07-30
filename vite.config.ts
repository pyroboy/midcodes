import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		noExternal: ['@supabase/supabase-js', 'html2canvas']
	}
});


// import { sveltekit } from '@sveltejs/kit/vite';

// /** @type {import('vite').UserConfig} */
// const config = {
//   plugins: [sveltekit()],
//   ssr: {
//     noExternal: ['@supabase/supabase-js']
//   }
// };

// export default config;