import {
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	boolean,
	jsonb,
	decimal,
	pgEnum,
	date,
	varchar,
	bigint,
	serial,
	numeric
} from 'drizzle-orm/pg-core';

// --- ENUMS ---

export const appPermissionEnum = pgEnum('app_permission', [
	'properties.create',
	'properties.read',
	'properties.update',
	'properties.delete',
	'floors.create',
	'floors.read',
	'floors.update',
	'floors.delete',
	'rental_units.create',
	'rental_units.read',
	'rental_units.update',
	'rental_units.delete',
	'maintenance.create',
	'maintenance.read',
	'maintenance.update',
	'maintenance.delete',
	'expenses.create',
	'expenses.read',
	'expenses.update',
	'expenses.delete',
	'tenants.create',
	'tenants.read',
	'tenants.update',
	'tenants.delete',
	'leases.create',
	'leases.read',
	'leases.update',
	'leases.delete',
	'billings.create',
	'billings.read',
	'billings.update',
	'billings.delete',
	'payments.create',
	'payments.read',
	'payments.update',
	'payments.delete',
	'payment_schedules.manage',
	'payment_schedules.read',
	'penalties.configure',
	'meters.create',
	'meters.read',
	'meters.update',
	'meters.delete',
	'readings.create',
	'readings.read',
	'readings.update',
	'readings.delete',
	'events.create',
	'events.read',
	'events.update',
	'events.delete',
	'attendees.create',
	'attendees.read',
	'attendees.update',
	'attendees.delete',
	'attendees.check_qr',
	'templates.create',
	'templates.read',
	'templates.update',
	'templates.delete',
	'idcards.create',
	'idcards.read',
	'idcards.update',
	'idcards.delete',
	'organizations.create',
	'organizations.read',
	'organizations.update',
	'organizations.delete',
	'profiles.read',
	'profiles.update',
	'bookings.read',
	'bookings.update',
	'bookings.delete',
	'template_assets.create',
	'template_assets.read',
	'template_assets.update',
	'template_assets.delete',
	'invoices.create',
	'invoices.read',
	'invoices.update',
	'invoices.delete',
	'credits.create',
	'credits.read',
	'credits.update',
	'credits.delete',
	'analytics.read',
	'users.create',
	'users.read',
	'users.update',
	'users.delete'
]);

export const appRoleEnum = pgEnum('app_role', [
	'super_admin',
	'org_admin',
	'user',
	'event_admin',
	'event_qr_checker',
	'property_admin',
	'property_user',
	'id_gen_admin',
	'id_gen_user',
	'id_gen_super_admin',
	'id_gen_org_admin',
	'id_gen_accountant',
	'id_gen_encoder',
	'id_gen_printer',
	'id_gen_viewer',
	'id_gen_template_designer',
	'id_gen_auditor'
]);

export const userRoleEnum = pgEnum('user_role', [
	'super_admin',
	'org_admin',
	'user',
	'event_admin',
	'event_qr_checker',
	'property_admin',
	'property_manager',
	'property_accountant',
	'property_maintenance',
	'property_utility',
	'property_frontdesk',
	'property_tenant',
	'property_guest',
	'id_gen_admin',
	'id_gen_user'
]);

export const billingTypeEnum = pgEnum('billing_type', [
	'RENT',
	'UTILITY',
	'PENALTY',
	'MAINTENANCE',
	'SERVICE',
	'SECURITY_DEPOSIT'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
	'PENDING',
	'PARTIAL',
	'PAID',
	'OVERDUE',
	'PENALIZED'
]);

export const expenseStatusEnum = pgEnum('expense_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const expenseTypeEnum = pgEnum('expense_type', ['OPERATIONAL', 'CAPITAL']);

export const floorStatusEnum = pgEnum('floor_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const leaseStatusEnum = pgEnum('lease_status', [
	'ACTIVE',
	'INACTIVE',
	'EXPIRED',
	'TERMINATED',
	'PENDING',
	'ARCHIVED'
]);

export const leaseTypeEnum = pgEnum('lease_type', ['BEDSPACER', 'PRIVATEROOM']);

export const locationStatusEnum = pgEnum('location_status', ['VACANT', 'OCCUPIED', 'RESERVED']);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
	'PENDING',
	'IN_PROGRESS',
	'COMPLETED'
]);

export const meterLocationTypeEnum = pgEnum('meter_location_type', [
	'PROPERTY',
	'FLOOR',
	'RENTAL_UNIT'
]);

export const meterStatusEnum = pgEnum('meter_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const paymentFrequencyEnum = pgEnum('payment_frequency', [
	'MONTHLY',
	'QUARTERLY',
	'ANNUAL',
	'CUSTOM',
	'ONE_TIME'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
	'CASH',
	'BANK',
	'GCASH',
	'OTHER',
	'SECURITY_DEPOSIT'
]);

export const propertyStatusEnum = pgEnum('property_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const tenantStatusEnum = pgEnum('tenant_status', [
	'ACTIVE',
	'INACTIVE',
	'PENDING',
	'BLACKLISTED'
]);

export const unitTypeEnum = pgEnum('unit_type', ['BEDSPACER', 'PRIVATE_ROOM']);

export const utilityTypeEnum = pgEnum('utility_type', ['ELECTRICITY', 'WATER', 'INTERNET']);

// --- CORE TABLES ---

export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const profiles = pgTable('profiles', {
	id: uuid('id').primaryKey(), // Linked to Better Auth user.id
	email: text('email'),
	role: userRoleEnum('role').default('user'),
	orgId: uuid('org_id').references(() => organizations.id),
	context: jsonb('context').default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const properties = pgTable('properties', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	address: text('address').notNull(),
	type: text('type').notNull(),
	status: propertyStatusEnum('status').notNull().default('ACTIVE'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
});

export const floors = pgTable('floors', {
	id: serial('id').primaryKey(),
	propertyId: integer('property_id')
		.notNull()
		.references(() => properties.id),
	floorNumber: integer('floor_number').notNull(),
	wing: text('wing'),
	status: floorStatusEnum('status').notNull().default('ACTIVE'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
});

export const rentalUnit = pgTable('rental_unit', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	capacity: integer('capacity').notNull(),
	rentalUnitStatus: locationStatusEnum('rental_unit_status').notNull().default('VACANT'),
	baseRate: decimal('base_rate', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	propertyId: integer('property_id')
		.notNull()
		.references(() => properties.id),
	floorId: integer('floor_id')
		.notNull()
		.references(() => floors.id),
	type: text('type').notNull(),
	amenities: jsonb('amenities').default({}),
	number: integer('number').notNull()
});

export const meters = pgTable('meters', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	locationType: meterLocationTypeEnum('location_type').notNull(),
	propertyId: integer('property_id').references(() => properties.id),
	floorId: integer('floor_id').references(() => floors.id),
	rentalUnitId: integer('rental_unit_id').references(() => rentalUnit.id),
	type: utilityTypeEnum('type').notNull(),
	isActive: boolean('is_active').default(true),
	status: meterStatusEnum('status').notNull().default('ACTIVE'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	initialReading: decimal('initial_reading', { precision: 10, scale: 2 })
});

export const readings = pgTable('readings', {
	id: serial('id').primaryKey(),
	meterId: integer('meter_id')
		.notNull()
		.references(() => meters.id),
	reading: decimal('reading', { precision: 10, scale: 2 }).notNull(),
	readingDate: date('reading_date').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	meterName: text('meter_name'),
	rateAtReading: decimal('rate_at_reading', { precision: 10, scale: 2 }),
	previousReading: decimal('previous_reading', { precision: 10, scale: 2 }),
	backdatingEnabled: boolean('backdating_enabled').default(false),
	reviewStatus: text('review_status').notNull().default('APPROVED')
});

export const tenants = pgTable('tenants', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	contactNumber: text('contact_number'),
	email: varchar('email', { length: 255 }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	authId: uuid('auth_id'),
	emergencyContact: jsonb('emergency_contact'),
	tenantStatus: tenantStatusEnum('tenant_status').notNull().default('PENDING'),
	createdBy: uuid('created_by'),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
	profilePictureUrl: text('profile_picture_url'),
	address: text('address'),
	schoolOrWorkplace: text('school_or_workplace'),
	facebookName: text('facebook_name'),
	birthday: date('birthday')
});

export const leases = pgTable('leases', {
	id: serial('id').primaryKey(),
	rentalUnitId: integer('rental_unit_id')
		.notNull()
		.references(() => rentalUnit.id),
	name: text('name').notNull(),
	startDate: date('start_date').notNull(),
	endDate: date('end_date').notNull(),
	rentAmount: decimal('rent_amount', { precision: 10, scale: 2 }).notNull(),
	securityDeposit: decimal('security_deposit', { precision: 10, scale: 2 }).notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	createdBy: uuid('created_by'),
	termsMonth: integer('terms_month'),
	status: leaseStatusEnum('status').notNull().default('ACTIVE'),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
	deletedBy: uuid('deleted_by'),
	deletionReason: text('deletion_reason')
});

export const leaseTenants = pgTable('lease_tenants', {
	id: serial('id').primaryKey(),
	leaseId: integer('lease_id')
		.notNull()
		.references(() => leases.id),
	tenantId: integer('tenant_id')
		.notNull()
		.references(() => tenants.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const billings = pgTable('billings', {
	id: serial('id').primaryKey(),
	leaseId: integer('lease_id')
		.notNull()
		.references(() => leases.id),
	type: billingTypeEnum('type').notNull(),
	utilityType: utilityTypeEnum('utility_type'),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
	balance: decimal('balance', { precision: 10, scale: 2 }).notNull(),
	status: paymentStatusEnum('status').notNull().default('PENDING'),
	dueDate: date('due_date').notNull(),
	billingDate: date('billing_date').notNull(),
	penaltyAmount: decimal('penalty_amount', { precision: 10, scale: 2 }).default('0'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	meterId: integer('meter_id').references(() => meters.id)
});

export const payments = pgTable('payments', {
	id: serial('id').primaryKey(),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	method: paymentMethodEnum('method').notNull(),
	referenceNumber: text('reference_number'),
	paidBy: text('paid_by').notNull(),
	paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	receiptUrl: text('receipt_url'),
	createdBy: uuid('created_by'),
	updatedBy: uuid('updated_by'),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	billingIds: integer('billing_ids').array().notNull(),
	billingId: integer('billing_id').references(() => billings.id),
	revertedAt: timestamp('reverted_at', { withTimezone: true }),
	revertedBy: uuid('reverted_by'),
	revertReason: text('revert_reason')
});

export const paymentAllocations = pgTable('payment_allocations', {
	id: serial('id').primaryKey(),
	paymentId: integer('payment_id').references(() => payments.id),
	billingId: integer('billing_id').references(() => billings.id),
	amount: numeric('amount').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const penaltyConfigs = pgTable('penalty_configs', {
	id: serial('id').primaryKey(),
	type: billingTypeEnum('type').notNull(),
	gracePeriod: integer('grace_period').notNull(),
	penaltyPercentage: decimal('penalty_percentage', { precision: 5, scale: 2 }).notNull(),
	compoundPeriod: integer('compound_period'),
	maxPenaltyPercentage: decimal('max_penalty_percentage', { precision: 5, scale: 2 }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
});

export const expenses = pgTable('expenses', {
	id: serial('id').primaryKey(),
	propertyId: integer('property_id').references(() => properties.id),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	description: text('description').notNull(),
	type: expenseTypeEnum('type').notNull(),
	status: expenseStatusEnum('status').notNull().default('PENDING'),
	createdBy: uuid('created_by'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }),
	expenseDate: timestamp('expense_date', { withTimezone: true })
});

export const maintenance = pgTable('maintenance', {
	id: serial('id').primaryKey(),
	locationId: integer('location_id')
		.notNull()
		.references(() => rentalUnit.id),
	title: text('title').notNull(),
	description: text('description').notNull(),
	status: maintenanceStatusEnum('status').default('PENDING'),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
});

export const budgets = pgTable('budgets', {
	id: bigint('id', { mode: 'number' }).primaryKey(),
	projectName: text('project_name').notNull(),
	projectDescription: text('project_description'),
	projectCategory: text('project_category'),
	plannedAmount: decimal('planned_amount', { precision: 10, scale: 2 }).notNull(),
	pendingAmount: decimal('pending_amount', { precision: 10, scale: 2 }).default('0'),
	actualAmount: decimal('actual_amount', { precision: 10, scale: 2 }).default('0'),
	budgetItems: jsonb('budget_items').default([]),
	status: text('status').default('planned'),
	startDate: timestamp('start_date', { withTimezone: true }),
	endDate: timestamp('end_date', { withTimezone: true }),
	propertyId: integer('property_id')
		.notNull()
		.references(() => properties.id),
	createdBy: uuid('created_by'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// --- EVENTS & ATTENDEES ---

export const events = pgTable('events', {
	id: uuid('id').primaryKey().defaultRandom(),
	eventName: text('event_name').notNull(),
	eventLongName: text('event_long_name'),
	eventUrl: text('event_url'),
	otherInfo: jsonb('other_info').default({}),
	ticketingData: jsonb('ticketing_data').array().default([]),
	isPublic: boolean('is_public').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	createdBy: uuid('created_by').notNull(),
	orgId: uuid('org_id')
		.notNull()
		.references(() => organizations.id),
	paymentTimeoutMinutes: integer('payment_timeout_minutes').default(15)
});

export const attendees = pgTable('attendees', {
	id: uuid('id').primaryKey().defaultRandom(),
	basicInfo: jsonb('basic_info').default({}),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id),
	ticketInfo: jsonb('ticket_info').default({}),
	isPaid: boolean('is_paid').default(false),
	isPrinted: boolean('is_printed').default(false),
	receivedBy: uuid('received_by'),
	qrLink: text('qr_link'),
	referenceCodeUrl: text('reference_code_url'),
	attendanceStatus: text('attendance_status').default('notRegistered'),
	qrScanInfo: jsonb('qr_scan_info').array().default([]),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	orgId: uuid('org_id')
		.notNull()
		.references(() => organizations.id)
});

// --- ID GEN TABLES ---

export const templates = pgTable('templates', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => profiles.id),
	name: text('name').notNull(),
	frontBackground: text('front_background'),
	backBackground: text('back_background'),
	orientation: text('orientation'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	templateElements: jsonb('template_elements').notNull(),
	orgId: uuid('org_id').references(() => organizations.id)
});

export const idcards = pgTable('idcards', {
	id: uuid('id').primaryKey().defaultRandom(),
	templateId: uuid('template_id').references(() => templates.id),
	frontImage: text('front_image'),
	backImage: text('back_image'),
	data: jsonb('data'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	orgId: uuid('org_id')
		.notNull()
		.references(() => organizations.id)
});

// --- RBAC ---

export const rolePermissions = pgTable('role_permissions', {
	id: bigint('id', { mode: 'number' }).primaryKey(),
	role: appRoleEnum('role').notNull(),
	permission: appPermissionEnum('permission').notNull()
});

export const userRoles = pgTable('user_roles', {
	id: bigint('id', { mode: 'number' }).primaryKey(),
	userId: uuid('user_id').notNull(),
	role: appRoleEnum('role').notNull()
});

// --- BOOKINGS ---

export const bookings = pgTable('bookings', {
	id: uuid('id').primaryKey().defaultRandom(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	status: text('status').notNull().default('Pending'),
	name: text('name').notNull(),
	email: text('email').notNull(),
	phone: text('phone').notNull(),
	dob: date('dob'),
	preferredContact: text('preferred_contact'),
	instagramHandle: text('instagram_handle'),
	facebookProfile: text('facebook_profile'),
	category: text('category'),
	placement: text('placement'),
	tattooSize: numeric('tattoo_size'),
	isColor: boolean('is_color').notNull().default(false),
	isCoverUp: boolean('is_cover_up').notNull().default(false),
	complexity: integer('complexity'),
	creativeFreedom: integer('creative_freedom'),
	specificReqs: text('specific_reqs'),
	mustHaves: text('must_haves'),
	colorPrefs: text('color_prefs'),
	placementNotes: text('placement_notes'),
	requestedDate: timestamp('requested_date', { withTimezone: true }),
	requestedTime: text('requested_time'),
	artistPreference: text('artist_preference'),
	estimatedDuration: integer('estimated_duration'),
	estimatedSessions: integer('estimated_sessions'),
	pricingDetails: jsonb('pricing_details'),
	referenceImageUrls: jsonb('reference_image_urls'),
	termsAgreed: boolean('terms_agreed').notNull().default(false),
	medicalConfirmed: boolean('medical_confirmed').notNull().default(false),
	ageConfirmed: boolean('age_confirmed').notNull().default(false),
	savedReplyRecommendations: jsonb('saved_reply_recommendations'),
	adminNotes: text('admin_notes'),
	primaryTattooStyle: text('primary_tattoo_style'),
	styleDescription: text('style_description')
});

// --- AI PROMPTS ---

export const aiPrompts = pgTable('ai_prompts', {
	promptId: text('prompt_id').primaryKey(),
	promptText: text('prompt_text').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// --- NOTIFICATIONS & AUTOMATION ---

export const notificationTypeEnum = pgEnum('notification_type', [
	'PAYMENT_REMINDER',
	'OVERDUE_NOTICE',
	'PENALTY_APPLIED',
	'BILLING_GENERATED',
	'LEASE_EXPIRY',
	'GENERAL'
]);

export const notificationStatusEnum = pgEnum('notification_status', [
	'UNREAD',
	'READ',
	'DISMISSED'
]);

export const automationJobTypeEnum = pgEnum('automation_job_type', [
	'PENALTY_CALC',
	'OVERDUE_CHECK',
	'UTILITY_BILLING',
	'REMINDER'
]);

export const automationJobStatusEnum = pgEnum('automation_job_status', [
	'SUCCESS',
	'PARTIAL',
	'FAILED'
]);

export const notifications = pgTable('notifications', {
	id: serial('id').primaryKey(),
	userId: text('user_id'),
	tenantId: integer('tenant_id').references(() => tenants.id),
	type: notificationTypeEnum('type').notNull(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	status: notificationStatusEnum('status').notNull().default('UNREAD'),
	relatedId: integer('related_id'),
	relatedType: text('related_type'),
	metadata: jsonb('metadata'),
	readAt: timestamp('read_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const automationLogs = pgTable('automation_logs', {
	id: serial('id').primaryKey(),
	jobType: automationJobTypeEnum('job_type').notNull(),
	status: automationJobStatusEnum('status').notNull(),
	itemsProcessed: integer('items_processed').default(0),
	itemsFailed: integer('items_failed').default(0),
	details: jsonb('details'),
	startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	error: text('error')
});

// --- BETTER AUTH TABLES ---
// Re-exported from schema-auth.ts (lightweight module for CF Workers CPU budget)
export { user, session, account, verification } from './schema-auth';
