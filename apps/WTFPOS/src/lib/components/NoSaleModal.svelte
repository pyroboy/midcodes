<script lang="ts">
	import { X, HardDrive } from 'lucide-svelte';
	import { openCashDrawer } from '$lib/stores/hardware.svelte';
	import { session } from '$lib/stores/session.svelte';

	export let isOpen = false;
	export let onClose: () => void;

	let pin = '';
	let error = '';
	let loading = false;
	let justOpened = false;
	const MANAGER_PIN = '1234';

	function handleNumber(num: number) {
		if (pin.length < 4) {
			pin += num;
			error = '';
		}
	}

	function handleBackspace() {
		pin = pin.slice(0, -1);
		error = '';
	}

	async function handleSubmit() {
		if (pin !== MANAGER_PIN) {
			error = 'Invalid Manager PIN';
			pin = '';
			return;
		}

		loading = true;
		error = '';
		try {
			await openCashDrawer('Manual No Sale', session.userName || 'Unknown');
			justOpened = true;
			setTimeout(() => {
				justOpened = false;
				pin = '';
				onClose();
			}, 1500); // show success for 1.5s
		} catch (err) {
			error = 'Hardware Error';
		} finally {
			loading = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
		<div class="bg-surface w-full max-w-sm rounded-[1.5rem] p-6 shadow-xl border border-border animate-in zoom-in-95 duration-200 relative">
			<button class="absolute right-5 top-5 text-gray-400 hover:text-gray-900 transition-colors" onclick={onClose}>
				<X class="w-6 h-6" />
			</button>

			<div class="mb-6 flex flex-col items-center text-center">
				<div class="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center mb-4">
					<HardDrive class="w-6 h-6" />
				</div>
				<h2 class="text-xl font-bold text-gray-900">Open Cash Drawer</h2>
				<p class="text-sm text-gray-500 mt-1">Manager authorization required</p>
			</div>

			{#if justOpened}
				<div class="py-8 flex flex-col items-center justify-center text-green-600 bg-green-50 rounded-2xl border border-green-200">
					<HardDrive class="w-12 h-12 mb-3" />
					<h3 class="font-bold text-lg">Drawer Opened</h3>
					<p class="text-sm text-green-700/80">Logged as 'No Sale'</p>
				</div>
			{:else}
				<!-- Keypad -->
				<div class="flex flex-col gap-4">
					<div class="flex items-center justify-center gap-3 py-2">
						{#each Array(4) as _, i}
							<div class="flex h-4 w-4 rounded-full border-2 transition-colors {pin.length > i ? 'bg-accent border-accent' : 'border-gray-300'}"></div>
						{/each}
					</div>

					{#if error}
						<p class="text-center text-sm font-medium text-red-500">{error}</p>
					{:else}
						<p class="text-center text-sm font-medium text-transparent">.</p>
					{/if}

					<div class="grid grid-cols-3 gap-3">
						{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
							<button 
								class="flex h-12 items-center justify-center rounded-xl bg-gray-50 text-xl font-semibold text-gray-900 hover:bg-gray-100 active:bg-gray-200 no-select"
								onclick={() => handleNumber(num)}
								disabled={loading}
							>
								{num}
							</button>
						{/each}
						
						<!-- Empty bottom left -->
						<div class="h-12 w-full"></div>
						
						<!-- 0 key -->
						<button 
							class="flex h-12 items-center justify-center rounded-xl bg-gray-50 text-xl font-semibold text-gray-900 hover:bg-gray-100 active:bg-gray-200 no-select"
							onclick={() => handleNumber(0)}
							disabled={loading}
						>
							0
						</button>
						
						<!-- Backspace/Submit key -->
						{#if pin.length === 4}
							<button 
								class="flex h-12 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-sm hover:bg-accent/90 active:scale-95 transition-all w-full"
								onclick={handleSubmit}
								disabled={loading}
							>
								{#if loading}
									<span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
								{:else}
									OPEN
								{/if}
							</button>
						{:else}
							<button 
								class="flex h-12 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-all w-full"
								onclick={handleBackspace}
								disabled={pin.length === 0 || loading}
							>
								DEL
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
