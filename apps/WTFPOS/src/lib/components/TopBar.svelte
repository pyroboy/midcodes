<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		userName = 'Staff',
		rightSlot
	}: {
		userName?: string;
		rightSlot?: import('svelte').Snippet;
	} = $props();
</script>

<header class="topbar shrink-0">
	<!-- Left: brand -->
	<div class="flex items-center gap-2">
		<span class="text-lg font-extrabold text-gray-900 tracking-tight">WTF! SAMGYUP</span>
		<span
			class="inline-flex h-5 items-center rounded-full bg-accent px-2 text-[10px] font-bold text-white uppercase tracking-wide"
		>
			POS
		</span>
	</div>

	<!-- Right: slot for page-specific actions -->
	<div class="flex items-center gap-3">
		{#if rightSlot}
			{@render rightSlot()}
		{/if}

		<!-- User badge -->
		<div class="flex items-center gap-2">
			<span
				class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent"
			>
				{userName.charAt(0).toUpperCase()}
			</span>
			<span class="text-sm font-medium text-gray-700">{userName}</span>
		</div>

		<a
			href="/"
			class="btn-ghost rounded-md px-3 py-1.5 text-sm"
			style="min-height: 36px"
		>
			Logout
		</a>
	</div>
</header>
