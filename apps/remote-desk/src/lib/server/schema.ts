import {
	pgTable,
	text,
	timestamp,
	integer,
	real,
	varchar,
	primaryKey,
	foreignKey,
	index
} from 'drizzle-orm/pg-core';

// Locations
export const locations = pgTable(
	'locations',
	{
		id: text('id').primaryKey(),
		name: varchar('name', { length: 255 }).notNull(),
		address: text('address'),
		lat: real('lat'),
		lng: real('lng'),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('idx_locations_name').on(table.name)]
);

// Employees
export const employees = pgTable(
	'employees',
	{
		id: text('id').primaryKey(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		name: varchar('name', { length: 255 }).notNull(),
		phone: varchar('phone', { length: 20 }),
		role: varchar('role', { length: 50, enum: ['admin', 'manager', 'staff'] })
			.notNull()
			.default('staff'),
		avatar_url: text('avatar_url'),
		home_lat: real('home_lat'),
		home_lng: real('home_lng'),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_employees_email').on(table.email),
		index('idx_employees_role').on(table.role)
	]
);

// Shifts
export const shifts = pgTable(
	'shifts',
	{
		id: text('id').primaryKey(),
		employee_id: text('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		location_id: text('location_id').references(() => locations.id),
		clock_in: timestamp('clock_in'),
		clock_out: timestamp('clock_out'),
		clock_in_lat: real('clock_in_lat'),
		clock_in_lng: real('clock_in_lng'),
		clock_out_lat: real('clock_out_lat'),
		clock_out_lng: real('clock_out_lng'),
		status: varchar('status', { length: 50, enum: ['active', 'completed', 'missed'] })
			.notNull()
			.default('active'),
		notes: text('notes'),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_shifts_employee').on(table.employee_id),
		index('idx_shifts_location').on(table.location_id),
		index('idx_shifts_status').on(table.status),
		index('idx_shifts_created').on(table.created_at)
	]
);

// Tasks
export const tasks = pgTable(
	'tasks',
	{
		id: text('id').primaryKey(),
		title: varchar('title', { length: 255 }).notNull(),
		description: text('description'),
		assigned_to: text('assigned_to').references(() => employees.id, {
			onDelete: 'set null'
		}),
		location_id: text('location_id').references(() => locations.id),
		status: varchar('status', {
			length: 50,
			enum: ['pending', 'in_progress', 'completed', 'cancelled']
		})
			.notNull()
			.default('pending'),
		priority: varchar('priority', {
			length: 50,
			enum: ['low', 'medium', 'high', 'urgent']
		})
			.notNull()
			.default('medium'),
		photo_url: text('photo_url'),
		completed_at: timestamp('completed_at'),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_tasks_assigned').on(table.assigned_to),
		index('idx_tasks_location').on(table.location_id),
		index('idx_tasks_status').on(table.status),
		index('idx_tasks_priority').on(table.priority)
	]
);

// Inventory
export const inventory = pgTable(
	'inventory',
	{
		id: text('id').primaryKey(),
		name: varchar('name', { length: 255 }).notNull(),
		sku: varchar('sku', { length: 100 }).notNull().unique(),
		quantity: integer('quantity').notNull().default(0),
		min_stock: integer('min_stock').notNull().default(0),
		location_id: text('location_id').references(() => locations.id),
		category: varchar('category', { length: 100 }),
		unit: varchar('unit', { length: 50 }).notNull().default('unit'),
		updated_at: timestamp('updated_at').defaultNow().notNull(),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_inventory_sku').on(table.sku),
		index('idx_inventory_location').on(table.location_id),
		index('idx_inventory_category').on(table.category)
	]
);

// Expenses
export const expenses = pgTable(
	'expenses',
	{
		id: text('id').primaryKey(),
		employee_id: text('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		amount: real('amount').notNull(),
		category: varchar('category', { length: 100 }).notNull(),
		description: text('description'),
		receipt_url: text('receipt_url'),
		status: varchar('status', {
			length: 50,
			enum: ['pending', 'approved', 'rejected']
		})
			.notNull()
			.default('pending'),
		approved_by: text('approved_by').references(() => employees.id, {
			onDelete: 'set null'
		}),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_expenses_employee').on(table.employee_id),
		index('idx_expenses_status').on(table.status),
		index('idx_expenses_category').on(table.category)
	]
);

// Messages
export const messages = pgTable(
	'messages',
	{
		id: text('id').primaryKey(),
		sender_id: text('sender_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		channel: varchar('channel', { length: 255 }).notNull(),
		content: text('content').notNull(),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_messages_sender').on(table.sender_id),
		index('idx_messages_channel').on(table.channel),
		index('idx_messages_created').on(table.created_at)
	]
);

// Schedules
export const schedules = pgTable(
	'schedules',
	{
		id: text('id').primaryKey(),
		employee_id: text('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		location_id: text('location_id').references(() => locations.id),
		date: timestamp('date').notNull(),
		start_time: varchar('start_time', { length: 8 }).notNull(),
		end_time: varchar('end_time', { length: 8 }).notNull(),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('idx_schedules_employee').on(table.employee_id),
		index('idx_schedules_date').on(table.date),
		index('idx_schedules_location').on(table.location_id)
	]
);
