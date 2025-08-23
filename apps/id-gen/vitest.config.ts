import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load environment variables
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
        plugins: [],
        resolve: {
            alias: {
                '$lib': `${process.cwd().replace(/\\/g, '/')}/src/lib`,
                '$app/server': `${process.cwd().replace(/\\/g, '/')}/tests/mocks/app-server-stub.ts`,
                '$app/environment': `${process.cwd().replace(/\\/g, '/')}/tests/mocks/app-environment-stub.ts`,
                '@sveltejs/kit/src/runtime/client/remote-functions/command.svelte.js': `${process.cwd().replace(/\\/g, '/')}/tests/mocks/sveltekit-remote-stubs.ts`,
                '@sveltejs/kit/src/runtime/client/remote-functions/query.svelte.js': `${process.cwd().replace(/\\/g, '/')}/tests/mocks/sveltekit-remote-stubs.ts`
            }
        },
        define: {
            // Make environment variables available to tests
            'import.meta.env.VITE_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL),
            'import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY),
        },
        test: {
            globals: true,
            include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
            environment: 'jsdom',
            setupFiles: ['./tests/setup.ts'],
            alias: {},
            env: {
                // Provide fallback environment variables for tests
                PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL || 'https://wnkqlrfmtiibrqnncgqu.supabase.co',
                PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3FscmZtdGlpYnJxbm5jZ3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyMjEzNzMsImV4cCI6MjAzNzc5NzM3M30.lsv6u5gwVMHDIqJ2bjUy0elxoYn-q62j6ZbKQ4a_Ru0',
                VITE_PUBLIC_SUPABASE_URL: env.VITE_PUBLIC_SUPABASE_URL || 'https://wnkqlrfmtiibrqnncgqu.supabase.co',
                VITE_PUBLIC_SUPABASE_ANON_KEY: env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3FscmZtdGlpYnJxbm5jZ3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyMjEzNzMsImV4cCI6MjAzNzc5NzM3M30.lsv6u5gwVMHDIqJ2bjUy0elxoYn-q62j6ZbKQ4a_Ru0',
                NODE_ENV: 'test',
                VITEST: 'true'
            },
            environmentOptions: {
                jsdom: {
                    resources: 'usable'
                }
            }
        }
    };
});

