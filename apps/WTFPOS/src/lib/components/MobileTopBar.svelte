<script lang="ts">
	import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
	import { session, getCurrentLocation } from '$lib/stores/session.svelte';
</script>

<!-- Visible on mobile only (md:hidden). Desktop sidebar takes over at md+. -->
<header class="md:hidden flex h-12 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4">
	<div class="flex items-center gap-2">
		<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
			<span class="text-[10px] font-extrabold text-white">W!</span>
		</div>
		<span class="text-sm font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</span>
	</div>

	<div class="flex items-center gap-2">
		<span class="text-xs text-gray-500">{getCurrentLocation()?.name ?? session.locationId}</span>
		<SidebarTrigger class="h-8 w-8" />
	</div>
</header>
