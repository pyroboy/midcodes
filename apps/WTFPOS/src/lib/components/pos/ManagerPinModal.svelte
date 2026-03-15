<script lang="ts">
	import { cn } from '$lib/utils';
	import { MANAGER_PIN } from '$lib/stores/session.svelte';
	import { playSound } from '$lib/utils/audio';
	import ModalWrapper from '$lib/components/ModalWrapper.svelte';
	import { pinpadKeyboard } from '$lib/actions/pinpad-keyboard';

	interface Props {
		isOpen: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		confirmClass?: string;
		onClose: () => void;
		onConfirm: (pin: string) => void;
	}

	let {
		isOpen,
		title = 'Manager Authorization',
		description = 'Enter Manager PIN to continue.',
		confirmLabel = 'Confirm',
		confirmClass = 'btn-primary',
		onClose,
		onConfirm
	}: Props = $props();

	let pin = $state('');
	let pinError = $state(false);

	function handleNumber(num: string) {
		pinError = false;
		if (pin.length < 4) {
			pin += num;
			playSound('click');
		}
	}

	function handleClear() {
		pin = '';
		pinError = false;
	}

	function handleBackspace() {
		pin = pin.slice(0, -1);
		pinError = false;
	}

	function handleConfirm() {
		if (pin !== MANAGER_PIN) {
			pinError = true;
			playSound('error');
			return;
		}
		playSound('success');
		onConfirm(pin);
		pin = '';
		pinError = false;
	}

	$effect(() => {
		if (isOpen) {
			pin = '';
			pinError = false;
		}
	});
</script>

<ModalWrapper open={isOpen} onclose={onClose} zIndex={70} ariaLabel={title} class="px-4">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="pos-card w-full max-w-[380px] flex flex-col gap-4" use:pinpadKeyboard={{ onDigit: handleNumber, onBackspace: handleBackspace, onClear: handleClear, onSubmit: handleConfirm, canSubmit: () => pin.length === 4 }}>
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">{title}</h3>
				<p class="text-sm text-gray-500">{description}</p>
			</div>

			<!-- PIN dots -->
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
				<p class={cn('text-center text-xs font-semibold text-status-red', !pinError && 'invisible')}>Incorrect PIN. Try again.</p>
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
					disabled={pin.length !== 4}
					class={cn(confirmClass, 'flex-1 disabled:opacity-40')}
					style="min-height: 44px"
				>{confirmLabel}</button>
			</div>
		</div>
</ModalWrapper>
