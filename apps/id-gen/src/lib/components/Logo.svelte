<script lang="ts">
	import { CreditCard } from '@lucide/svelte';

	const variants = {
		full: 'flex items-center gap-3',
		compact: 'flex items-center gap-2',
		icon: 'flex items-center'
	} as const;

	const sizes = {
		small: { icon: 'w-6 h-6', text: 'text-lg' },
		default: { icon: 'w-10 h-10', text: 'text-xl' },
		large: { icon: 'w-12 h-12', text: 'text-2xl' }
	} as const;

	type Variant = keyof typeof variants;
	type Size = keyof typeof sizes;

	let { variant = 'full' as Variant, size = 'default' as Size } = $props();
</script>

<a href="/" class={variants[variant]}>
	<div class="{sizes[size].icon} bg-primary rounded-lg flex items-center justify-center">
		<CreditCard
			class="h-{size === 'small' ? '4' : size === 'large' ? '7' : '6'} w-{size === 'small'
				? '4'
				: size === 'large'
					? '7'
					: '6'} text-white"
		/>
	</div>
	{#if variant !== 'icon'}
		<span class="{sizes[size].text} font-bold text-gray-900 dark:text-white"> ID Generator </span>
	{/if}
</a>
