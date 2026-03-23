import type { RxJsonSchema } from 'rxdb';
import type { ExpenseDocType } from '../types';

const expensesSchema: RxJsonSchema<ExpenseDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique expense identifier'
		},
		employee_id: {
			type: 'string',
			description: 'Reference to employee who submitted expense'
		},
		amount: {
			type: 'number',
			description: 'Expense amount'
		},
		category: {
			type: 'string',
			description: 'Expense category'
		},
		description: {
			type: 'string',
			description: 'Expense description'
		},
		receipt_url: {
			type: 'string',
			description: 'URL to receipt image'
		},
		status: {
			type: 'string',
			enum: ['pending', 'approved', 'rejected'],
			description: 'Approval status'
		},
		approved_by: {
			type: 'string',
			description: 'Reference to approving employee'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Record creation timestamp'
		}
	},
	required: ['id', 'employee_id', 'amount', 'category', 'status', 'created_at'],
	indexes: ['employee_id', 'status', 'category', 'created_at']
};

export default expensesSchema;
