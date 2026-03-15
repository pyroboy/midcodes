<script lang="ts">
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import { session } from '$lib/stores/session.svelte';

	const sidebar = useSidebar();
</script>

<!-- Visible on mobile only (md:hidden). Desktop sidebar takes over at md+. -->
<header class="mobile-topbar safe-top safe-x md:hidden flex h-14 shrink-0 items-center border-b border-[#E5E7EB] bg-white px-4">
	<button
		onclick={() => sidebar.toggle()}
		class="flex items-center gap-2"
		aria-label="Toggle sidebar"
	>
		<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
			<span class="text-xs font-extrabold text-white">W!</span>
		</div>
		<span class="text-sm font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</span>
	</button>
</header>
