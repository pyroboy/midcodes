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
        /* FoodHub Pink & Green Theme */
        --color-black: #09090b; /* Zinc 950 */
        --color-dark: #18181b;   /* Zinc 900 */
        --color-white: #ffffff;
        
        /* Primary: Pink/Fuchsia */
        --color-pink: #ec4899;       /* Fuchsia 500 */
        --color-pink-hover: #db2777; /* Fuchsia 600 */
        --color-pink-light: #fdf2f8; /* Fuchsia 50 */
        
        /* Accent: Green */
        --color-green: #22c55e;      /* Green 500 */
        --color-green-hover: #16a34a; /* Green 600 */
        --color-green-light: #dcfce7; /* Green 100 */
        
        --color-gray-100: #fdf2f8; /* Pink-tinted background */
        --color-gray-200: #fce7f3;
        --color-text-main: #27272a;
        
        --font-header: 'Oswald', sans-serif;
        --font-body: 'Inter', sans-serif;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, var(--color-pink-light) 0%, #f0fdf4 100%);
        font-family: var(--font-body);
        color: var(--color-text-main);
        -webkit-font-smoothing: antialiased;
        min-height: 100vh;
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
