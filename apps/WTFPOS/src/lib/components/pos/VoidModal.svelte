<script lang="ts">
	import { cn } from '$lib/utils';
	import { MANAGER_PIN } from '$lib/stores/session.svelte';
	import { playSound } from '$lib/utils/audio';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: (reason: 'mistake' | 'walkout' | 'write_off', pin: string) => void;
	}

	let { isOpen, onClose, onConfirm }: Props = $props();

	let voidPin = $state('');
	let voidPinError = $state(false);
	let voidReason = $state<'mistake' | 'walkout' | 'write_off'>('mistake');

	function handleNumber(num: string) {
		voidPinError = false;
		if (voidPin.length < 4) {
			voidPin += num;
			playSound('click');
		}
	}

	function handleClear() {
		voidPin = '';
		voidPinError = false;
	}

	function handleBackspace() {
		voidPin = voidPin.slice(0, -1);
		voidPinError = false;
	}

	function handleConfirm() {
		if (voidPin !== MANAGER_PIN) {
			voidPinError = true;
			playSound('error');
			return;
		}
		playSound('warning');
		onConfirm(voidReason, voidPin);
		voidPin = '';
		voidPinError = false;
	}

	$effect(() => {
		if (isOpen) {
			voidPin = '';
			voidPinError = false;
			voidReason = 'mistake';
		}
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
		<div class="pos-card w-full max-w-[340px] flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-status-red">Void Order</h3>
				<p class="text-sm text-gray-500">This will cancel the entire order and free the table. Enter Manager PIN to confirm.</p>
			</div>

			<!-- Reason Selection -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Reason</span>
				<div class="grid grid-cols-3 gap-2">
					{#each [
						{ id: 'mistake' as const, label: 'Mistake' },
						{ id: 'walkout' as const, label: 'Walkout' },
						{ id: 'write_off' as const, label: 'Write-off' }
					] as reason}
						<button
							onclick={() => voidReason = reason.id}
							class={cn(
								'rounded-lg py-2 text-sm font-semibold transition-all',
								voidReason === reason.id
									? 'bg-status-red text-white'
									: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
							)}
							style="min-height: 44px"
						>
							{reason.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- PIN dots -->
			<div class="flex flex-col gap-2">
				<div class="flex justify-center gap-3">
					{#each [0, 1, 2, 3] as idx}
						<div class={cn(
							'h-4 w-4 rounded-full border-2 transition-all',
							idx < voidPin.length
								? (voidPinError ? 'bg-status-red border-status-red' : 'bg-accent border-accent')
								: 'border-gray-300'
						)}></div>
					{/each}
				</div>
				{#if voidPinError}
					<p class="text-center text-xs font-semibold text-status-red">Incorrect PIN. Try again.</p>
				{/if}
			</div>

			<!-- Numpad -->
			<div class="grid grid-cols-3 gap-2">
				{#each [1,2,3,4,5,6,7,8,9] as num}
					<button
						onclick={() => handleNumber(String(num))}
						class="btn-secondary h-12 text-lg font-bold"
						style="min-height: 48px"
					>{num}</button>
				{/each}
				<button
					onclick={handleClear}
					class="btn-ghost h-12 text-sm"
					style="min-height: 48px"
				>Clear</button>
				<button
					onclick={() => handleNumber('0')}
					class="btn-secondary h-12 text-lg font-bold"
					style="min-height: 48px"
				>0</button>
				<button
					onclick={handleBackspace}
					class="btn-ghost h-12 text-sm"
					style="min-height: 48px"
				>⌫</button>
			</div>

			<div class="flex gap-2 mt-1">
				<button class="btn-ghost flex-1" onclick={onClose} style="min-height: 44px">Cancel</button>
				<button
					onclick={handleConfirm}
					disabled={voidPin.length !== 4}
					class="btn-danger flex-1 disabled:opacity-40"
					style="min-height: 44px"
				>Confirm Void</button>
			</div>
		</div>
	</div>
{/if}
