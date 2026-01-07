<script>
    import { page } from '$app/stores';
    let { children } = $props();
</script>

<svelte:head>
    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <!-- Fonts: 'Bebas Neue' for BIG headers, 'Inter' for body -->
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="app-shell">
    {@render children()}
</div>

<style>
    :global(:root) {
        --color-black: #0a0a0a;
        --color-dark: #1a1a1a;
        --color-white: #ffffff;
        --color-gray-100: #fafafa;
        --color-gray-200: #e5e5e5;
        --color-gray-300: #d4d4d4;
        --color-gray-400: #a3a3a3;
        --color-gray-500: #737373;
        --color-gray-600: #525252;
        --color-gray-700: #404040;
        --color-gray-800: #262626;
        --color-text-main: #171717;
        
        --font-header: 'Bebas Neue', sans-serif;
        --font-body: 'Inter', sans-serif;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        background-color: var(--color-gray-100);
        font-family: var(--font-body);
        color: var(--color-text-main);
        -webkit-font-smoothing: antialiased;
    }

    /* Global Typography Resets for "Big Headers" */
    :global(h1), :global(h2), :global(h3), :global(h4) {
        font-family: var(--font-header);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        margin: 0;
        color: var(--color-black);
    }
    
    :global(h1) {
        font-size: 3rem;
        line-height: 1.1;
        font-weight: 400;
    }
    
    :global(h2) {
        font-size: 2rem;
        font-weight: 400;
    }

    :global(a) {
        color: inherit;
        text-decoration: none;
    }

    .app-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }
</style>
