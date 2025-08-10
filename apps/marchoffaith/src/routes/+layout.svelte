<script>
    import '../app.css';
    import { config } from '$lib/config';
    import UnderConstruction from '$lib/components/UnderConstruction.svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
</script>

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
