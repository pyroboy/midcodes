<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		itemName: string;
		onConfirm: (reason: string) => void;
		onCancel: () => void;
	}

	let { isOpen, itemName, onConfirm, onCancel }: Props = $props();

	const presetReasons = ['Out of Stock', 'Equipment Issue', 'Quality Issue', 'Wrong Order'];

	let selectedPreset = $state<string | null>(null);
	let customReason = $state('');
	let showCustom = $state(false);

	const finalReason = $derived(showCustom ? customReason.trim() : (selectedPreset ?? ''));

	function selectPreset(reason: string) {
		showCustom = false;
		customReason = '';
		selectedPreset = reason;
	}

	function selectOther() {
		selectedPreset = null;
		showCustom = true;
	}

	function handleConfirm() {
		if (finalReason) {
			onConfirm(finalReason);
			reset();
		}
	}

	function handleCancel() {
		onCancel();
		reset();
	}

	function reset() {
		selectedPreset = null;
		customReason = '';
		showCustom = false;
	}

	// Reset state when modal opens
	$effect(() => {
		if (isOpen) reset();
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
		<div class="pos-card w-[420px] max-w-[95vw] flex flex-col overflow-hidden p-0">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					<h3 class="text-lg font-bold text-gray-900">Return Item</h3>
					<span class="badge-orange">{itemName}</span>
				</div>
				<button onclick={handleCancel} class="text-gray-400 hover:text-gray-600 text-lg" style="min-height: unset">
					&#10005;
				</button>
			</div>

			<!-- Body -->
			<div class="px-6 py-5 flex flex-col gap-4">
				<p class="text-sm text-gray-500">Select a reason for returning this item:</p>

				<div class="grid grid-cols-2 gap-3">
					{#each presetReasons as reason}
						<button
							onclick={() => selectPreset(reason)}
							class={cn(
								'rounded-lg border-2 text-sm font-semibold active:scale-95 transition-all',
								selectedPreset === reason
									? 'border-accent bg-accent-light text-accent'
									: 'border-border bg-surface text-gray-700 hover:bg-gray-50'
							)}
							style="min-height: 56px"
						>
							{reason}
						</button>
					{/each}
					<button
						onclick={selectOther}
						class={cn(
							'col-span-2 rounded-lg border-2 text-sm font-semibold active:scale-95 transition-all',
							showCustom
								? 'border-accent bg-accent-light text-accent'
								: 'border-border bg-surface text-gray-700 hover:bg-gray-50'
						)}
						style="min-height: 56px"
					>
						Other...
					</button>
				</div>

				{#if showCustom}
					<!-- svelte-ignore a11y_autofocus -->
					<textarea
						bind:value={customReason}
						class="pos-input resize-none text-sm"
						rows="3"
						placeholder="Type reason..."
						autofocus
					></textarea>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex gap-3 border-t border-border px-6 py-4">
				<button onclick={handleCancel} class="btn-secondary flex-1" style="min-height: 48px">
					Cancel
				</button>
				<button
					onclick={handleConfirm}
					disabled={!finalReason}
					class="btn-danger flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
					style="min-height: 48px"
				>
					Confirm Return
				</button>
			</div>
		</div>
	</div>
{/if}
