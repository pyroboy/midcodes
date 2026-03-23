import type { RxJsonSchema } from 'rxdb';
import type { ScheduleDocType } from '../types';

const schedulesSchema: RxJsonSchema<ScheduleDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique schedule identifier'
		},
		employee_id: {
			type: 'string',
			description: 'Reference to employee'
		},
		location_id: {
			type: 'string',
			description: 'Reference to location'
		},
		date: {
			type: 'string',
			format: 'date-time',
			description: 'Scheduled date'
		},
		start_time: {
			type: 'string',
			description: 'Start time in HH:MM format'
		},
		end_time: {
			type: 'string',
			description: 'End time in HH:MM format'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Record creation timestamp'
		}
	},
	required: ['id', 'employee_id', 'date', 'start_time', 'end_time', 'created_at'],
	indexes: ['employee_id', 'date', 'location_id']
};

export default schedulesSchema;
