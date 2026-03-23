import type { RxJsonSchema } from 'rxdb';
import type { EmployeeDocType } from '../types';

const employeesSchema: RxJsonSchema<EmployeeDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique employee identifier'
		},
		email: {
			type: 'string',
			description: 'Employee email address'
		},
		name: {
			type: 'string',
			description: 'Employee full name'
		},
		phone: {
			type: 'string',
			description: 'Employee phone number'
		},
		role: {
			type: 'string',
			enum: ['admin', 'manager', 'staff'],
			description: 'Employee role'
		},
		avatar_url: {
			type: 'string',
			description: 'URL to employee avatar image'
		},
		home_lat: {
			type: 'number',
			description: 'Home latitude coordinate'
		},
		home_lng: {
			type: 'number',
			description: 'Home longitude coordinate'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Record creation timestamp'
		}
	},
	required: ['id', 'email', 'name', 'role', 'created_at'],
	indexes: ['email', 'role', 'created_at']
};

export default employeesSchema;
