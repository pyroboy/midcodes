import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, decimal, pgEnum, date, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user', 'user']);
export const templateOrientationEnum = pgEnum('template_orientation', ['portrait', 'landscape']);
export const templateSampleTypeEnum = pgEnum('template_sample_type', ['student', 'employee', 'membership', 'visitor', 'other']);

export const appRoleEnum = pgEnum('app_role', [
  'super_admin',
  'org_admin',
  'user',
  'event_admin',
  'event_qr_checker',
  'property_admin',
  'property_user',
  'id_gen_admin',
  'id_gen_user'
]);

export const appPermissionEnum = pgEnum('app_permission', [
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
  'bookings.delete'
]);

// --- CORE TABLES ---

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  displayName: text('display_name'),
  description: text('description'),
  isSystem: boolean('is_system').default(false),
  orgId: uuid('org_id').references(() => organizations.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Linked to Better Auth 'user.id'
  email: text('email'),
  role: userRoleEnum('role').default('user'),
  orgId: uuid('org_id').references(() => organizations.id),
  creditsBalance: integer('credits_balance').notNull().default(0),
  cardGenerationCount: integer('card_generation_count').notNull().default(0),
  templateCount: integer('template_count').notNull().default(0),
  unlimitedTemplates: boolean('unlimited_templates').notNull().default(false),
  removeWatermarks: boolean('remove_watermarks').notNull().default(false),
  avatarUrl: text('avatar_url'),
  context: jsonb('context').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => profiles.id),
  orgId: uuid('org_id').references(() => organizations.id),
  name: text('name').notNull(),
  frontBackground: text('front_background'),
  backBackground: text('back_background'),
  orientation: text('orientation'), // 'portrait' or 'landscape'
  widthPixels: integer('width_pixels'),
  heightPixels: integer('height_pixels'),
  dpi: integer('dpi').default(300),
  templateElements: jsonb('template_elements').notNull(),
  frontBackgroundLowRes: text('front_background_low_res'),
  backBackgroundLowRes: text('back_background_low_res'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const idcards = pgTable('idcards', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => templates.id),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  frontImage: text('front_image'),
  backImage: text('back_image'),
  frontImageLowRes: text('front_image_low_res'),
  backImageLowRes: text('back_image_low_res'),
  data: jsonb('data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const templateSizePresets = pgTable('template_size_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  widthInches: decimal('width_inches', { precision: 6, scale: 4 }).notNull(),
  heightInches: decimal('height_inches', { precision: 6, scale: 4 }).notNull(),
  widthMm: decimal('width_mm', { precision: 8, scale: 2 }).notNull(),
  heightMm: decimal('height_mm', { precision: 8, scale: 2 }).notNull(),
  widthPixels: integer('width_pixels').notNull(),
  heightPixels: integer('height_pixels').notNull(),
  dpi: integer('dpi').notNull().default(300),
  aspectRatio: decimal('aspect_ratio', { precision: 6, scale: 4 }),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const templateAssets = pgTable('template_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  tags: text('tags').array().default([]),
  sizePresetId: uuid('size_preset_id').references(() => templateSizePresets.id),
  sampleType: templateSampleTypeEnum('sample_type').notNull(),
  orientation: templateOrientationEnum('orientation').notNull(),
  imagePath: text('image_path').notNull(),
  imageUrl: text('image_url').notNull(),
  widthPixels: integer('width_pixels').notNull(),
  heightPixels: integer('height_pixels').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  uploadedBy: text('uploaded_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- PAYMENTS & BILLING ---

export const paymentRecords = pgTable('payment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  sessionId: text('session_id').notNull(),
  providerPaymentId: text('provider_payment_id'),
  kind: text('kind').notNull(),
  skuId: text('sku_id').notNull(),
  amountPhp: decimal('amount_php', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('PHP'),
  status: text('status').notNull().default('pending'),
  method: text('method'),
  methodAllowed: text('method_allowed').array().notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  metadata: jsonb('metadata').default({}),
  rawEvent: jsonb('raw_event'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  invoiceType: text('invoice_type').notNull().default('credit_purchase'),
  status: text('status').notNull().default('draft'),
  subtotal: integer('subtotal').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull().default(0),
  amountPaid: integer('amount_paid').notNull().default(0),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  createdBy: text('created_by').references(() => profiles.id),
  paidBy: text('paid_by').references(() => profiles.id),
  voidedBy: text('voided_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  itemType: text('item_type').notNull(),
  skuId: text('sku_id'),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: integer('unit_price').notNull().default(0),
  totalPrice: integer('total_price').notNull().default(0),
  creditsGranted: integer('credits_granted').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  transactionType: text('transaction_type').notNull(),
  amount: integer('amount').notNull(),
  creditsBefore: integer('credits_before').notNull(),
  creditsAfter: integer('credits_after').notNull(),
  description: text('description'),
  referenceId: text('reference_id'),
  metadata: jsonb('metadata').default({}),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  usageType: text('usage_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// --- CONFIG & SETTINGS ---

export const orgSettings = pgTable('org_settings', {
  orgId: uuid('org_id').primaryKey().references(() => organizations.id),
  paymentsEnabled: boolean('payments_enabled').notNull().default(true),
  paymentsBypass: boolean('payments_bypass').notNull().default(false),
  updatedBy: text('updated_by').references(() => profiles.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const bgRemovalUsage = pgTable('bg_removal_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  date: date('date').defaultNow(),
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const adminAudit = pgTable('admin_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  adminId: text('admin_id').references(() => profiles.id).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }),
  targetId: text('target_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  provider: text('provider').notNull().default('paymongo'),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
  rawPayload: jsonb('raw_payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const digitalCards = pgTable('digital_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  ownerId: text('owner_id').references(() => profiles.id),
  orgId: uuid('org_id').references(() => organizations.id),
  linkedIdCardId: uuid('linked_id_card_id').references(() => idcards.id),
  status: text('status').default('unclaimed'),
  claimCodeHash: text('claim_code_hash'),
  privacySettings: jsonb('privacy_settings').default({ public: true, show_phone: false }),
  profileContent: jsonb('profile_content').default({}),
  themeConfig: jsonb('theme_config').default({ style: 'minimal' }),
  views: integer('views').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const customDesignRequests = pgTable('custom_design_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id),
  sizePresetId: uuid('size_preset_id').references(() => templateSizePresets.id),
  widthPixels: integer('width_pixels').notNull(),
  heightPixels: integer('height_pixels').notNull(),
  sizeName: text('size_name').notNull(),
  designInstructions: text('design_instructions').notNull(),
  referenceAssets: text('reference_assets').array().notNull().default([]),
  status: text('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  rejectedReason: text('rejected_reason'),
  approvedBy: text('approved_by').references(() => profiles.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  resultingTemplateId: uuid('resulting_template_id').references(() => templates.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const aiSettings = pgTable('ai_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull().unique(),
  apiKey: text('api_key'),
  provider: text('provider').notNull().default('nano_banana'),
  model: text('model').notNull().default('default'),
  creditsBalance: integer('credits_balance').notNull().default(0),
  creditsUsed: integer('credits_used').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  rateLimitPerMinute: integer('rate_limit_per_minute').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const aiGenerations = pgTable('ai_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  provider: text('provider').notNull(),
  model: text('model'),
  creditsUsed: integer('credits_used').notNull().default(0),
  prompt: text('prompt'),
  resultUrl: text('result_url'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  role: appRoleEnum('role').notNull(),
  permission: appPermissionEnum('permission').notNull(),
});

// --- BETTER AUTH TABLES ---

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});
