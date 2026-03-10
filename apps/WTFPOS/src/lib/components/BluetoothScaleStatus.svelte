<script lang="ts">
	import { cn } from '$lib/utils';
	import { Bluetooth, BatteryMedium, Weight, Unplug } from 'lucide-svelte';
	import {
		btScale,
		startScan,
		disconnect,
		simulateWeightPlacement,
		simulateWeightRemoval,
	} from '$lib/stores/bluetooth-scale.svelte';
	import BluetoothScalePairModal from './BluetoothScalePairModal.svelte';
	import BluetoothScaleSimulator from './BluetoothScaleSimulator.svelte';

	let isOpen = $state(false);
	let showPairModal = $state(false);
	let showSimulator = $state(false);

	const isConnected = $derived(btScale.connectionStatus === 'connected');
	const isScanning = $derived(btScale.connectionStatus === 'scanning');

	function toggleOpen() {
		isOpen = !isOpen;
	}

	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.bt-status-container')) {
			isOpen = false;
		}
	}

	function handleScan() {
		isOpen = false;
		showPairModal = true;
		startScan();
	}

	function handleDisconnect() {
		disconnect();
	}

	const PRESET_WEIGHTS = [
		{ label: '100g', grams: 100 },
		{ label: '250g', grams: 250 },
		{ label: '500g', grams: 500 },
		{ label: '1kg', grams: 1000 },
		{ label: '2kg', grams: 2000 },
	];
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="relative bt-status-container">
	<button
		onclick={toggleOpen}
		class="relative flex min-h-[56px] min-w-[56px] items-center justify-center gap-1.5 rounded-lg px-3 hover:bg-gray-100 transition-colors"
		title="Bluetooth Scale"
	>
		<Bluetooth class={cn('w-5 h-5 shrink-0', isConnected ? 'text-status-bluetooth' : 'text-gray-400')} />
		<span class="hidden text-xs font-medium sm:inline">{isConnected ? 'Scale' : 'BT Scale'}</span>

		{#if isConnected}
			<span class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-status-bluetooth border-2 border-white"></span>
		{:else if isScanning}
			<span class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-status-bluetooth border-2 border-white animate-pulse"></span>
		{/if}
	</button>

	{#if isOpen}
		<div class="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col">
			<!-- Header -->
			<div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
				<h3 class="font-semibold text-gray-800 text-sm">Bluetooth Scale</h3>
				<p class="text-xs text-gray-500 mt-0.5">
					{#if isConnected}
						Connected to {btScale.deviceName}
					{:else}
						No scale connected
					{/if}
				</p>
			</div>

			<div class="p-3 flex flex-col gap-2">
				{#if isConnected}
					<!-- Status info -->
					<div class="flex items-center justify-between text-sm px-1">
						<div class="flex items-center gap-1.5 text-gray-500">
							<BatteryMedium class="w-4 h-4" />
							<span class="text-xs">{btScale.batteryLevel}%</span>
						</div>
						<div class="flex items-center gap-1.5">
							<Weight class="w-4 h-4 text-gray-500" />
							<span class={cn(
								'text-xs font-mono font-semibold',
								btScale.stability === 'stable' ? 'text-status-green' :
								btScale.stability === 'unstable' ? 'text-status-yellow' :
								'text-gray-400'
							)}>
								{btScale.stability === 'unstable' ? '~' : ''}{btScale.currentWeight}g
							</span>
							{#if btScale.stability !== 'idle'}
								<span class={cn(
									'text-[10px] font-semibold uppercase',
									btScale.stability === 'stable' ? 'text-status-green' : 'text-status-yellow'
								)}>
									{btScale.stability}
								</span>
							{/if}
						</div>
					</div>

					<!-- Interactive Simulator -->
					<button
						onclick={() => { isOpen = false; showSimulator = true; }}
						class="flex items-center justify-center gap-2 rounded-lg bg-status-bluetooth px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors w-full"
						style="min-height: unset"
					>
						<Weight class="w-3.5 h-3.5" />
						Open Simulator
					</button>

					<!-- Simulation Controls -->
					<div class="border-t border-gray-100 pt-2 mt-1">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">Simulate Weight</span>
						<div class="flex flex-wrap gap-1.5 mt-1.5">
							{#each PRESET_WEIGHTS as preset}
								<button
									onclick={() => simulateWeightPlacement(preset.grams)}
									class="rounded-md bg-status-bluetooth-light text-status-bluetooth px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-100 transition-colors"
									style="min-height:unset"
								>
									{preset.label}
								</button>
							{/each}
							<button
								onclick={() => simulateWeightRemoval()}
								class="rounded-md bg-gray-100 text-gray-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-200 transition-colors"
								style="min-height:unset"
							>
								Remove
							</button>
						</div>
					</div>

					<!-- Disconnect -->
					<button
						onclick={handleDisconnect}
						class="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
						style="min-height: unset"
					>
						<Unplug class="w-3.5 h-3.5" />
						Disconnect
					</button>
				{:else}
					<!-- Scan button -->
					<button
						onclick={handleScan}
						class="flex items-center justify-center gap-2 rounded-lg bg-status-bluetooth px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
					>
						<Bluetooth class="w-4 h-4" />
						Scan for Devices
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<BluetoothScalePairModal
	isOpen={showPairModal}
	onClose={() => { showPairModal = false; }}
	onPaired={() => { showPairModal = false; isOpen = false; }}
/>

<BluetoothScaleSimulator
	isOpen={showSimulator}
	onclose={() => { showSimulator = false; }}
/>
