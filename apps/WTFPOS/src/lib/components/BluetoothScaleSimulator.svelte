<script lang="ts">
	import { cn } from '$lib/utils';
	import { Weight, RotateCcw } from 'lucide-svelte';
	import {
		btScale,
		startHoldWeight,
		stopHoldWeight,
		drainWeight,
	} from '$lib/stores/bluetooth-scale.svelte';

	interface Props {
		isOpen: boolean;
		onclose: () => void;
	}

	let { isOpen, onclose }: Props = $props();

	let isHolding = $state(false);

	function handlePointerDown(e: PointerEvent) {
		e.preventDefault();
		isHolding = true;
		startHoldWeight();
	}

	function handlePointerUp() {
		if (!isHolding) return;
		isHolding = false;
		stopHoldWeight();
	}

	function handleRemove() {
		isHolding = false;
		drainWeight();
	}

	const weightDisplay = $derived(btScale.currentWeight);
	const stabilityLabel = $derived(btScale.stability);
	const isStable = $derived(stabilityLabel === 'stable');
	const isUnstable = $derived(stabilityLabel === 'unstable');

	// Visual fill height (max ~2kg = 2000g)
	const fillPct = $derived(Math.min(100, (weightDisplay / 2000) * 100));
</script>

<svelte:window onpointerup={handlePointerUp} />

{#if isOpen}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[360px] flex flex-col gap-4 select-none">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-bold text-gray-900">Scale Simulator</h3>
					<p class="text-xs text-gray-500">{btScale.deviceName ?? 'Simulated Scale'}</p>
				</div>
				<button onclick={onclose} class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center">X</button>
			</div>

			<!-- Weight readout -->
			<div class="flex flex-col items-center gap-1 py-2">
				<span class={cn(
					'font-mono text-5xl font-extrabold tabular-nums tracking-tight transition-colors',
					isStable ? 'text-status-green' : isUnstable ? 'text-status-yellow' : 'text-gray-300'
				)}>
					{weightDisplay}<span class="text-2xl ml-1">g</span>
				</span>
				<span class={cn(
					'text-xs font-semibold uppercase tracking-widest',
					isStable ? 'text-status-green' : isUnstable ? 'text-status-yellow' : 'text-gray-300'
				)}>
					{stabilityLabel === 'idle' ? 'ready' : stabilityLabel}
				</span>
			</div>

			<!-- Scale plate - hold to add weight -->
			<div class="relative">
				<!-- Fill bar behind the plate -->
				<div class="absolute bottom-0 left-0 right-0 rounded-2xl overflow-hidden" style="height: 100%;">
					<div
						class={cn(
							'absolute bottom-0 left-0 right-0 transition-all duration-100 rounded-b-2xl',
							isHolding ? 'bg-status-yellow/20' : isStable ? 'bg-status-green/15' : 'bg-status-bluetooth/10'
						)}
						style="height: {fillPct}%"
					></div>
				</div>

				<button
					onpointerdown={handlePointerDown}
					class={cn(
						'relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 transition-all cursor-pointer active:scale-[0.98]',
						isHolding
							? 'border-status-yellow bg-status-yellow/5'
							: isStable
								? 'border-status-green bg-status-green/5'
								: 'border-gray-300 bg-gray-50 hover:border-gray-400'
					)}
				>
					<Weight class={cn(
						'w-10 h-10 transition-colors',
						isHolding ? 'text-status-yellow' : isStable ? 'text-status-green' : 'text-gray-400'
					)} />
					<span class={cn(
						'text-sm font-semibold transition-colors',
						isHolding ? 'text-status-yellow' : 'text-gray-500'
					)}>
						{isHolding ? 'Adding weight...' : 'Hold to place on scale'}
					</span>
				</button>
			</div>

			<!-- Remove / Tare -->
			<button
				onclick={handleRemove}
				disabled={weightDisplay <= 0}
				class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<RotateCcw class="w-4 h-4" />
				Remove from Scale
			</button>

			<p class="text-[10px] text-center text-gray-400 -mt-2">
				Hold the plate to increase weight. Release to stabilize. Remove to clear.
			</p>
		</div>
	</div>
{/if}
