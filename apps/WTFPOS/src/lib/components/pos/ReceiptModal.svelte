<script lang="ts">
	import type { Order } from '$lib/types';
	import { formatPeso } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		order: Order | null;
		change: number;
		method: string;
		onClose: () => void;
	}

	let { isOpen, order, change, method, onClose }: Props = $props();

	// P1-1: Only show paid (non-FREE) items on receipt; collapse package includes
	const receiptItems = $derived.by(() => {
		if (!order) return { paid: [] as Order['items'], refillCount: 0 };
		const active = order.items.filter(i => i.status !== 'cancelled');
		const paid = active.filter(i => i.tag !== 'FREE');
		const refillCount = active.filter(i => i.tag === 'FREE' && i.notes?.includes('REFILL')).length;
		return { paid, refillCount };
	});
</script>

{#if isOpen && order}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[380px] flex flex-col gap-0 overflow-hidden p-0">
			<!-- Receipt Header -->
			<div class="flex flex-col items-center gap-1 border-b border-dashed border-gray-300 px-6 py-5 bg-surface">
				<span class="text-2xl">✓</span>
				<span class="text-lg font-bold text-gray-900">Payment Successful</span>
				<span class="text-xs text-gray-500">
					{order.orderType === 'takeout'
						? `Takeout — ${order.customerName ?? 'Walk-in'}`
						: `Table ${order.tableNumber}`}
				</span>
			</div>

			<!-- Receipt Body -->
			<div class="flex flex-col gap-2 border-b border-dashed border-gray-300 px-6 py-4 font-mono text-sm">
				<!-- P1-1: Only show paid items (package line + paid add-ons), hide FREE included items -->
				{#each receiptItems.paid as item}
					<div class="flex justify-between">
						<span class="text-gray-700 truncate max-w-[200px]">
							{item.quantity > 1 ? `${item.quantity}× ` : ''}{item.menuItemName}
							{#if item.weight}<span class="text-gray-400"> {item.weight}g</span>{/if}
						</span>
						<span class="text-gray-900">{formatPeso(item.unitPrice * item.quantity)}</span>
					</div>
				{/each}
				{#if receiptItems.refillCount > 0}
					<div class="flex justify-between text-gray-400 text-xs italic">
						<span>Includes {receiptItems.refillCount} refill{receiptItems.refillCount === 1 ? '' : 's'} served</span>
					</div>
				{/if}

				<div class="border-t border-dashed border-gray-200 my-1"></div>

				<div class="flex justify-between text-gray-600">
					<span>Subtotal</span>
					<span>{formatPeso(order.subtotal)}</span>
				</div>
				{#if order.discountType !== 'none'}
					<div class="flex justify-between text-status-green">
						<span>Discount ({order.discountType === 'senior' ? 'SC' : 'PWD'} 20%)</span>
						<span>-{formatPeso(order.discountAmount)}</span>
					</div>
				{/if}
				<div class="flex justify-between text-gray-500 text-xs">
					<span>VAT {order.discountType !== 'none' ? '(exempt)' : '(inclusive)'}</span>
					<span>{formatPeso(order.vatAmount)}</span>
				</div>
				<div class="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1">
					<span>TOTAL</span>
					<span>{formatPeso(order.total)}</span>
				</div>

				<div class="border-t border-dashed border-gray-200 mt-1 pt-2">
					<div class="flex justify-between">
						<span class="text-gray-600">Paid via</span>
						<span class="font-bold text-gray-900">{method}</span>
					</div>
					{#if method === 'Cash' && change > 0}
						<div class="flex justify-between">
							<span class="text-gray-600">Tendered</span>
							<span>{formatPeso(order.total + change)}</span>
						</div>
						<div class="flex justify-between text-status-green font-bold">
							<span>Change</span>
							<span>{formatPeso(change)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Receipt Footer -->
			<div class="flex flex-col items-center gap-1 border-b border-dashed border-gray-300 px-6 py-3 text-center">
				<span class="text-[10px] text-gray-400 font-mono">
					{(order.closedAt ? new Date(order.closedAt) : new Date()).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
				</span>
				<span class="text-[10px] text-gray-400 font-mono">WTF! Samgyupsal — Thank you!</span>
			</div>

			<div class="flex gap-3 px-6 py-4">
				<button
					onclick={onClose}
					class="btn-primary flex-1"
					style="min-height: 44px"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
