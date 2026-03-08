<script lang="ts">
	import type { Order, Table, PaymentMethod } from '$lib/types';
	import { formatPeso, cn } from '$lib/utils';
	import { correctPaymentMethod } from '$lib/stores/pos/payments.svelte';
	import ManagerPinModal from '$lib/components/pos/ManagerPinModal.svelte';

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

	// ─── Payment Correction ───────────────────────────────────────────────────
	let correctingOrderId = $state<string | null>(null);
	let pendingMethod = $state<PaymentMethod | null>(null);
	let showCorrectionPin = $state(false);

	const PAYMENT_METHODS: { method: PaymentMethod; label: string }[] = [
		{ method: 'cash',  label: '💵 Cash' },
		{ method: 'gcash', label: '📱 GCash' },
		{ method: 'maya',  label: '🟣 Maya' },
	];

	function requestCorrection(order: Order, method: PaymentMethod) {
		correctingOrderId = order.id;
		pendingMethod = method;
		showCorrectionPin = true;
	}

	async function handleCorrectionConfirmed() {
		if (!correctingOrderId || !pendingMethod) return;
		showCorrectionPin = false;
		await correctPaymentMethod(correctingOrderId, pendingMethod);
		correctingOrderId = null;
		pendingMethod = null;
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
								{#if order.status === 'paid'}
									<div class="flex items-center gap-1.5">
										<button onclick={() => onViewOrder(order)} class="text-xs font-semibold text-accent hover:underline" style="min-height: unset">View</button>
										{#if correctingOrderId === order.id}
											<div class="flex items-center gap-1">
												{#each PAYMENT_METHODS as pm}
													{@const isCurrent = order.payments[0]?.method === pm.method}
													<button onclick={() => requestCorrection(order, pm.method)} disabled={isCurrent} class={cn('rounded px-2 py-0.5 text-[10px] font-bold border transition-colors', isCurrent ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default' : 'bg-white text-gray-700 border-gray-300 hover:bg-accent hover:text-white hover:border-accent')} style="min-height: unset">{pm.label}</button>
												{/each}
												<button onclick={() => (correctingOrderId = null)} class="text-gray-400 hover:text-gray-600 text-xs px-1" style="min-height: unset">✕</button>
											</div>
										{:else}
											<button onclick={() => (correctingOrderId = order.id)} class="text-[10px] font-semibold text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 hover:border-gray-300" style="min-height: unset">Correct</button>
										{/if}
									</div>
								{:else if order.status !== 'cancelled'}
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
				{@const totalSales = paidOrders.reduce((s, o) => s + o.total, 0)}
				<div class="flex items-center justify-between border-t border-border px-6 py-3 bg-surface-secondary">
					<span class="text-sm font-semibold text-gray-600">{paidOrders.length} paid · {unpaidOrders.length} unpaid · {voidedOrders.length} voided</span>
					<div class="flex items-center gap-2">
						<span class="text-xs text-gray-500">Total Sales</span>
						<span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(totalSales)}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<ManagerPinModal
	isOpen={showCorrectionPin}
	title="Authorize Payment Correction"
	description="Correcting a closed order's payment method requires Manager PIN. This action is logged."
	confirmLabel="Correct Payment"
	onClose={() => { showCorrectionPin = false; correctingOrderId = null; pendingMethod = null; }}
	onConfirm={handleCorrectionConfirmed}
/>
