import type { RxJsonSchema } from 'rxdb';
import type { MessageDocType } from '../types';

const messagesSchema: RxJsonSchema<MessageDocType> = {
	version: 0,
	type: 'object',
	primaryKey: 'id',
	properties: {
		id: {
			type: 'string',
			description: 'Unique message identifier'
		},
		sender_id: {
			type: 'string',
			description: 'Reference to sender employee'
		},
		channel: {
			type: 'string',
			description: 'Channel name (team, general, etc.)'
		},
		content: {
			type: 'string',
			description: 'Message content'
		},
		created_at: {
			type: 'string',
			format: 'date-time',
			description: 'Message creation timestamp'
		}
	},
	required: ['id', 'sender_id', 'channel', 'content', 'created_at'],
	indexes: ['sender_id', 'channel', 'created_at']
};

export default messagesSchema;
