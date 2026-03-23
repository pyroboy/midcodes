import type { RxJsonSchema } from 'rxdb';

export const scanSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 64 },
		personId: { type: 'string' },
		fullName: { type: 'string' },
		idNumber: { type: 'string' },
		anomalyData: { type: ['string', 'null'] },
		scannedAt: { type: 'string' }
	},
	required: ['id', 'personId', 'fullName', 'idNumber', 'scannedAt'],
	indexes: ['scannedAt']
};

export const personSchema: RxJsonSchema<any> = {
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 64 },
		idNumber: { type: 'string' },
		fullName: { type: 'string' },
		type: { type: 'string' },
		photoUrl: { type: ['string', 'null'] }
	},
	required: ['id', 'idNumber', 'fullName', 'type'],
	indexes: ['idNumber']
};
