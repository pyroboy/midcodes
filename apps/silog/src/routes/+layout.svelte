<script>
    import { page } from '$app/stores';
</script>

<svelte:head>
    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <!-- Fonts: 'Oswald' for BIG headers, 'Inter' for body -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="app-shell">
    <slot />
</div>

<style>
    :global(:root) {
        --color-black: #09090b; /* Zinc 950 - Almost pure black */
        --color-dark: #18181b;   /* Zinc 900 */
        --color-white: #ffffff;
        --color-orange: #f97316; /* Orange 500 */
        --color-orange-hover: #ea580c;
        --color-gray-100: #f4f4f5;
        --color-gray-200: #e4e4e7;
        --color-text-main: #27272a;
        
        --font-header: 'Oswald', sans-serif;
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
        font-weight: 700;
    }
    
    :global(h2) {
        font-size: 2rem;
        font-weight: 600;
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
