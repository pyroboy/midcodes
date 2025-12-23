<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	// No other heavy imports here. 
    // The shell layout handles headers, fonts, themes.
    // This root layout only handles global CSS and Toasts (needed by ID page potentially, and nice to have).

    let { children } = $props();
</script>

{@render children()}

<Toaster richColors closeButton />

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
    /* Minimal global style - rest is in (shell) layout or component specific */
</style>
