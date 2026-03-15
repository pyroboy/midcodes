<script lang="ts">
	import { cn } from '$lib/utils';
	import { Bluetooth, CheckCircle2, Loader2, Wifi } from 'lucide-svelte';
	import {
		btScale,
		pairDevice,
		startScan,
		type SimulatedDevice,
	} from '$lib/stores/bluetooth-scale.svelte';
	import ModalWrapper from '$lib/components/ModalWrapper.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onPaired: () => void;
	}

	let { isOpen, onClose, onPaired }: Props = $props();

	let pairingDeviceId = $state<string | null>(null);
	let paired = $state(false);

	const isScanning = $derived(btScale.connectionStatus === 'scanning');
	const isPairing = $derived(btScale.connectionStatus === 'pairing');
	const devices = $derived(btScale.discoveredDevices);

	$effect(() => {
		if (isOpen) {
			paired = false;
			pairingDeviceId = null;
			if (btScale.connectionStatus === 'disconnected') {
				startScan();
			}
		}
	});

	async function handlePair(device: SimulatedDevice) {
		pairingDeviceId = device.id;
		const success = await pairDevice(device.id);
		if (success) {
			paired = true;
			setTimeout(() => {
				onPaired();
			}, 1200);
		}
	}

	function signalBars(signal: number): number {
		if (signal >= 80) return 3;
		if (signal >= 50) return 2;
		return 1;
	}
</script>

<ModalWrapper open={isOpen} onclose={onClose} zIndex={70} ariaLabel="Bluetooth scale pairing">
		<div class="pos-card w-full max-w-[480px] min-h-[20rem] flex flex-col gap-5">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Bluetooth Scale</h3>
				<button onclick={onClose} class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center">✕</button>
			</div>

			{#if paired}
				<!-- Success state -->
				<div class="flex flex-col items-center gap-3 py-6">
					<div class="w-14 h-14 rounded-full bg-status-green-light flex items-center justify-center">
						<CheckCircle2 class="w-8 h-8 text-status-green" />
					</div>
					<div class="text-center">
						<p class="font-semibold text-gray-900">Connected!</p>
						<p class="text-sm text-gray-500 mt-0.5">{btScale.deviceName}</p>
					</div>
				</div>

			{:else if isPairing}
				<!-- Pairing state -->
				<div class="flex flex-col items-center gap-3 py-8">
					<Loader2 class="w-10 h-10 text-status-bluetooth animate-spin" />
					<div class="text-center">
						<p class="font-semibold text-gray-900">Pairing...</p>
						<p class="text-sm text-gray-500 mt-0.5">{btScale.deviceName}</p>
					</div>
				</div>

			{:else if isScanning && devices.length === 0}
				<!-- Scanning state -->
				<div class="flex flex-col items-center gap-3 py-8">
					<div class="relative">
						<Bluetooth class="w-10 h-10 text-status-bluetooth animate-pulse" />
					</div>
					<div class="text-center">
						<p class="font-semibold text-gray-900">Searching...</p>
						<p class="text-sm text-gray-500 mt-0.5">Looking for nearby scales</p>
					</div>
				</div>

			{:else}
				<!-- Device list -->
				<div class="flex flex-col gap-2">
					<p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
						{devices.length} device{devices.length !== 1 ? 's' : ''} found
					</p>
					{#each devices as device (device.id)}
						{@const bars = signalBars(device.signal)}
						<button
							onclick={() => handlePair(device)}
							disabled={pairingDeviceId !== null}
							class="flex items-center justify-between rounded-xl border border-border bg-white p-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
						>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-status-bluetooth-light flex items-center justify-center">
									<Bluetooth class="w-5 h-5 text-status-bluetooth" />
								</div>
								<div class="text-left">
									<p class="font-semibold text-gray-900 text-sm">{device.name}</p>
									<p class="text-xs text-gray-400">ID: {device.id}</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex items-end gap-0.5" title="{device.signal}% signal">
									{#each [1, 2, 3] as bar}
										<div class={cn(
											'w-1 rounded-full',
											bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : 'h-4',
											bar <= bars ? 'bg-status-bluetooth' : 'bg-gray-200'
										)}></div>
									{/each}
								</div>
								<span class="text-xs font-semibold text-status-bluetooth">Pair</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}

			{#if !paired && !isPairing}
				<button onclick={onClose} class="btn-ghost w-full" style="min-height: 40px">Cancel</button>
			{/if}
		</div>
</ModalWrapper>
