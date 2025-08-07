<script lang="ts">
	import { getContext } from 'svelte';
	import { toggleVariants } from '../toggle/toggle.svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type $$Props = {
		value: string;
		children: any;
	} & Omit<HTMLAttributes<HTMLButtonElement>, 'value'>;

	let { value, class: className = '', children } = $props();

	const context = getContext<any>('toggle-group');

	function handleClick(event: MouseEvent) {
		if (context.type === 'single') {
			context.onValueChange?.(value);
		} else {
			const arrValue = context.value as string[] | undefined;
			if (!arrValue) {
				context.onValueChange?.([value]);
				return;
			}
			const newArr = arrValue.includes(value)
				? arrValue.filter((v: string) => v !== value)
				: [...arrValue, value];
			context.onValueChange?.(newArr);
		}
	}

	const isSelected = $derived(
		Array.isArray(context.value) ? context.value.includes(value) : context.value === value
	);
</script>

<button
	type="button"
	role={context.type === 'single' ? 'radio' : 'checkbox'}
	aria-checked={isSelected}
	data-state={isSelected ? 'on' : 'off'}
	class={cn(toggleVariants({ variant: context.variant, size: context.size }), className)}
	onclick={handleClick}
>
	{@render children()}
</button>
