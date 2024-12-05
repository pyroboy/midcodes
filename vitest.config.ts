import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        include: ['tests/**/*.{test,spec}.{js,ts}'],
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
        alias: {
            $lib: path.resolve(__dirname, './src/lib'),
            $app: path.resolve(__dirname, './.svelte-kit/runtime/app'),
            '$env/static/public': path.resolve(__dirname, './tests/mocks/env.ts')
        }
    }
});
