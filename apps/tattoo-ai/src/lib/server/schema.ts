import { pgTable, text, uuid, timestamp, numeric, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const inquiryStatusEnum = pgEnum('inquiry_status', [
	'pending',
	'approved',
	'rejected',
	'completed',
	'cancelled'
]);

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant']);

export const users = pgTable('users', {
	fb_id: text('fb_id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	phone_number: varchar('phone_number', { length: 20 }),
	created_at: timestamp('created_at').defaultNow().notNull()
});

export const inquiries = pgTable('inquiries', {
	id: uuid('id').primaryKey().defaultRandom(),
	fb_id: text('fb_id')
		.notNull()
		.references(() => users.fb_id, { onDelete: 'cascade' }),
	status: inquiryStatusEnum('status').default('pending').notNull(),
	concept: text('concept').notNull(),
	placement: varchar('placement', { length: 255 }).notNull(),
	size: varchar('size', { length: 100 }).notNull(),
	reference_image_url: text('reference_image_url'),
	quoted_price: numeric('quoted_price', { precision: 10, scale: 2 }),
	scheduled_at: timestamp('scheduled_at'),
	gcal_event_id: varchar('gcal_event_id', { length: 255 }),
	created_at: timestamp('created_at').defaultNow().notNull()
});

export const chatHistory = pgTable('chat_history', {
	id: uuid('id').primaryKey().defaultRandom(),
	fb_id: text('fb_id')
		.notNull()
		.references(() => users.fb_id, { onDelete: 'cascade' }),
	role: chatRoleEnum('role').notNull(),
	content: text('content').notNull(),
	timestamp: timestamp('timestamp').defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
	inquiries: many(inquiries),
	chatHistory: many(chatHistory)
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
	user: one(users, { fields: [inquiries.fb_id], references: [users.fb_id] })
}));

export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
	user: one(users, { fields: [chatHistory.fb_id], references: [users.fb_id] })
}));

export type User = typeof users.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type ChatMessage = typeof chatHistory.$inferSelect;
