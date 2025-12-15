<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import ApexCharts from 'apexcharts';

	interface Props {
		options: ApexCharts.ApexOptions;
		class?: string;
	}

	let { options, class: className = '' }: Props = $props();
	let chartElement: HTMLDivElement;
	let chart: ApexCharts | null = null;

	onMount(() => {
		chart = new ApexCharts(chartElement, options);
		chart.render();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	// Update chart when options change
	$effect(() => {
		if (chart && options) {
			chart.updateOptions(options, true, true);
		}
	});
</script>

<div bind:this={chartElement} class={className}></div>
