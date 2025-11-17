import { sveltekit } from "@sveltejs/kit/vite";

/** @returns {import('vite').UserConfig} */
export default function createConfig() {
  return {
    plugins: [sveltekit()],
    build: { sourcemap: true }
  };
}
