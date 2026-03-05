<script lang="ts">
	import { kdsTicketHistory, recallTicket } from '$lib/stores/pos.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function handleRecall(orderId: string) {
		recallTicket(orderId);
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[500px] max-h-[80vh] flex flex-col gap-0 overflow-hidden p-0">
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-bold text-gray-900">Bumped Ticket History</h3>
					<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">{kdsTicketHistory.value.length}</span>
				</div>
				<button onclick={onClose} class="text-gray-400 hover:text-gray-600 text-lg" style="min-height: unset">✕</button>
			</div>

			<div class="flex-1 overflow-y-auto px-6 py-4">
				{#if kdsTicketHistory.value.length === 0}
					<div class="text-center py-8">
						<div class="text-3xl mb-2">✅</div>
						<p class="text-sm text-gray-400">No bumped tickets this shift.</p>
					</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each kdsTicketHistory.value as entry (entry.orderId + entry.bumpedAt)}
							<div class="rounded-lg border border-border bg-gray-50 p-4">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold text-gray-900">
											{entry.tableNumber !== null ? `T${entry.tableNumber}` : entry.customerName ?? 'Takeout'}
										</span>
										<span class="text-xs text-gray-400">Bumped {formatTime(entry.bumpedAt)}</span>
									</div>
									<button
										onclick={() => handleRecall(entry.orderId)}
										class="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-dark transition-colors"
										style="min-height: 32px"
									>
										↩ Recall
									</button>
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each entry.items as item}
										<span class={cn(
											'rounded px-2 py-0.5 text-[10px] font-semibold',
											item.category === 'meats' ? 'bg-pink-100 text-pink-700' :
											item.category === 'sides' ? 'bg-green-100 text-green-700' :
											'bg-blue-100 text-blue-700'
										)}>
											{item.quantity}× {item.menuItemName}{item.weight ? ` (${item.weight}g)` : ''}
										</span>
									{/each}
								</div>
								<div class="mt-1 text-[10px] text-gray-300">by {entry.bumpedBy}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="border-t border-border px-6 py-3">
				<button onclick={onClose} class="btn-secondary w-full" style="min-height: 44px">Close</button>
			</div>
		</div>
	</div>
{/if}
