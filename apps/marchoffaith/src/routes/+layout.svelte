<script>
    import '../app.css';
    import { config } from '$lib/config';
    import UnderConstruction from '$lib/components/UnderConstruction.svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;900&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

{#if config.underConstruction}
    <UnderConstruction />
{:else}
    <div class="app">
        <Header />
        <main>
            <slot />
        </main>
        <Footer />
    </div>
{/if}

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
    }
</style>
