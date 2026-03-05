<script lang="ts">
	import { menuItems, changePackage } from '$lib/stores/pos.svelte';
	import { formatPeso, cn } from '$lib/utils';
	import type { Order } from '$lib/types';

	let {
		order,
		onclose,
		onchange
	}: {
		order: Order;
		onclose: () => void;
		onchange: () => void;
	} = $props();

	const MANAGER_PIN = '1234';

	let step = $state<'select' | 'pin'>('select');
	let selectedPackageId = $state<string | null>(null);
	let pin = $state('');
	let pinError = $state(false);

	const packages = $derived(menuItems.value.filter(m => m.category === 'packages' && m.available));
	const currentPkg = $derived(menuItems.value.find(m => m.id === order.packageId));

	function selectPackage(pkgId: string) {
		if (pkgId === order.packageId) return;
		selectedPackageId = pkgId;

		const newPkg = menuItems.value.find(m => m.id === pkgId);
		if (!newPkg || !currentPkg) return;

		const diff = newPkg.price - currentPkg.price;
		if (diff < 0) {
			// Downgrade requires PIN
			step = 'pin';
			pin = '';
			pinError = false;
		} else {
			// Upgrade: no PIN needed
			doChange();
		}
	}

	function doChange() {
		if (!selectedPackageId) return;
		changePackage(order.id, selectedPackageId);
		onchange();
	}

	function confirmWithPin() {
		if (pin !== MANAGER_PIN) {
			pinError = true;
			return;
		}
		doChange();
	}

	function priceDiff(pkgPrice: number): number {
		if (!currentPkg) return 0;
		return (pkgPrice - currentPkg.price) * order.pax;
	}
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<div class="pos-card w-[440px] flex flex-col gap-4">
		{#if step === 'select'}
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">🔄 Change Package</h3>
				<button onclick={onclose} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>
			<p class="text-sm text-gray-500">Current: <strong>{currentPkg?.name}</strong> · {order.pax} pax</p>

			<div class="flex flex-col gap-2">
				{#each packages as pkg (pkg.id)}
					{@const diff = priceDiff(pkg.price)}
					{@const isCurrent = pkg.id === order.packageId}
					<button
						onclick={() => selectPackage(pkg.id)}
						disabled={isCurrent}
						class={cn(
							'flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98]',
							isCurrent
								? 'border-accent bg-accent-light cursor-default'
								: 'border-border bg-surface hover:border-gray-300 hover:bg-gray-50'
						)}
						style="min-height: 64px"
					>
						<div class="flex flex-col gap-0.5">
							<span class="text-base font-bold text-gray-900">{pkg.name}</span>
							<span class="font-mono text-sm text-gray-600">₱{pkg.price}/pax</span>
							{#if pkg.perks}<span class="text-xs text-gray-400">✓ {pkg.perks}</span>{/if}
						</div>
						<div class="flex flex-col items-end gap-1">
							{#if isCurrent}
								<span class="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white">CURRENT</span>
							{:else if diff > 0}
								<span class="rounded bg-status-green-light px-2 py-0.5 text-xs font-bold text-status-green">+{formatPeso(diff)}</span>
								<span class="text-[10px] text-gray-400">upgrade</span>
							{:else if diff < 0}
								<span class="rounded bg-status-red-light px-2 py-0.5 text-xs font-bold text-status-red">{formatPeso(diff)}</span>
								<span class="text-[10px] text-gray-400">downgrade · PIN</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<button class="btn-ghost w-full" onclick={onclose}>Cancel</button>

		{:else}
			<!-- PIN for downgrade -->
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-status-red">Manager PIN Required</h3>
				<p class="text-sm text-gray-500">Downgrade requires manager approval.</p>
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex justify-center gap-3">
					{#each [0, 1, 2, 3] as idx}
						<div class={cn(
							'h-4 w-4 rounded-full border-2 transition-all',
							idx < pin.length
								? (pinError ? 'bg-status-red border-status-red' : 'bg-accent border-accent')
								: 'border-gray-300'
						)}></div>
					{/each}
				</div>
				{#if pinError}
					<p class="text-center text-xs font-semibold text-status-red">Incorrect PIN. Try again.</p>
				{/if}
			</div>

			<div class="grid grid-cols-3 gap-2">
				{#each [1,2,3,4,5,6,7,8,9] as num}
					<button
						onclick={() => { pinError = false; if (pin.length < 4) pin += String(num); }}
						class="btn-secondary h-12 text-lg font-bold"
						style="min-height: 48px"
					>{num}</button>
				{/each}
				<button onclick={() => { pin = ''; pinError = false; }} class="btn-ghost h-12 text-sm" style="min-height: 48px">Clear</button>
				<button onclick={() => { pinError = false; if (pin.length < 4) pin += '0'; }} class="btn-secondary h-12 text-lg font-bold" style="min-height: 48px">0</button>
				<button onclick={() => { pin = pin.slice(0, -1); pinError = false; }} class="btn-ghost h-12 text-sm" style="min-height: 48px">⌫</button>
			</div>

			<div class="flex gap-2 mt-1">
				<button class="btn-ghost flex-1" onclick={() => { step = 'select'; pin = ''; }} style="min-height: 44px">← Back</button>
				<button
					onclick={confirmWithPin}
					disabled={pin.length !== 4}
					class="btn-primary flex-1 disabled:opacity-40"
					style="min-height: 44px"
				>✓ Confirm Change</button>
			</div>
		{/if}
	</div>
</div>
