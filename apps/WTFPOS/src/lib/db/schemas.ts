import type { RxJsonSchema } from 'rxdb';

// ─── Tables ──────────────────────────────────────────────────────────────────
export const tableSchema: RxJsonSchema<any> = {
	title: 'table schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string' },
		number: { type: 'number' },
		label: { type: 'string' },
		zone: { type: 'string' },
		capacity: { type: 'number' },
		x: { type: 'number' },
		y: { type: 'number' },
		width: { type: 'number' },
		height: { type: 'number' },
		shape: { type: 'string' },
		status: { type: 'string' },
		sessionStartedAt: { type: ['string', 'null'] },
		elapsedSeconds: { type: ['number', 'null'] },
		currentOrderId: { type: ['string', 'null'] },
		billTotal: { type: ['number', 'null'] }
	},
	required: ['id', 'locationId', 'number', 'label', 'zone', 'capacity', 'x', 'y', 'status']
};

// ─── Order ───────────────────────────────────────────────────────────────────
export const orderSchema: RxJsonSchema<any> = {
	title: 'order schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string' },
		orderType: { type: 'string' },
		customerName: { type: 'string' }, // Takeout
		tableId: { type: ['string', 'null'] },
		tableNumber: { type: ['number', 'null'] },
		packageName: { type: ['string', 'null'] },
		packageId: { type: ['string', 'null'] },
		pax: { type: 'number' },
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					menuItemId: { type: 'string' },
					menuItemName: { type: 'string' },
					quantity: { type: 'number' },
					unitPrice: { type: 'number' },
					weight: { type: ['number', 'null'] },
					status: { type: 'string' },
					sentAt: { type: ['string', 'null'] },
					tag: { type: ['string', 'null'] },
					notes: { type: 'string' }
				}
			}
		},
		status: { type: 'string' },
		discountType: { type: 'string' },
		discountPax: { type: 'number' },
		discountIds: { type: 'array', items: { type: 'string' } },
		subtotal: { type: 'number' },
		discountAmount: { type: 'number' },
		vatAmount: { type: 'number' },
		total: { type: 'number' },
		payments: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					method: { type: 'string' },
					amount: { type: 'number' }
				}
			}
		},
		createdAt: { type: 'string' },
		closedAt: { type: ['string', 'null'] },
		billPrinted: { type: 'boolean' },
		notes: { type: 'string' },
		cancelReason: { type: 'string' },
		closedBy: { type: 'string' },
		originalPax: { type: 'number' },
		leftoverPenaltyAmount: { type: 'number' },
		pendingPaymentMethod: { type: 'string' },
		takeoutStatus: { type: 'string' },
		splitType: { type: 'string' },
		subBills: { type: 'array' }, // Simplification for now
		printStatus: { type: 'string' }
	},
	required: ['id', 'locationId', 'orderType', 'pax', 'items', 'status', 'subtotal', 'discountAmount', 'vatAmount', 'total', 'payments', 'createdAt', 'billPrinted']
};

// ─── Menu Item ───────────────────────────────────────────────────────────────
export const menuItemSchema: RxJsonSchema<any> = {
	title: 'menu item schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		name: { type: 'string' },
		category: { type: 'string' },
		protein: { type: 'string' },
		price: { type: 'number' },
		isWeightBased: { type: 'boolean' },
		pricePerGram: { type: 'number' },
		available: { type: 'boolean' },
		desc: { type: 'string' },
		perks: { type: 'string' },
		isFree: { type: 'boolean' },
		trackInventory: { type: 'boolean' },
		isRetail: { type: 'boolean' },
		meats: { type: 'array', items: { type: 'string' } },
		autoSides: { type: 'array', items: { type: 'string' } },
		image: { type: 'string' }
	},
	required: ['id', 'name', 'category', 'price', 'isWeightBased', 'available']
};

// ─── Stock Item ──────────────────────────────────────────────────────────────
export const stockItemSchema: RxJsonSchema<any> = {
	title: 'stock item schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		menuItemId: { type: 'string' },
		name: { type: 'string' },
		category: { type: 'string' },
		proteinType: { type: 'string' },
		locationId: { type: 'string' },
		openingStock: { type: 'number' },
		unit: { type: 'string' },
		minLevel: { type: 'number' }
	},
	required: ['id', 'menuItemId', 'name', 'category', 'locationId', 'openingStock', 'unit', 'minLevel']
};

// ─── Delivery ────────────────────────────────────────────────────────────────
export const deliverySchema: RxJsonSchema<any> = {
	title: 'delivery schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string' },
		itemName: { type: 'string' },
		qty: { type: 'number' },
		unit: { type: 'string' },
		supplier: { type: 'string' },
		notes: { type: 'string' },
		receivedAt: { type: 'string' },
		batchNo: { type: 'string' },
		expiryDate: { type: 'string' },
		usedQty: { type: 'number' },
		depleted: { type: 'boolean' },
		photo: { type: 'string' }
	},
	required: ['id', 'stockItemId', 'itemName', 'qty', 'unit', 'supplier', 'receivedAt']
};

// ─── Waste ───────────────────────────────────────────────────────────────────
export const wasteSchema: RxJsonSchema<any> = {
	title: 'waste schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string' },
		itemName: { type: 'string' },
		qty: { type: 'number' },
		unit: { type: 'string' },
		reason: { type: 'string' },
		loggedBy: { type: 'string' },
		loggedAt: { type: 'string' }
	},
	required: ['id', 'stockItemId', 'itemName', 'qty', 'unit', 'reason', 'loggedBy', 'loggedAt']
};

// ─── Deduction ───────────────────────────────────────────────────────────────
export const deductionSchema: RxJsonSchema<any> = {
	title: 'deduction schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string' },
		qty: { type: 'number' },
		tableId: { type: 'string' },
		orderId: { type: 'string' },
		timestamp: { type: 'string' }
	},
	required: ['id', 'stockItemId', 'qty', 'tableId', 'orderId', 'timestamp']
};

// ─── Adjustment ──────────────────────────────────────────────────────────────
export const adjustmentSchema: RxJsonSchema<any> = {
	title: 'adjustment schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string' },
		itemName: { type: 'string' },
		type: { type: 'string' }, // 'add' | 'deduct'
		qty: { type: 'number' },
		unit: { type: 'string' },
		reason: { type: 'string' },
		loggedBy: { type: 'string' },
		loggedAt: { type: 'string' }
	},
	required: ['id', 'stockItemId', 'itemName', 'type', 'qty', 'unit', 'reason', 'loggedBy', 'loggedAt']
};

// ─── Stock Count ─────────────────────────────────────────────────────────────
export const stockCountSchema: RxJsonSchema<any> = {
	title: 'stock count schema',
	version: 0,
	primaryKey: 'stockItemId',
	type: 'object',
	properties: {
		stockItemId: { type: 'string', maxLength: 100 },
		counted: {
			type: 'object',
			properties: {
				am10: { type: ['number', 'null'] },
				pm4: { type: ['number', 'null'] },
				pm10: { type: ['number', 'null'] }
			}
		}
	},
	required: ['stockItemId', 'counted']
};

// ─── Device ─────────────────────────────────────────────────────────────────
export const deviceSchema: RxJsonSchema<any> = {
	title: 'device schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		name: { type: 'string' },
		locationId: { type: 'string' },
		role: { type: 'string' },
		userName: { type: 'string' },
		appVersion: { type: 'string' },
		buildDate: { type: 'string' },
		lastSeenAt: { type: 'string' },
		isOnline: { type: 'boolean' },
		syncStatus: { type: 'string' },
		deviceType: { type: 'string' },
		screenWidth: { type: 'number' },
		userAgent: { type: 'string' }
	},
	required: ['id', 'name', 'lastSeenAt', 'isOnline', 'syncStatus', 'appVersion', 'buildDate']
};

// ─── Expense ─────────────────────────────────────────────────────────────────
export const expenseSchema: RxJsonSchema<any> = {
	title: 'expense schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		category: { type: 'string' },
		amount: { type: 'number' },
		description: { type: 'string' },
		paidBy: { type: 'string' },
		locationId: { type: 'string' },
		createdBy: { type: 'string' },
		createdAt: { type: 'string' },
		receiptPhoto: { type: 'string' }
	},
	required: ['id', 'category', 'amount', 'description', 'paidBy', 'locationId', 'createdBy', 'createdAt']
};
