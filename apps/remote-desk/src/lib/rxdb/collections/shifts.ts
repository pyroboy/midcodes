import type { RxJsonSchema } from 'rxdb';
import type { ShiftDocType } from '../types';

const shiftsSchema: RxJsonSchema<ShiftDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique shift identifier'
		},
		employee_id: {
			type: 'string',
			description: 'Reference to employee'
		},
		location_id: {
			type: 'string',
			description: 'Reference to location'
		},
		clock_in: {
			type: 'string',
			format: 'date-time',
			description: 'Clock in timestamp'
		},
		clock_out: {
			type: 'string',
			format: 'date-time',
			description: 'Clock out timestamp'
		},
		clock_in_lat: {
			type: 'number',
			description: 'Latitude of clock in location'
		},
		clock_in_lng: {
			type: 'number',
			description: 'Longitude of clock in location'
		},
		clock_out_lat: {
			type: 'number',
			description: 'Latitude of clock out location'
		},
		clock_out_lng: {
			type: 'number',
			description: 'Longitude of clock out location'
		},
		status: {
			type: 'string',
			enum: ['active', 'completed', 'missed'],
			description: 'Shift status'
		},
		notes: {
			type: 'string',
			description: 'Shift notes'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Record creation timestamp'
		}
	},
	required: ['id', 'employee_id', 'status', 'created_at'],
	indexes: ['employee_id', 'location_id', 'status', 'created_at']
};

export default shiftsSchema;
