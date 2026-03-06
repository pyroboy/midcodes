<script lang="ts">
	import { cn } from '$lib/utils';
	import { btScale, registerReceiver, unregisterReceiver } from '$lib/stores/bluetooth-scale.svelte';
	import { Bluetooth } from 'lucide-svelte';
	import { onDestroy } from 'svelte';

	interface Props {
		id: string;
		value: string;
		onValueChange: (val: string) => void;
		theme?: 'light' | 'dark';
		disabled?: boolean;
		placeholder?: string;
		class?: string;
	}

	let {
		id,
		value,
		onValueChange,
		theme = 'light',
		disabled = false,
		placeholder = '0',
		class: className = '',
	}: Props = $props();

	let flashActive = $state(false);
	let prevStableWeight: number | null = null;

	const isConnected = $derived(btScale.connectionStatus === 'connected');
	const isActiveReceiver = $derived(btScale.activeReceiverId === id);
	const isUnstable = $derived(isActiveReceiver && btScale.stability === 'unstable');

	// Auto-fill when this input is the active receiver and weight stabilizes
	$effect(() => {
		if (!isActiveReceiver || !isConnected) return;
		const stable = btScale.lastStableWeight;
		if (stable !== null && stable !== prevStableWeight && stable > 0) {
			prevStableWeight = stable;
			onValueChange(String(stable));
			// Flash animation
			flashActive = true;
			setTimeout(() => { flashActive = false; }, 600);
		}
	});

	function handleFocus() {
		if (isConnected) registerReceiver(id);
	}

	function handleBlur() {
		unregisterReceiver(id);
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onValueChange(target.value);
	}

	onDestroy(() => {
		unregisterReceiver(id);
	});

	const isDark = $derived(theme === 'dark');
</script>

<div class={cn('relative', className)}>
	<input
		type="number"
		{value}
		{disabled}
		{placeholder}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		class={cn(
			'w-full rounded-lg p-3 font-mono text-xl text-right transition-all',
			isDark
				? 'border bg-gray-800 text-white'
				: 'pos-input text-xl font-mono text-right',
			isConnected && !disabled
				? cn(
					isDark ? 'border-status-bluetooth' : 'border-status-bluetooth focus:border-status-bluetooth focus:ring-blue-100',
					isActiveReceiver && 'ring-2 ring-status-bluetooth/30',
					flashActive && 'animate-border-pulse-bluetooth'
				)
				: isDark ? 'border-gray-700' : '',
			isUnstable && 'opacity-60'
		)}
	/>

	{#if isConnected && !disabled}
		<div class={cn(
			'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none',
			isDark ? 'text-status-bluetooth' : 'text-status-bluetooth'
		)}>
			{#if isUnstable}
				<span class="text-xs font-mono opacity-70">~{btScale.currentWeight}g</span>
			{/if}
			<Bluetooth class="w-4 h-4" />
		</div>
	{/if}
</div>
