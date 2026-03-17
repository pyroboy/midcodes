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


