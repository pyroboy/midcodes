import type { RxJsonSchema } from 'rxdb';
import type { TaskDocType } from '../types';

const tasksSchema: RxJsonSchema<TaskDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique task identifier'
		},
		title: {
			type: 'string',
			description: 'Task title'
		},
		description: {
			type: 'string',
			description: 'Detailed task description'
		},
		assigned_to: {
			type: 'string',
			description: 'Reference to assigned employee'
		},
		location_id: {
			type: 'string',
			description: 'Reference to location'
		},
		status: {
			type: 'string',
			enum: ['pending', 'in_progress', 'completed', 'cancelled'],
			description: 'Task status'
		},
		priority: {
			type: 'string',
			enum: ['low', 'medium', 'high', 'urgent'],
			description: 'Task priority level'
		},
		photo_url: {
			type: 'string',
			description: 'URL to task photo evidence'
		},
		completed_at: {
			type: 'string',
			format: 'date-time',
			description: 'Task completion timestamp'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Record creation timestamp'
		}
	},
	required: ['id', 'title', 'status', 'priority', 'created_at'],
	indexes: ['assigned_to', 'location_id', 'status', 'priority', 'created_at']
};

export default tasksSchema;
