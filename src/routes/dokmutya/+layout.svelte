<script>
    import './app.css';
</script>

<svelte:head>
    <style>
        /* Reset everything */
        :global(#svelte) { display: contents !important; }
        :global(body) { margin: 0 !important; }
        :global(*) { 
            margin: 0 !important;
            padding: 0 !important;
            background: none !important;
            color: inherit !important;
            font: inherit !important;
            box-sizing: border-box !important;
        }
        /* Remove Tailwind classes */
        :global(.bg-background),
        :global(.text-foreground),
        :global(.antialiased),
        :global(.min-h-screen) {
            all: unset !important;
        }
    </style>
</svelte:head>

<div class="dokmutya-root">
    <slot />
</div>

<style>
    .dokmutya-root {
        display: block;
        width: 100%;
        min-height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
    }
</style>
