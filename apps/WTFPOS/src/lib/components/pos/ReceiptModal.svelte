<script lang="ts">
	import type { Order, DiscountEntry } from '$lib/types';
	import { formatPeso } from '$lib/utils';
	import { printReceipt } from '$lib/stores/hardware.svelte';
	import { LOCATIONS } from '$lib/stores/session.svelte';

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

	// [04] Branch display name from order locationId
	const branchName = $derived.by(() => {
		if (!order) return 'WTF! Samgyupsal';
		const loc = LOCATIONS.find(l => l.id === order.locationId);
		return loc ? `WTF! Samgyupsal — ${loc.name}` : 'WTF! Samgyupsal';
	});

	// [02] Compute the correct package subtotal when child/free pax applies
	function packageLineAmount(order: Order, item: Order['items'][number]): number {
		const childPax = order.childPax ?? 0;
		const freePax = order.freePax ?? 0;
		if (item.tag === 'PKG' && (childPax > 0 || freePax > 0)) {
			const totalPax = order.pax;
			const adultPax = Math.max(0, totalPax - childPax - freePax);
			const childUnitPrice = item.childUnitPrice ?? item.unitPrice;
			return item.unitPrice * adultPax + childUnitPrice * childPax;
		}
		return item.unitPrice * item.quantity;
	}

	// [02] Build display lines for package item (show breakdown when mixed pricing)
	function packageBreakdownLines(order: Order, item: Order['items'][number]): { label: string; amount: number }[] | null {
		const childPax = order.childPax ?? 0;
		const freePax = order.freePax ?? 0;
		if (item.tag === 'PKG' && (childPax > 0 || freePax > 0)) {
			const totalPax = order.pax;
			const adultPax = Math.max(0, totalPax - childPax - freePax);
			const childUnitPrice = item.childUnitPrice ?? item.unitPrice;
			const lines: { label: string; amount: number }[] = [];
			if (adultPax > 0) lines.push({ label: `  ${adultPax} adult${adultPax > 1 ? 's' : ''} × ${formatPeso(item.unitPrice)}`, amount: item.unitPrice * adultPax });
			if (childPax > 0) lines.push({ label: `  ${childPax} child${childPax > 1 ? 'ren' : ''} × ${formatPeso(childUnitPrice)}`, amount: childUnitPrice * childPax });
			return lines;
		}
		return null;
	}

	// [01] Multi-entry discount awareness: true when discountType is set OR discountEntries has keys
	const hasDiscount = $derived.by(() => {
		if (!order) return false;
		return order.discountType !== 'none' || Object.keys(order.discountEntries ?? {}).length > 0;
	});

	// [01] Discount lines — one per type, supports SC + PWD simultaneously
	type DiscountLine = { label: string; ids: string[]; type: string };
	const discountLines = $derived.by((): DiscountLine[] => {
		if (!order) return [];
		const lines: DiscountLine[] = [];
		const totalPax = order.pax;

		const typeLabel = (t: string) =>
			t === 'senior' ? 'Senior Citizen' :
			t === 'pwd' ? 'PWD' :
			t === 'promo' ? 'Promo' :
			t === 'comp' ? 'Comp' : 'Service Recovery';

		if (order.discountEntries && Object.keys(order.discountEntries).length > 0) {
			for (const [type, entry] of Object.entries(order.discountEntries) as [string, DiscountEntry | undefined][]) {
				if (!entry) continue;
				const pax = entry.pax ?? 1;
				const label = (type === 'senior' || type === 'pwd')
					? `${typeLabel(type)} (20%) — ${pax} of ${totalPax} pax`
					: typeLabel(type);
				lines.push({ label, ids: entry.ids?.filter(Boolean) ?? [], type });
			}
		} else if (order.discountType !== 'none') {
			// Legacy fallback
			const qualifyingPax = order.discountPax ?? 1;
			const label = (order.discountType === 'senior' || order.discountType === 'pwd')
				? `${typeLabel(order.discountType)} (20%) — ${qualifyingPax} of ${totalPax} pax`
				: typeLabel(order.discountType);
			lines.push({ label, ids: order.discountIds?.filter(Boolean) ?? [], type: order.discountType });
		}
		return lines;
	});
</script>

{#if isOpen && order}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[380px] flex flex-col gap-0 overflow-hidden p-0">
			<!-- Receipt Header -->
			<div class="flex flex-col items-center gap-1 border-b border-dashed border-gray-300 px-6 py-5 bg-surface">
				<!-- [04] Branch name -->
				<span class="text-[11px] font-semibold text-gray-700 tracking-wide text-center">{branchName}</span>
				<span class="text-2xl">✓</span>
				<span class="text-lg font-bold text-gray-900">Payment Successful</span>
				<span class="text-xs text-gray-500">
					{order.orderType === 'takeout'
						? `Takeout — ${order.customerName ?? 'Walk-in'}`
						: `Table ${order.tableNumber}`}
				</span>
				<!-- [04] Transaction reference (order ID) -->
				<span class="text-[10px] text-gray-400 font-mono mt-1">Ref: {order.id}</span>
			</div>

			<!-- Receipt Body -->
			<div class="flex flex-col gap-2 border-b border-dashed border-gray-300 px-6 py-4 font-mono text-sm">
				<!-- P1-1: Only show paid items (package line + paid add-ons), hide FREE included items -->
				{#each receiptItems.paid as item}
					{@const breakdown = packageBreakdownLines(order, item)}
					<div class="flex justify-between">
						<!-- [03] Removed truncate + max-w to allow wrapping -->
						<span class="text-gray-700 break-words flex-1 pr-2">
							{item.quantity > 1 && item.tag !== 'PKG' ? `${item.quantity}× ` : ''}{item.menuItemName}
							{#if item.weight}<span class="text-gray-400"> {item.weight}g</span>{/if}
						</span>
						{#if !breakdown}
							<span class="text-gray-900 whitespace-nowrap">{formatPeso(packageLineAmount(order, item))}</span>
						{:else}
							<!-- [02] Show correct mixed total for pkg line when breakdown exists -->
							<span class="text-gray-900 whitespace-nowrap">{formatPeso(packageLineAmount(order, item))}</span>
						{/if}
					</div>
					<!-- [02] Adult/child pricing breakdown lines -->
					{#if breakdown}
						{#each breakdown as line}
							<div class="flex justify-between text-gray-500 text-xs">
								<span class="flex-1">{line.label}</span>
								<span class="whitespace-nowrap">{formatPeso(line.amount)}</span>
							</div>
						{/each}
					{/if}
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
				<!-- [01] SC/PWD discount lines — multi-entry aware, one row per type -->
				{#if hasDiscount}
					{#each discountLines as line, li}
						<div class="flex justify-between text-status-green">
							<span class="flex-1 pr-2 break-words">{line.label}</span>
							{#if li === 0}<span class="whitespace-nowrap">-{formatPeso(order.discountAmount)}</span>{/if}
						</div>
						{#if line.ids.length > 0}
							{#each line.ids as idNum, i}
								<div class="text-[10px] text-gray-400 font-mono">
									{line.type === 'senior' ? 'SC' : 'PWD'} ID {i + 1}: {idNum}
								</div>
							{/each}
						{/if}
					{/each}
				{/if}
				<div class="flex justify-between text-gray-500 text-xs">
					<span>{hasDiscount ? 'VAT (exempt)' : 'Incl. VAT (12%)'}</span>
					<span>{formatPeso(order.vatAmount)}</span>
				</div>
				<div class="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1">
					<span>TOTAL</span>
					<span>{formatPeso(order.total)}</span>
				</div>

				<div class="border-t border-dashed border-gray-200 mt-1 pt-2">
					{#if method === 'Split' && order.payments.length >= 2}
						<div class="flex justify-between mb-1">
							<span class="text-gray-600">Paid via</span>
							<span class="font-bold text-gray-900">Split</span>
						</div>
						{#each order.payments as p}
							{@const emoji = p.method === 'cash' ? '💵' : '📱'}
							{@const label = p.method === 'cash' ? 'Cash' : p.method === 'gcash' ? 'GCash' : p.method === 'maya' ? 'Maya' : p.method === 'card' ? 'Card' : p.method}
							<div class="flex justify-between text-gray-700">
								<span>{emoji} {label}</span>
								<span>{formatPeso(p.amount)}</span>
							</div>
						{/each}
					{:else}
						<div class="flex justify-between">
							<span class="text-gray-600">Paid via</span>
							<span class="font-bold text-gray-900">{method}</span>
						</div>
					{/if}
					{#if change > 0}
						{@const cashPayment = order.payments.find(p => p.method === 'cash')}
						{#if cashPayment}
							<div class="flex justify-between">
								<span class="text-gray-600">Cash Tendered</span>
								<span>{formatPeso(cashPayment.amount)}</span>
							</div>
						{:else if method === 'Cash'}
							<div class="flex justify-between">
								<span class="text-gray-600">Tendered</span>
								<span>{formatPeso(order.total + change)}</span>
							</div>
						{/if}
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
					onclick={() => order && printReceipt(order.id)}
					class="btn-secondary flex-1"
					style="min-height: 44px"
				>
					🖨 Print
				</button>
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
