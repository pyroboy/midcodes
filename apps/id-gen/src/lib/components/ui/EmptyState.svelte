<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { ComponentType } from 'svelte';

	interface Props {
		icon: any;
		title: string;
		description: string;
		action?: {
			label: string;
			href?: string;
			onclick?: () => void;
			variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
		};
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		icon: Icon,
		title,
		description,
		action,
		size = 'md',
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		sm: 'py-8',
		md: 'py-12',
		lg: 'py-16'
	} as const;

	const iconSizes = {
		sm: 'w-12 h-12',
		md: 'w-16 h-16',
		lg: 'w-20 h-20'
	} as const;
</script>

<div
	class="flex flex-col items-center justify-center text-center gap-2 {sizeClasses[
		size
	]} {className}"
>
	<div class="mb-2 text-muted-foreground">
		<Icon class="{iconSizes[size]} mx-auto" />
	</div>

	<h3 class="text-lg font-semibold text-foreground">{title}</h3>

	<p class="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>

	{#if action}
		{#if action.href}
			<Button href={action.href} variant={action.variant || 'default'}>
				{action.label}
			</Button>
		{:else if action.onclick}
			<Button onclick={action.onclick} variant={action.variant || 'default'}>
				{action.label}
			</Button>
		{/if}
	{/if}
</div>
