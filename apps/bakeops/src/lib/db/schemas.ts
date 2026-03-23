import type { RxJsonSchema } from 'rxdb';

export const ingredientSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 36 },
		name: { type: 'string' },
		category: { type: 'string' },
		defaultUnit: { type: 'string' },
		packageSize: { type: 'number' },
		currentAvgCost: { type: 'number' },
		reorderThreshold: { type: 'number' },
		currentStock: { type: 'number' },
		supplier: { type: ['string', 'null'] },
		createdAt: { type: 'string' }
	},
	required: ['id', 'name', 'category', 'defaultUnit', 'packageSize', 'currentAvgCost', 'currentStock']
};

export const recipeSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 36 },
		businessId: { type: ['string', 'null'] },
		name: { type: 'string' },
		description: { type: ['string', 'null'] },
		category: { type: 'string' },
		yieldAmount: { type: 'number' },
		yieldUnit: { type: 'string' },
		prepTime: { type: ['string', 'null'] },
		bakeTime: { type: ['string', 'null'] },
		totalCostCentavos: { type: 'number' },
		perUnitCostCentavos: { type: 'number' },
		isActive: { type: 'boolean' },
		createdAt: { type: 'string' }
	},
	required: ['id', 'name', 'category', 'yieldAmount', 'yieldUnit']
};

export const batchSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 36 },
		recipeId: { type: 'string' },
		businessId: { type: 'string' },
		multiplier: { type: 'string' },
		plannedYield: { type: 'number' },
		actualYield: { type: ['number', 'null'] },
		status: { type: 'string' },
		totalCostCentavos: { type: 'number' },
		scheduledFor: { type: ['string', 'null'] },
		startedAt: { type: ['string', 'null'] },
		completedAt: { type: ['string', 'null'] },
		createdAt: { type: 'string' }
	},
	required: ['id', 'recipeId', 'businessId', 'status', 'plannedYield']
};
