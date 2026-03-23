import type { RxJsonSchema } from 'rxdb';
import type { InventoryDocType } from '../types';

const inventorySchema: RxJsonSchema<InventoryDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique inventory item identifier'
		},
		name: {
			type: 'string',
			description: 'Item name'
		},
		sku: {
			type: 'string',
			description: 'Stock keeping unit'
		},
		quantity: {
			type: 'integer',
			description: 'Current stock quantity'
		},
		min_stock: {
			type: 'integer',
			description: 'Minimum stock threshold'
		},
		location_id: {
			type: 'string',
			description: 'Reference to location'
		},
		category: {
			type: 'string',
			description: 'Item category'
		},
		unit: {
			type: 'string',
			description: 'Unit of measurement'
		},
		updated_at: {
			type: 'string',
			format: 'date-time',
			description: 'Last update timestamp'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Record creation timestamp'
		}
	},
	required: ['id', 'name', 'sku', 'quantity', 'min_stock', 'unit', 'created_at'],
	indexes: ['sku', 'location_id', 'category']
};

export default inventorySchema;
