<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		used: number;
		total: number;
		class?: string;
		size?: number;
		strokeWidth?: number;
	}
	let { used, total, class: className = '', size = 24, strokeWidth = 3 }: Props = $props();

	const dims = $derived.by(() => {
		const r = (size - strokeWidth) / 2;
		const c = r * 2 * Math.PI;
		const p = total > 0 ? Math.min(100, (used / total) * 100) : 0;
		return { r, c, p, o: c - (p / 100) * c };
	});

	const colorClass = $derived(
		dims.p < 50 ? 'text-status-green' :
		dims.p < 80 ? 'text-status-yellow' :
		'text-status-red'
	);
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	class={cn('rotate-[-90deg]', className)}
	role="progressbar"
	aria-valuemin="0"
	aria-valuemax="100"
	aria-valuenow={dims.p}
>
	<!-- Background Track -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={dims.r}
		class="fill-none stroke-gray-200"
		stroke-width={strokeWidth}
	/>
	<circle
		cx={size / 2}
		cy={size / 2}
		r={dims.r}
		class={cn('fill-none transition-all duration-300 ease-in-out', colorClass)}
		stroke-width={strokeWidth}
		stroke-dasharray={dims.c}
		stroke-dashoffset={dims.o}
		stroke-linecap="round"
	/>
</svg>
