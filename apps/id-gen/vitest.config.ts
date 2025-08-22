import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        globals: true,
        include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        environmentOptions: {
            jsdom: {
                resources: 'usable'
            }
        }
    }
});

