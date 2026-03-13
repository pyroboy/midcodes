<script lang="ts">
	import type { Order, Table } from '$lib/types';
	import { formatPeso, cn } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		orders: Order[];
		tables: Table[];
		onClose: () => void;
		onViewOrder: (order: Order) => void;
	}

	let { isOpen, orders, tables, onClose, onViewOrder }: Props = $props();

	function getTableLabel(order: Order): string {
		if (order.orderType === 'takeout') return '';
		const table = tables.find(t => t.id === order.tableId);
		return table?.label ?? `T${order.tableNumber}`;
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
		<div class="flex h-[600px] w-full max-w-[700px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					<h2 class="text-lg font-bold text-gray-900">Order History</h2>
					<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">{orders.length} orders</span>
				</div>
				<button onclick={onClose} class="text-gray-400 hover:text-gray-600 text-lg" style="min-height: unset">✕</button>
			</div>

			<!-- Orders list -->
			<div class="flex-1 overflow-y-auto divide-y divide-border">
				{#if orders.length === 0}
					<div class="flex h-full items-center justify-center text-sm text-gray-400">
						No completed orders yet
					</div>
				{:else}
					{#each orders as order (order.id)}
						<div class="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-gray-900">
										{#if order.orderType === 'takeout'}
											📦 {order.customerName ?? 'Walk-in'}
										{:else}
											🪑 {getTableLabel(order)}
										{/if}
									</span>
									{#if order.packageName}
										<span class="text-xs text-gray-400">{order.packageName}</span>
									{/if}
									{#if order.status === 'cancelled'}
										<span class="rounded px-1.5 py-0.5 text-[10px] font-bold bg-status-red-light text-status-red">VOID</span>
										{#if order.cancelReason}
											<span class="rounded px-1.5 py-0.5 text-[10px] text-gray-400 border border-gray-200 capitalize">{order.cancelReason.replace('_', ' ')}</span>
										{/if}
									{:else if order.status === 'paid'}
										<span class="rounded px-1.5 py-0.5 text-[10px] font-bold bg-status-green-light text-status-green">PAID</span>
									{:else}
										<span class="rounded px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-200">UNPAID</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 text-xs text-gray-400">
									<span>{order.pax} pax</span>
									<span>·</span>
									<span>{order.items.filter(i => i.status !== 'cancelled').length} items</span>
									<span>·</span>
									<span>{order.closedAt ? new Date(order.closedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
									{#if order.payments.length > 0}
										<span>·</span>
										<span class="capitalize">{order.payments[0].method}</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span class={cn(
									'font-mono text-sm font-bold',
									order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'
								)}>
									{formatPeso(order.total)}
								</span>
								{#if order.status === 'paid' || (order.status !== 'cancelled')}
									<button onclick={() => onViewOrder(order)} class="text-xs font-semibold text-accent hover:underline" style="min-height: unset">View</button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Summary footer -->
			{#if orders.length > 0}
				{@const paidOrders = orders.filter(o => o.status === 'paid')}
				{@const voidedOrders = orders.filter(o => o.status === 'cancelled')}
				{@const unpaidOrders = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled')}
				<div class="flex items-center justify-between border-t border-border px-6 py-3 bg-surface-secondary">
					<span class="text-sm font-semibold text-gray-600">{paidOrders.length} paid · {unpaidOrders.length} unpaid · {voidedOrders.length} voided</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
