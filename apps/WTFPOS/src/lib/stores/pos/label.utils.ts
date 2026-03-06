import type { Order } from '$lib/types';
import { tables } from '$lib/stores/pos/tables.svelte';

/**
 * Returns a display label for an order:
 * - Dine-in: table label from the floor map (falls back to tableId)
 * - Takeout: "Takeout (CustomerName)" or "Takeout (Walk-in)"
 *
 * @param order - the order (or null/undefined for safety)
 * @param explicitTableId - override table lookup (e.g. paySubBill passes tableId separately)
 */
export function getOrderLabel(order: Order | null | undefined, explicitTableId?: string | null): string {
	const tid = explicitTableId ?? order?.tableId;
	if (tid) return tables.value.find(t => t.id === tid)?.label ?? tid;
	return `Takeout (${order?.customerName ?? 'Walk-in'})`;
}
