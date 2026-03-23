<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { Briefcase, MessageSquare } from 'lucide-svelte';

	let { children }: { children: Snippet } = $props();
	// Light mode is default — dark mode toggle moved to admin/settings
</script>

<div class="flex h-screen flex-col bg-background text-foreground">
	<header class="sticky top-0 z-50 flex h-16 flex-shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
		<button onclick={() => { const event = new CustomEvent('toggle-sidebar'); window.dispatchEvent(event); }} class="flex items-center gap-2 lg:pointer-events-none">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<Briefcase class="h-4 w-4" />
			</div>
			<span class="text-lg font-bold tracking-tight">FlowWork</span>
		</button>

		<div class="flex items-center gap-1.5">
			<!-- Messages -->
			<a
				href="/messages"
				class="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Messages"
			>
				<MessageSquare class="h-5 w-5" />
				<span class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
					3
				</span>
			</a>

			<!-- Avatar -->
			<div class="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
				AJ
			</div>
		</div>
	</header>

	<div class="flex-1 overflow-auto">
		{@render children()}
	</div>
</div>
