import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()]
} as UserConfig);