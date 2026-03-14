<script lang="ts">
	import { playSound } from '$lib/utils/audio';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: (name: string) => void;
	}

	let { isOpen, onClose, onConfirm }: Props = $props();

	let takeoutName = $state('');

	function handleConfirm() {
		playSound('success');
		onConfirm(takeoutName.trim() || 'Walk-in');
		takeoutName = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConfirm();
	}

	$effect(() => {
		if (isOpen) takeoutName = '';
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
		<div class="pos-card w-full max-w-[340px] flex flex-col gap-5">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">📦 New Takeout Order</h3>
				<p class="text-sm text-gray-500">Enter customer name or alias (optional)</p>
			</div>
			<input
				type="text"
				bind:value={takeoutName}
				placeholder="e.g. Maria, Table 5 pickup, etc."
				class="pos-input"
				onkeydown={handleKeydown}
			/>
			<div class="flex gap-2">
				<button class="btn-ghost flex-1" onclick={onClose} style="min-height: 44px">Cancel</button>
				<button class="btn-primary flex-1" onclick={handleConfirm} style="min-height: 44px">
					✓ Create Order
				</button>
			</div>
		</div>
	</div>
{/if}
