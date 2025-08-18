<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CreditCard } from '@lucide/svelte';

	let { 
		packageId, 
		featureId, 
		amount, 
		currency = 'PHP',
		disabled = false,
		variant = 'default',
		size = 'default',
		children
	} = $props<{
		packageId?: string;
		featureId?: string;
		amount: number;
		currency?: string;
		disabled?: boolean;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		children?: any;
	}>();

	function handlePurchase() {
		console.log('Purchase clicked:', { packageId, featureId, amount, currency });
		// TODO: Implement actual purchase logic
	}
</script>

<Button 
	onclick={handlePurchase}
	{disabled}
	{variant}
	{size}
	class="flex items-center gap-2"
>
	<CreditCard class="w-4 h-4" />
	{#if children}
		{@render children()}
	{:else}
		Purchase ₱{amount}
	{/if}
</Button>
