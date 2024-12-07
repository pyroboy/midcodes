<script lang="ts">
    import { page } from '$app/stores';

    $: console.log('[Admin Layout]', {
        path: $page.url.pathname,
        data: $page.data
    });
</script>

<div class="admin-layout">
    <slot />
</div>

<style>
    .admin-layout {
        width: 100%;
        min-height: 100vh;
    }
</style>
