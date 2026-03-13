<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	let { links }: {
		links: { href: string; label: string; icon?: string }[]
	} = $props();

	function isActive(href: string) {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<nav class="flex items-center gap-0.5 border-b border-border bg-surface px-2 sm:px-4 md:px-6 overflow-x-auto scrollbar-none">
	{#each links as link}
		<a
			href={link.href}
			class={cn(
				'flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0',
				isActive(link.href)
					? 'border-b-2 border-accent text-accent'
					: 'text-gray-500 hover:text-gray-900'
			)}
			style="min-height:44px; min-width:unset"
		>
			{#if link.icon}<span>{link.icon}</span>{/if}
			{link.label}
		</a>
	{/each}
</nav>
