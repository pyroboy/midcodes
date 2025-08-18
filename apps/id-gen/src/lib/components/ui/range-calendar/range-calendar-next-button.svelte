<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
import { ChevronRight } from '@lucide/svelte';
	import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		variant = 'ghost',
		...restProps
	}: RangeCalendarPrimitive.NextButtonProps & {
		variant?: ButtonVariant;
	} = $props();
</script>

{#snippet Fallback()}
	<ChevronRight class="size-4" />
{/snippet}

<RangeCalendarPrimitive.NextButton
	bind:ref
	class={cn(
		buttonVariants({ variant }),
		'size-(--cell-size) select-none bg-transparent p-0 disabled:opacity-50 rtl:rotate-180',
		className
	)}
	child={(children as any) || Fallback}
	{...restProps}
/>
