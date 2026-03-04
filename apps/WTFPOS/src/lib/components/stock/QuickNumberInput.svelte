<script lang="ts">
	import { cn } from '$lib/utils';
	import { Plus, Minus } from 'lucide-svelte';

	interface Props {
		value: number | null;
		onChange: (val: number) => void;
		min?: number;
		step?: number;
		placeholder?: string;
	}
	let { value, onChange, min = 0, step = 1, placeholder = '—' }: Props = $props();

	// Use internal state heavily debounced to prevent layout jump while typing
	// State decoupled using getter initially
	let internalValue = $state('');
    let prevVal = $state<number | null>(null);

	// Sync only when external value changes
	$effect(() => {
		if (value !== prevVal) {
			internalValue = value !== null ? String(value) : '';
			prevVal = value;
		}
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		internalValue = target.value;
	}

	function handleBlur() {
		const parsed = parseFloat(internalValue);
		if (!isNaN(parsed) && parsed >= min) {
			onChange(parsed);
		} else if (internalValue === '') {
			onChange(0); // fallback or null if you prefer
		}
	}

	function increment() {
		const parsed = parseFloat(internalValue) || 0;
		internalValue = String(parsed + step);
		onChange(parsed + step);
	}

	function decrement() {
		const parsed = parseFloat(internalValue) || 0;
		if (parsed - step >= min) {
			internalValue = String(parsed - step);
			onChange(parsed - step);
		}
	}
</script>

<div class="flex items-center justify-end gap-1">
	<button
		onclick={decrement}
		class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200"
		tabindex="-1"
	>
		<Minus class="h-4 w-4" />
	</button>
	<input
		type="number"
		{min}
		{step}
		{placeholder}
		value={internalValue}
		oninput={handleInput}
		onblur={handleBlur}
		class="w-20 rounded-md border border-border px-2 py-1.5 text-center font-mono text-[15px] font-semibold text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
	/>
	<button
		onclick={increment}
		class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200"
		tabindex="-1"
	>
		<Plus class="h-4 w-4" />
	</button>
</div>
