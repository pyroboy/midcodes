<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		text?: string;
		children?: Snippet;
	}
	
	let { size = 'md', class: className = '', text, children }: Props = $props();
	
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};
</script>

<div class="flex flex-col items-center justify-center gap-3 {className}">
	<div class="relative">
		<!-- Main spinner -->
		<div class="animate-spin rounded-full border-2 border-border border-t-primary {sizeClasses[size]}"></div>
		
		<!-- Inner glow effect -->
		<div class="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary/50 blur-sm {sizeClasses[size]}"></div>
	</div>
	
	{#if text}
		<p class="text-sm text-muted-foreground animate-pulse">{text}</p>
	{:else if children}
		<div class="text-sm text-muted-foreground animate-pulse">
			{@render children()}
		</div>
	{/if}
</div>