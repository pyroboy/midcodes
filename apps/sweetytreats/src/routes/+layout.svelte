<script>
    import { page } from '$app/stores';
    let { children } = $props();
</script>

<svelte:head>
    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <!-- Fonts: 'Playfair Display' for elegant headers, 'Nunito' for friendly body -->
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Playfair+Display:wght@500;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="app-shell">
    {@render children()}
</div>

<style>
    :global(:root) {
        /* Pink Cookie Palette */
        --color-pink: #ec4899;        /* Pink 500 */
        --color-pink-dark: #db2777;   /* Pink 600 */
        --color-pink-light: #fbcfe8;  /* Pink 200 */
        --color-rose: #f43f5e;        /* Rose 500 */
        --color-cream: #fdf4f5;       /* Light cream pink */
        --color-brown: #78350f;       /* Amber 900 - cookie brown */
        --color-white: #ffffff;
        --color-black: #1f1f1f;
        --color-gray-100: #fdf2f8;    /* Pink 50 */
        --color-gray-200: #fce7f3;    /* Pink 100 */
        --color-text-main: #3f3f46;
        
        --font-header: 'Playfair Display', serif;
        --font-body: 'Nunito', sans-serif;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        background-color: var(--color-cream);
        font-family: var(--font-body);
        color: var(--color-text-main);
        -webkit-font-smoothing: antialiased;
    }

    /* Global Typography */
    :global(h1), :global(h2), :global(h3), :global(h4) {
        font-family: var(--font-header);
        letter-spacing: 0.01em;
        margin: 0;
        color: var(--color-brown);
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
