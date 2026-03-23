import {
	pgTable,
	pgEnum,
	text,
	timestamp,
	uuid,
	integer,
	boolean,
	jsonb,
	numeric,
	varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const orderStatusEnum = pgEnum('order_status', [
	'pending',
	'processing',
	'ready',
	'completed',
	'cancelled',
	'flagged'
]);

export const deliveryMethodEnum = pgEnum('delivery_method', ['pickup', 'courier', 'email']);

export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'paid', 'refunded']);

export const paymentMethodEnum = pgEnum('payment_method', ['gcash', 'cash', 'bank_transfer']);

export const documentStatusEnum = pgEnum('document_status', ['active', 'inactive', 'archived']);

export const appRoleEnum = pgEnum('app_role', [
	'super_admin',
	'admin',
	'staff',
	'finance',
	'registrar'
]);

// ─── User Profiles (linked to Better Auth user) ───────────────────────────────

export const profiles = pgTable('profiles', {
	id: text('id').primaryKey(), // matches better-auth user.id
	email: text('email').notNull(),
	full_name: text('full_name'),
	role: appRoleEnum('role').default('staff'),
	org_id: uuid('org_id').references(() => organizations.id, { onDelete: 'set null' }),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Organizations (school/department) ────────────────────────────────────────

export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	address: text('address'),
	contact_email: text('contact_email'),
	contact_phone: text('contact_phone'),
	settings: jsonb('settings').default({}),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Students ─────────────────────────────────────────────────────────────────

export const students = pgTable('students', {
	id: uuid('id').primaryKey().defaultRandom(),
	org_id: uuid('org_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	student_id: varchar('student_id', { length: 50 }).notNull(), // school-assigned ID
	full_name: text('full_name').notNull(),
	email: text('email'),
	program: text('program'),
	year_level: integer('year_level'),
	is_verified: boolean('is_verified').default(false).notNull(),
	metadata: jsonb('metadata').default({}),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Document Types ────────────────────────────────────────────────────────────

export const document_types = pgTable('document_types', {
	id: uuid('id').primaryKey().defaultRandom(),
	org_id: uuid('org_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
	processing_time_hours: integer('processing_time_hours').default(24),
	requirements: jsonb('requirements').default([]),
	max_copies: integer('max_copies').default(10),
	purpose_required: boolean('purpose_required').default(false),
	status: documentStatusEnum('status').default('active').notNull(),
	metadata: jsonb('metadata').default({}),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Orders ────────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
	id: uuid('id').primaryKey().defaultRandom(),
	org_id: uuid('org_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	student_id: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
	// Denormalized student info (in case student record is deleted)
	requester_name: text('requester_name').notNull(),
	requester_email: text('requester_email'),
	requester_student_number: text('requester_student_number'),
	requester_program: text('requester_program'),
	requester_year_level: integer('requester_year_level'),
	purpose: text('purpose'),
	delivery_method: deliveryMethodEnum('delivery_method').default('pickup').notNull(),
	delivery_address: text('delivery_address'),
	status: orderStatusEnum('status').default('pending').notNull(),
	total_amount: numeric('total_amount', { precision: 10, scale: 2 }).default('0'),
	notes: text('notes'),
	flags: jsonb('flags').default({ blocking: [], nonBlocking: [], notes: '' }),
	processing_steps: jsonb('processing_steps').default([]),
	assigned_to: text('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
	completed_at: timestamp('completed_at', { withTimezone: true }),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Order Items ───────────────────────────────────────────────────────────────

export const order_items = pgTable('order_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	order_id: uuid('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	document_type_id: uuid('document_type_id').references(() => document_types.id, {
		onDelete: 'set null'
	}),
	document_type_name: text('document_type_name').notNull(), // snapshot at order time
	copies: integer('copies').default(1).notNull(),
	unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
	subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Payments ──────────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
	id: uuid('id').primaryKey().defaultRandom(),
	order_id: uuid('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
	method: paymentMethodEnum('method').notNull(),
	status: paymentStatusEnum('status').default('unpaid').notNull(),
	reference_number: text('reference_number'),
	gcash_number: text('gcash_number'),
	proof_url: text('proof_url'),
	verified_by: text('verified_by').references(() => profiles.id, { onDelete: 'set null' }),
	verified_at: timestamp('verified_at', { withTimezone: true }),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Relations ─────────────────────────────────────────────────────────────────

export const ordersRelations = relations(orders, ({ one, many }) => ({
	organization: one(organizations, { fields: [orders.org_id], references: [organizations.id] }),
	student: one(students, { fields: [orders.student_id], references: [students.id] }),
	assignee: one(profiles, { fields: [orders.assigned_to], references: [profiles.id] }),
	items: many(order_items),
	payments: many(payments)
}));

export const orderItemsRelations = relations(order_items, ({ one }) => ({
	order: one(orders, { fields: [order_items.order_id], references: [orders.id] }),
	documentType: one(document_types, {
		fields: [order_items.document_type_id],
		references: [document_types.id]
	})
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
	organization: one(organizations, { fields: [students.org_id], references: [organizations.id] }),
	orders: many(orders)
}));

export const documentTypesRelations = relations(document_types, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [document_types.org_id],
		references: [organizations.id]
	}),
	orderItems: many(order_items)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
	order: one(orders, { fields: [payments.order_id], references: [orders.id] }),
	verifier: one(profiles, { fields: [payments.verified_by], references: [profiles.id] })
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
	organization: one(organizations, { fields: [profiles.org_id], references: [organizations.id] }),
	assignedOrders: many(orders)
}));
