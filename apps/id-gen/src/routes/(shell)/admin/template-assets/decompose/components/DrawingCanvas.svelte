<script lang="ts">
	let {
		width,
		height,
		canvasElement = $bindable(),
		context = $bindable()
	}: {
		width: number;
		height: number;
		canvasElement?: HTMLCanvasElement;
		context?: CanvasRenderingContext2D | null;
	} = $props();

	$effect(() => {
		if (canvasElement) {
			context = canvasElement.getContext('2d');
		}
	});
</script>

<canvas
	bind:this={canvasElement}
	{width}
	{height}
	class="absolute inset-0 w-full h-full touch-none"
	style="z-index: 100;"
></canvas>
