import { createRxStore } from './rx.svelte';

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
export const expensesStore = createRxStore<any>('expenses', (db) =>
	db.expenses.find({ selector: { deleted_at: { $eq: null } } })
);
export const budgetsStore = createRxStore<any>('budgets', (db) =>
	db.budgets.find({ selector: { deleted_at: { $eq: null } } })
);
export const penaltyConfigsStore = createRxStore<any>('penalty_configs', (db) =>
	db.penalty_configs.find({ selector: { deleted_at: { $eq: null } } })
);
