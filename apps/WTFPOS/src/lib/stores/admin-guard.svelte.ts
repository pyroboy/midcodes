/**
 * admin-guard.svelte.ts
 *
 * Operational safety gate for destructive admin actions during active service.
 *
 * Rule: Before any configuration change that affects live POS, KDS, or floor data,
 * check for active orders. If the service is hot, require Manager PIN to override.
 *
 * This guard is intentionally NOT time-based. The signal is active orders in RxDB —
 * the ground truth — not a clock. A private event at 9am or a late close at 1am
 * are both handled correctly this way.
 */

import { orders } from './pos/orders.svelte';
import { MANAGER_PIN } from './session.svelte';

// ─── Critical Action Registry ─────────────────────────────────────────────────

export type CriticalActionId =
	| 'floor-publish'       // commit layout changes (positions, sizes) while orders are open
	| 'table-delete'        // remove a table — can orphan active order in RxDB
	| 'menu-item-delete'    // remove a menu item — can break package meats[] / autoSides[] refs
	| 'menu-item-disable'   // mark available=false during service — staff can't add more
	| 'package-edit'        // change meats[] / autoSides[] composition mid-service
	| 'pricing-change'      // price change: new items use new price, open orders use old snapshot
	| 'vat-change'          // VAT rate change: immediate effect on all new computations
	| 'location-settings';  // branch-level config (name, type, hours)

export type ActionRisk = 'high' | 'critical';

export interface CriticalAction {
	id: CriticalActionId;
	label: string;
	risk: ActionRisk;
	/** Shown in the guard modal to explain why this matters. */
	description: string;
}

export const CRITICAL_ACTIONS: Record<CriticalActionId, CriticalAction> = {
	'floor-publish': {
		id: 'floor-publish',
		label: 'Publish Floor Layout',
		risk: 'high',
		description:
			'Repositioning tables while staff are actively seating customers can cause confusion between the physical floor and the screen.'
	},
	'table-delete': {
		id: 'table-delete',
		label: 'Delete Table',
		risk: 'critical',
		description:
			'A table with an active order cannot be deleted. Doing so would orphan the order — it would remain in the database but disappear from the floor plan, making it unreachable by staff.'
	},
	'menu-item-delete': {
		id: 'menu-item-delete',
		label: 'Delete Menu Item',
		risk: 'critical',
		description:
			'Existing open orders retain a snapshot of the item name and price. However, any package whose meats[] or autoSides[] references this item by ID will lose that entry permanently.'
	},
	'menu-item-disable': {
		id: 'menu-item-disable',
		label: 'Disable Menu Item',
		risk: 'high',
		description:
			'Staff will not be able to add this item to any current or new orders until it is re-enabled.'
	},
	'package-edit': {
		id: 'package-edit',
		label: 'Edit Package Composition',
		risk: 'high',
		description:
			'Tables opened after this change receive the new package. Tables already seated keep their original item selection — this creates two different versions of the same package in the same service period.'
	},
	'pricing-change': {
		id: 'pricing-change',
		label: 'Change Item Price',
		risk: 'high',
		description:
			'Open orders use the price that was snapshotted when each item was added. Items added to the same bill after this change will use the new price, creating a mixed-price bill.'
	},
	'vat-change': {
		id: 'vat-change',
		label: 'Change VAT Settings',
		risk: 'critical',
		description:
			'VAT rate changes take effect immediately for all new calculations. Bills computed before this change retain their original VAT breakdown. BIR compliance requires this to happen between service periods.'
	},
	'location-settings': {
		id: 'location-settings',
		label: 'Change Branch Settings',
		risk: 'critical',
		description:
			'Branch-level configuration affects all devices at this location immediately, including any in-flight replication or SSE connections.'
	}
};

// ─── Active Service Check ─────────────────────────────────────────────────────

export interface ActiveServiceInfo {
	openCount: number;
	pendingCount: number;
	totalActive: number;
	isActive: boolean;
}

/**
 * Returns the count of in-flight orders for a given location.
 * Pass 'all' to check across all locations (useful for owner/admin).
 *
 * Uses RxDB reactive store directly — always reflects the current truth.
 */
export function getActiveServiceInfo(locationId: string): ActiveServiceInfo {
	const all = orders.value;
	const scoped =
		locationId === 'all' ? all : all.filter((o) => o.locationId === locationId);

	const openCount = scoped.filter((o) => o.status === 'open').length;
	const pendingCount = scoped.filter((o) => o.status === 'pending_payment').length;

	return {
		openCount,
		pendingCount,
		totalActive: openCount + pendingCount,
		isActive: openCount + pendingCount > 0
	};
}

// ─── Manager PIN ──────────────────────────────────────────────────────────────

export { MANAGER_PIN } from './session.svelte';

export function verifyManagerPin(input: string): boolean {
	return input === MANAGER_PIN;
}
