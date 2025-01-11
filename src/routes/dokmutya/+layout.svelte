<script>
    import './app.css';
</script>

<div class="dokmutya-root">
    <slot />
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
    
    .dokmutya-root {
        display: block;
        width: 100%;
        min-height: 100vh;
    }
</style>
