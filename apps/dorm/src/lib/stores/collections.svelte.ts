import { createRxStore } from './rx.svelte';
import { ensureCollectionSynced } from '$lib/db/replication';

export const tenantsStore = createRxStore<any>('tenants', (db) =>
	db.tenants.find({ selector: { deleted_at: { $eq: null } } })
);
export const leasesStore = createRxStore<any>('leases', (db) =>
	db.leases.find({ selector: { deleted_at: { $eq: null } } })
);
export const leaseTenantsStore = createRxStore<any>('lease_tenants', (db) =>
	db.lease_tenants.find({ selector: { deleted_at: { $eq: null } } })
);
export const rentalUnitsStore = createRxStore<any>('rental_units', (db) =>
	db.rental_units.find({ selector: { deleted_at: { $eq: null } } })
);
export const propertiesStore = createRxStore<any>('properties', (db) =>
	db.properties.find({ selector: { deleted_at: { $eq: null } }, sort: [{ name: 'asc' }] })
);
export const floorsStore = createRxStore<any>('floors', (db) =>
	db.floors.find({ selector: { deleted_at: { $eq: null } } })
);
export const metersStore = createRxStore<any>('meters', (db) =>
	db.meters.find({ selector: { deleted_at: { $eq: null } } })
);
export const readingsStore = createRxStore<any>('readings', (db) =>
	db.readings.find({ selector: { deleted_at: { $eq: null } } })
);
export const billingsStore = createRxStore<any>('billings', (db) =>
	db.billings.find({ selector: { deleted_at: { $eq: null } } })
);
export const paymentsStore = createRxStore<any>('payments', (db) =>
	db.payments.find({ selector: { deleted_at: { $eq: null } } })
);
export const paymentAllocationsStore = createRxStore<any>('payment_allocations', (db) =>
	db.payment_allocations.find({ selector: { deleted_at: { $eq: null } } })
);
// W7: Lazy collections — sync triggered on first store access (not on startup)
export const expensesStore = createRxStore<any>('expenses', (db) => {
	ensureCollectionSynced('expenses');
	return db.expenses.find({ selector: { deleted_at: { $eq: null } } });
});
export const budgetsStore = createRxStore<any>('budgets', (db) => {
	ensureCollectionSynced('budgets');
	return db.budgets.find({ selector: { deleted_at: { $eq: null } } });
});
export const penaltyConfigsStore = createRxStore<any>('penalty_configs', (db) => {
	ensureCollectionSynced('penalty_configs');
	return db.penalty_configs.find({ selector: { deleted_at: { $eq: null } } });
});
export const floorLayoutItemsStore = createRxStore<any>('floor_layout_items', (db) => {
	ensureCollectionSynced('floor_layout_items');
	return db.floor_layout_items.find({ selector: { deleted_at: { $eq: null } } });
});
