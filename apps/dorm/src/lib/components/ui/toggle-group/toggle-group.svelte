<script lang="ts">
	import { setContext } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv, type VariantProps } from 'tailwind-variants';
	import { cn } from '$lib/utils.js';

	export const toggleVariants = tv({
		base: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
		variants: {
			variant: {
				default: 'bg-transparent',
				outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground'
			},
			size: {
				default: 'h-10 px-3',
				sm: 'h-9 px-2.5',
				lg: 'h-11 px-5'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	type $$Props = {
		value?: string | string[];
		onValueChange?: (value: any) => void;
		type?: 'single' | 'multiple';
		children: any;
	} & VariantProps<typeof toggleVariants> & Omit<HTMLAttributes<HTMLDivElement>, 'value'>;

	let {
		value = undefined,
		onValueChange = () => {},
		type = 'single',
		variant = 'default',
		size = 'default',
		class: className = '',
		children
	} = $props();

	setContext('toggle-group', {
		get value() {
			return value;
		},
		onValueChange,
		get type() {
			return type;
		},
		get variant() {
			return variant;
		},
		get size() {
			return size;
		}
	});
</script>

<div
	role={type === 'single' ? 'radiogroup' : 'group'}
	class={cn('inline-flex items-center justify-center gap-1 rounded-md bg-muted p-1 text-muted-foreground', className)}
>
	{@render children()}
</div>