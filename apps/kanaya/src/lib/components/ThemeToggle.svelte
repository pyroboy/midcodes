<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { Button } from './ui/button';
	import { theme, type Theme } from '$lib/stores/theme';

	interface Props {
		size?: 'sm' | 'default' | 'lg';
		variant?: 'ghost' | 'outline' | 'secondary';
		class?: string;
	}

	let { size = 'default', variant = 'ghost', class: className = '' }: Props = $props();

	const sizes = {
		sm: 'h-8 w-8',
		default: 'h-9 w-9',
		lg: 'h-10 w-10'
	};

	const iconSizes = {
		sm: 'h-3.5 w-3.5',
		default: 'h-4 w-4',
		lg: 'h-5 w-5'
	};

	function handleToggle() {
		theme.toggle();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleToggle();
		}
	}
</script>

<Button
	{variant}
	size="icon"
	class={`${sizes[size]} ${className} transition-all duration-200 hover:scale-105 active:scale-95`}
	onclick={handleToggle}
	onkeydown={handleKeyDown}
	aria-label={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
	title={$theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
	role="button"
	tabindex={0}
>
	<div class="relative overflow-hidden">
		{#if $theme === 'light'}
			<Sun
				class={`${iconSizes[size]} transition-all duration-300 text-yellow-500 hover:text-yellow-600 rotate-0 scale-100`}
				aria-hidden="true"
			/>
		{:else}
			<Moon
				class={`${iconSizes[size]} transition-all duration-300 text-blue-400 hover:text-blue-300 rotate-0 scale-100`}
				aria-hidden="true"
			/>
		{/if}
	</div>
	<span class="sr-only">
		{$theme === 'light'
			? 'Currently in light mode. Click to switch to dark mode.'
			: 'Currently in dark mode. Click to switch to light mode.'}
	</span>
</Button>

<style>
	/* Smooth icon transitions */
	:global(.theme-toggle-icon) {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Focus styles for better accessibility */
	:global(.theme-toggle:focus-visible) {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	/* Dark mode focus styles */
	:global(.dark .theme-toggle:focus-visible) {
		outline-color: hsl(var(--ring));
	}

	/* Hover effects */
	:global(.theme-toggle:hover) {
		background-color: hsl(var(--accent));
	}

	:global(.dark .theme-toggle:hover) {
		background-color: hsl(var(--accent));
	}
</style>
