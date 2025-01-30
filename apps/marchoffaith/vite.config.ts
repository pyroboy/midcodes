import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit(),tailwindcss()]
} as UserConfig);