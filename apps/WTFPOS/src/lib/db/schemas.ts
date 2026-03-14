import type { RxJsonSchema } from 'rxdb';

// ─── Tables ──────────────────────────────────────────────────────────────────
export const tableSchema: RxJsonSchema<any> = {
	title: 'table schema',
	version: 3,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		number: { type: 'number' },
		label: { type: 'string' },
		zone: { type: 'string' },
		capacity: { type: 'number' },
		x: { type: 'number' },
		y: { type: 'number' },
		width: { type: 'number' },
		height: { type: 'number' },
		shape: { type: 'string' },
		color: { type: ['string', 'null'] },
		opacity: { type: ['number', 'null'] },
		borderRadius: { type: ['number', 'null'] },
		borderWidth: { type: ['number', 'null'] },
		rotation: { type: ['number', 'null'] },
		chairConfig: {
			type: ['object', 'null'],
			properties: {
				top:    { type: 'object' },
				bottom: { type: 'object' },
				left:   { type: 'object' },
				right:  { type: 'object' }
			}
		},
		status: { type: 'string', maxLength: 50 },
		sessionStartedAt: { type: ['string', 'null'] },
		elapsedSeconds: { type: ['number', 'null'] },
		currentOrderId: { type: ['string', 'null'] },
		billTotal: { type: ['number', 'null'] },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'number', 'label', 'zone', 'capacity', 'x', 'y', 'status', 'updatedAt'],
	indexes: ['locationId', 'status', ['locationId', 'status'], 'updatedAt']
};

// ─── Floor Elements (includes canvas_config docs) ───────────────────────────
export const floorElementSchema: RxJsonSchema<any> = {
	title: 'floor element schema',
	version: 2,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		type: { type: 'string', maxLength: 50 },
		shape: { type: 'string', maxLength: 20 },
		x: { type: 'number' },
		y: { type: 'number' },
		width: { type: 'number' },
		height: { type: 'number' },
		rotation: { type: ['number', 'null'] },
		color: { type: ['string', 'null'] },
		opacity: { type: ['number', 'null'] },
		label: { type: ['string', 'null'] },
		gridSize: { type: ['number', 'null'] },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'type', 'shape', 'x', 'y', 'width', 'height', 'updatedAt'],
	indexes: ['locationId', 'type', 'updatedAt']
};

// ─── Order ───────────────────────────────────────────────────────────────────
export const orderSchema: RxJsonSchema<any> = {
	title: 'order schema',
	version: 14,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		orderType: { type: 'string', maxLength: 50 },
		customerName: { type: 'string' }, // Takeout
		tableId: { type: ['string', 'null'], maxLength: 100 },
		tableNumber: { type: ['number', 'null'] },
		packageName: { type: ['string', 'null'] },
		packageId: { type: ['string', 'null'] },
		pax: { type: 'number' },
		childPax: { type: 'number' },
		freePax: { type: 'number' },
		scCount: { type: 'number' },
		pwdCount: { type: 'number' },
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
					childUnitPrice: { type: ['number', 'null'] },
					weight: { type: ['number', 'null'] },
					status: { type: 'string' },
					sentAt: { type: ['string', 'null'] },
					tag: { type: ['string', 'null'] },
					notes: { type: 'string' },
					addedAt: { type: 'string' },
					cancelReason: { type: 'string' },
					cancelledAt: { type: 'string' },
					acknowledgedBy: { type: 'string' },
					acknowledgedAt: { type: 'string' }
				},
				required: ['id', 'menuItemId', 'menuItemName', 'quantity', 'unitPrice', 'status']
			}
		},
		status: { type: 'string', maxLength: 50 },
		discountType: { type: ['string', 'null'] },
		discountEntries: {
			type: ['object', 'null'],
			additionalProperties: {
				type: 'object',
				properties: {
					// v12+ canonical fields
					pax:      { type: 'number' },
					names:    { type: 'array', items: { type: 'string' } },
					ids:      { type: 'array', items: { type: 'string' } },
					tins:     { type: 'array', items: { type: 'string' } },
					idPhotos: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
					// legacy fields (v10/v11 — kept optional for backwards compat)
					discountPax:      { type: 'number' },
					discountIds:      { type: 'array', items: { type: 'string' } },
					discountIdPhotos: { type: 'array', items: { type: 'string' } },
					authorizedAt:     { type: 'string' },
					authorizedBy:     { type: 'string' }
				}
			}
		},
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
				},
				required: ['method', 'amount']
			}
		},
		createdAt: { type: 'string', maxLength: 30 },
		closedAt: { type: ['string', 'null'] },
		billPrinted: { type: 'boolean' },
		notes: { type: ['string', 'null'] },
		cancelReason: { type: ['string', 'null'] },
		closedBy: { type: ['string', 'null'] },
		originalPax: { type: 'number' },
		leftoverPenaltyAmount: { type: 'number' },
		pendingPaymentMethod: { type: ['string', 'null'] },
		takeoutStatus: { type: ['string', 'null'] },
		splitType: { type: ['string', 'null'] },
		subBills: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					label: { type: 'string' },
					itemIds: { type: 'array', items: { type: 'string' } },
					subtotal: { type: 'number' },
					discountAmount: { type: 'number' },
					vatAmount: { type: 'number' },
					total: { type: 'number' },
					payment: {
						type: ['object', 'null'],
						properties: {
							method: { type: 'string' },
							amount: { type: 'number' }
						}
					},
					paidAt: { type: ['string', 'null'] }
				},
				required: ['id', 'label', 'itemIds', 'subtotal', 'discountAmount', 'vatAmount', 'total']
			}
		},
		printStatus: { type: ['string', 'null'] },
		discountIdPhotos: { type: 'array', items: { type: 'string' }, default: [] },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'orderType', 'pax', 'items', 'status', 'subtotal', 'discountAmount', 'vatAmount', 'total', 'payments', 'createdAt', 'billPrinted', 'updatedAt'],
	indexes: ['locationId', 'status', 'createdAt', ['locationId', 'status'], ['locationId', 'createdAt'], 'updatedAt']
};

// ─── Menu Item ───────────────────────────────────────────────────────────────
export const menuItemSchema: RxJsonSchema<any> = {
	title: 'menu item schema',
	version: 3,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		name: { type: 'string' },
		category: { type: 'string' },
		protein: { type: 'string' },
		price: { type: 'number' },
		childPrice: { type: 'number' },
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
		scaledAutoSides: { type: 'array', items: { type: 'string' } },
		image: { type: 'string' },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'name', 'category', 'price', 'isWeightBased', 'available', 'updatedAt'],
	indexes: ['updatedAt']
};

// ─── Stock Item ──────────────────────────────────────────────────────────────
export const stockItemSchema: RxJsonSchema<any> = {
	title: 'stock item schema',
	version: 3,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		menuItemId: { type: 'string', maxLength: 100 },
		name: { type: 'string' },
		category: { type: 'string', maxLength: 50 },
		proteinType: { type: 'string' },
		locationId: { type: 'string', maxLength: 100 },
		openingStock: { type: 'number' },
		unit: { type: 'string' },
		minLevel: { type: 'number' },
		image: { type: 'string' },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'menuItemId', 'name', 'category', 'locationId', 'openingStock', 'unit', 'minLevel', 'updatedAt'],
	indexes: ['locationId', 'category', 'menuItemId', ['locationId', 'category'], 'updatedAt']
};

// ─── Delivery ────────────────────────────────────────────────────────────────
export const deliverySchema: RxJsonSchema<any> = {
	title: 'delivery schema',
	version: 5,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string', maxLength: 100 },
		itemName: { type: 'string' },
		qty: { type: 'number' },
		unit: { type: 'string' },
		supplier: { type: 'string' },
		notes: { type: 'string' },
		receivedAt: { type: 'string', maxLength: 30 },
		batchNo: { type: 'string' },
		expiryDate: { type: 'string' },
		usedQty: { type: 'number' },
		depleted: { type: 'boolean' },
		photo: { type: 'string' },
		unitCost: { type: ['number', 'null'] },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'stockItemId', 'itemName', 'qty', 'unit', 'supplier', 'receivedAt', 'depleted', 'updatedAt'],
	indexes: ['locationId', 'stockItemId', 'depleted', 'receivedAt', ['locationId', 'stockItemId'], ['stockItemId', 'depleted'], 'updatedAt']
};

// ─── Stock Event (merged: waste + manual adjustments) ────────────────────────
// type: 'waste'  — user-logged waste (always a stock reduction)
// type: 'add'    — manual stock addition (correction, found stock)
// type: 'deduct' — manual stock deduction (transfer out, correction)
export const stockEventSchema: RxJsonSchema<any> = {
	title: 'stock event schema',
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string', maxLength: 100 },
		itemName: { type: 'string' },
		type: { type: 'string', maxLength: 10 },
		qty: { type: 'number' },
		unit: { type: 'string' },
		reason: { type: 'string' },
		loggedBy: { type: 'string' },
		loggedAt: { type: 'string', maxLength: 30 },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'stockItemId', 'itemName', 'type', 'qty', 'unit', 'reason', 'loggedBy', 'loggedAt', 'updatedAt'],
	indexes: ['locationId', 'stockItemId', 'type', 'loggedAt', ['locationId', 'type'], ['stockItemId', 'type'], 'updatedAt']
};

// ─── Deduction ───────────────────────────────────────────────────────────────
export const deductionSchema: RxJsonSchema<any> = {
	title: 'deduction schema',
	version: 3,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		stockItemId: { type: 'string', maxLength: 100 },
		qty: { type: 'number' },
		tableId: { type: 'string' },
		orderId: { type: 'string', maxLength: 100 },
		timestamp: { type: 'string' },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'stockItemId', 'qty', 'tableId', 'orderId', 'timestamp', 'updatedAt'],
	indexes: ['locationId', 'stockItemId', 'orderId', ['locationId', 'stockItemId'], ['stockItemId', 'orderId'], 'updatedAt']
};

// (adjustmentSchema removed — merged into stockEventSchema above)

// ─── Stock Count ─────────────────────────────────────────────────────────────
export const stockCountSchema: RxJsonSchema<any> = {
	title: 'stock count schema',
	version: 3,
	primaryKey: 'stockItemId',
	type: 'object',
	properties: {
		stockItemId: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		date: { type: ['string', 'null'], maxLength: 10 },
		counted: {
			type: 'object',
			properties: {
				am10: { type: ['number', 'null'] },
				pm4: { type: ['number', 'null'] },
				pm10: { type: ['number', 'null'] }
			}
		},
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['stockItemId', 'locationId', 'counted', 'updatedAt'],
	indexes: ['locationId', 'updatedAt']
};

// ─── Device ─────────────────────────────────────────────────────────────────
export const deviceSchema: RxJsonSchema<any> = {
	title: 'device schema',
	version: 5,
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
		userAgent: { type: 'string' },
		dbLastUpdated: { type: 'string' },
		dbDocCount: { type: 'number' },
		isServer: { type: 'boolean' },
		ipAddress: { type: 'string', maxLength: 45 },
		dataMode: { type: 'string' },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'name', 'lastSeenAt', 'isOnline', 'syncStatus', 'appVersion', 'buildDate', 'ipAddress', 'updatedAt'],
	indexes: ['updatedAt', 'ipAddress']
};

// ─── Expense ─────────────────────────────────────────────────────────────────
export const expenseSchema: RxJsonSchema<any> = {
	title: 'expense schema',
	version: 6,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		category: { type: 'string', maxLength: 100 },
		amount: { type: 'number' },
		description: { type: 'string' },
		paidBy: { type: 'string' },
		locationId: { type: 'string', maxLength: 100 },
		createdBy: { type: 'string' },
		createdAt: { type: 'string', maxLength: 30 },
		expenseDate: { type: ['string', 'null'], maxLength: 20 },
		receiptPhoto: { type: 'string' },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'category', 'amount', 'description', 'paidBy', 'locationId', 'createdBy', 'createdAt', 'updatedAt'],
	indexes: ['locationId', 'createdAt', ['locationId', 'createdAt'], 'updatedAt']
};

// ─── KDS Tickets (active + history, distinguished by bumpedAt) ───────────────
export const kdsTicketSchema: RxJsonSchema<any> = {
	title: 'kds ticket schema',
	version: 6,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		orderId: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		tableNumber: { type: ['number', 'null'] },
		customerName: { type: ['string', 'null'] },
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					menuItemName: { type: 'string' },
					quantity: { type: 'number' },
					status: { type: 'string' },
					weight: { type: ['number', 'null'] },
					category: { type: 'string' },
					notes: { type: 'string' }
				},
				required: ['id', 'menuItemName', 'quantity', 'status']
			}
		},
		createdAt: { type: 'string' },
		bumpedAt: { type: ['string', 'null'] },
		bumpedBy: { type: ['string', 'null'] },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'orderId', 'locationId', 'items', 'createdAt', 'updatedAt'],
	indexes: ['orderId', 'locationId', 'updatedAt']
};

// ─── Reading (merged: X-Read mid-shift + Z-Read EOD) ─────────────────────────
// type: 'x-read' — mid-shift BIR audit snapshot (generated any time during the day)
// type: 'z-read' — end-of-day permanent close (one per business date per location)
export const readingSchema: RxJsonSchema<any> = {
	title: 'reading schema',
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		type: { type: 'string', maxLength: 10 },
		locationId: { type: 'string', maxLength: 100 },
		grossSales: { type: 'number' },
		discounts: { type: 'number' },
		netSales: { type: 'number' },
		vatAmount: { type: 'number' },
		totalPax: { type: 'number' },
		cash: { type: 'number' },
		gcash: { type: 'number' },
		maya: { type: 'number' },
		card: { type: 'number' },
		// x-read fields
		timestamp: { type: ['string', 'null'] },
		voidCount: { type: ['number', 'null'] },
		voidAmount: { type: ['number', 'null'] },
		discountCount: { type: ['number', 'null'] },
		generatedBy: { type: ['string', 'null'] },
		// z-read fields
		date: { type: ['string', 'null'], maxLength: 30 },
		submittedAt: { type: ['string', 'null'] },
		submittedBy: { type: ['string', 'null'] },
		cashExpenses: { type: ['number', 'null'] },
		openingCash: { type: ['number', 'null'] },
		closingActual: { type: ['number', 'null'] },
		cashVariance: { type: ['number', 'null'] },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'type', 'locationId', 'grossSales', 'discounts', 'netSales', 'updatedAt'],
	indexes: ['type', 'locationId', ['type', 'locationId'], 'updatedAt']
};

// ─── Audit Log ───────────────────────────────────────────────────────────────
export const auditLogSchema: RxJsonSchema<any> = {
	title: 'audit log schema',
	version: 1,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		isoTimestamp: { type: 'string', maxLength: 30 },
		timestamp: { type: 'string' },
		user: { type: 'string' },
		role: { type: 'string' },
		action: { type: 'string', maxLength: 50 },
		description: { type: 'string' },
		branch: { type: 'string' },
		meta: { type: 'string' },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'isoTimestamp', 'timestamp', 'user', 'role', 'action', 'description', 'branch', 'updatedAt'],
	indexes: ['locationId', 'isoTimestamp', 'action', ['locationId', 'isoTimestamp'], 'updatedAt']
};

// ─── Shift (Cash Float / Opening Drawer) ─────────────────────────────────────
export const shiftsSchema: RxJsonSchema<any> = {
	title: 'shifts schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id:           { type: 'string', maxLength: 100 },
		locationId:   { type: 'string', maxLength: 100 },
		cashierName:  { type: 'string' },
		openingFloat: { type: 'number' },
		startedAt:    { type: 'string', maxLength: 30 },
		endedAt:      { type: ['string', 'null'] },
		closingCash:  { type: ['number', 'null'] },
		status:       { type: 'string', maxLength: 10 },
		updatedAt:    { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'cashierName', 'openingFloat', 'startedAt', 'status', 'updatedAt'],
	indexes: ['locationId', 'status', ['locationId', 'status'], 'updatedAt']
};

// ─── Expense Template ───────────────────────────────────────────────────────
export const expenseTemplateSchema: RxJsonSchema<any> = {
	title: 'expense template schema',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 100 },
		locationId: { type: 'string', maxLength: 100 },
		category: { type: 'string', maxLength: 100 },
		description: { type: 'string' },
		defaultAmount: { type: 'number' },
		paidBy: { type: 'string' },
		recurrence: { type: 'string', maxLength: 10 },
		isActive: { type: 'boolean' },
		createdBy: { type: 'string' },
		createdAt: { type: 'string', maxLength: 30 },
		updatedAt: { type: 'string', maxLength: 30 }
	},
	required: ['id', 'locationId', 'category', 'description', 'defaultAmount', 'paidBy', 'recurrence', 'isActive', 'createdBy', 'createdAt', 'updatedAt'],
	indexes: ['locationId', 'recurrence', ['locationId', 'recurrence'], 'updatedAt']
};

