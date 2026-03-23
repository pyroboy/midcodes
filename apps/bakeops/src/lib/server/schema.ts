import { pgTable, text, timestamp, uuid, pgEnum, integer, boolean, decimal, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────
export const ingredientCategoryEnum = pgEnum('ingredient_category', ['dairy', 'dry', 'sugar', 'chocolate', 'produce', 'misc']);
export const ingredientUnitEnum = pgEnum('ingredient_unit', ['g', 'ml', 'pcs']);
export const recipeCategoryEnum = pgEnum('recipe_category', ['cookies', 'cakes', 'pastries', 'bread', 'drinks', 'other']);
export const pricingModeEnum = pgEnum('pricing_mode', ['auto', 'fixed', 'round_up']);
export const batchStatusEnum = pgEnum('batch_status', ['planned', 'in_progress', 'completed', 'cancelled']);
export const adjustmentReasonEnum = pgEnum('adjustment_reason', ['waste', 'spillage', 'personal_use', 'correction', 'other']);
export const appRoleEnum = pgEnum('app_role', ['admin', 'owner', 'viewer']);

// ─── Better Auth tables ──────────────────────────────────
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: appRoleEnum('role').default('owner'),
	businessId: uuid('business_id').references(() => businesses.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// ─── App tables ──────────────────────────────────────────

export const businesses = pgTable('businesses', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	logoUrl: text('logo_url'),
	tagline: text('tagline'),
	defaultMarkup: decimal('default_markup', { precision: 4, scale: 2 }).notNull().default('2.50'),
	contactInfo: jsonb('contact_info'),
	socialLinks: jsonb('social_links'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const ingredients = pgTable('ingredients', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	category: ingredientCategoryEnum('category').notNull(),
	defaultUnit: ingredientUnitEnum('default_unit').notNull().default('g'),
	packageSize: integer('package_size').notNull(),
	currentAvgCost: integer('current_avg_cost').notNull().default(0), // centavos per package
	reorderThreshold: integer('reorder_threshold').notNull().default(0), // in default units
	currentStock: integer('current_stock').notNull().default(0), // in default units
	supplier: text('supplier'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const purchases = pgTable('purchases', {
	id: uuid('id').defaultRandom().primaryKey(),
	ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
	quantity: integer('quantity').notNull(), // in default units
	totalCost: integer('total_cost').notNull(), // centavos
	supplier: text('supplier'),
	purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
	recordedBy: text('recorded_by').references(() => user.id)
});

export const stockAdjustments = pgTable('stock_adjustments', {
	id: uuid('id').defaultRandom().primaryKey(),
	ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
	quantity: integer('quantity').notNull(), // negative for removals
	reason: adjustmentReasonEnum('reason').notNull(),
	notes: text('notes'),
	adjustedBy: text('adjusted_by').references(() => user.id),
	adjustedAt: timestamp('adjusted_at').defaultNow().notNull()
});

export const recipes = pgTable('recipes', {
	id: uuid('id').defaultRandom().primaryKey(),
	businessId: uuid('business_id').references(() => businesses.id), // null = shared
	name: text('name').notNull(),
	description: text('description'),
	category: recipeCategoryEnum('category').notNull().default('cookies'),
	yieldAmount: integer('yield_amount').notNull(),
	yieldUnit: text('yield_unit').notNull().default('pcs'),
	prepTime: text('prep_time'),
	bakeTime: text('bake_time'),
	instructions: jsonb('instructions').$type<string[]>().default([]),
	tips: jsonb('tips').$type<string[]>().default([]),
	totalCostCentavos: integer('total_cost_centavos').notNull().default(0), // cached
	perUnitCostCentavos: integer('per_unit_cost_centavos').notNull().default(0), // cached
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const recipeIngredients = pgTable('recipe_ingredients', {
	id: uuid('id').defaultRandom().primaryKey(),
	recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
	ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
	amount: integer('amount').notNull(), // in default unit
	unitOverride: text('unit_override'),
	notes: text('notes')
});

export const productPrices = pgTable('product_prices', {
	id: uuid('id').defaultRandom().primaryKey(),
	recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
	businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
	pricingMode: pricingModeEnum('pricing_mode').notNull().default('auto'),
	markupMultiplier: decimal('markup_multiplier', { precision: 4, scale: 2 }), // null = use business default
	fixedPrice: integer('fixed_price'), // centavos, for fixed mode
	roundingTarget: integer('rounding_target').default(10), // round to nearest 5 or 10
	computedCost: integer('computed_cost').notNull().default(0), // centavos per unit
	computedPrice: integer('computed_price').notNull().default(0), // centavos
	marginPercentage: decimal('margin_percentage', { precision: 5, scale: 2 }).default('0'),
	minMarginAlert: decimal('min_margin_alert', { precision: 4, scale: 2 }).default('0.30'),
	isActive: boolean('is_active').notNull().default(true)
});

export const batches = pgTable('batches', {
	id: uuid('id').defaultRandom().primaryKey(),
	recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'restrict' }),
	businessId: uuid('business_id').notNull().references(() => businesses.id),
	multiplier: decimal('multiplier', { precision: 5, scale: 2 }).notNull().default('1'),
	plannedYield: integer('planned_yield').notNull(),
	actualYield: integer('actual_yield'),
	status: batchStatusEnum('status').notNull().default('planned'),
	totalCostCentavos: integer('total_cost_centavos').notNull().default(0),
	scheduledFor: date('scheduled_for'),
	startedAt: timestamp('started_at'),
	completedAt: timestamp('completed_at'),
	producedBy: text('produced_by').references(() => user.id),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const batchIngredients = pgTable('batch_ingredients', {
	id: uuid('id').defaultRandom().primaryKey(),
	batchId: uuid('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
	ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id),
	quantityUsed: integer('quantity_used').notNull(),
	unitCostAtTime: integer('unit_cost_at_time').notNull() // centavos
});

// ─── Relations ───────────────────────────────────────────

export const businessesRelations = relations(businesses, ({ many }) => ({
	recipes: many(recipes),
	productPrices: many(productPrices),
	batches: many(batches),
	users: many(user)
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
	purchases: many(purchases),
	recipeIngredients: many(recipeIngredients),
	stockAdjustments: many(stockAdjustments)
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
	business: one(businesses, { fields: [recipes.businessId], references: [businesses.id] }),
	recipeIngredients: many(recipeIngredients),
	productPrices: many(productPrices),
	batches: many(batches)
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
	recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
	ingredient: one(ingredients, { fields: [recipeIngredients.ingredientId], references: [ingredients.id] })
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
	ingredient: one(ingredients, { fields: [purchases.ingredientId], references: [ingredients.id] }),
	recorder: one(user, { fields: [purchases.recordedBy], references: [user.id] })
}));

export const productPricesRelations = relations(productPrices, ({ one }) => ({
	recipe: one(recipes, { fields: [productPrices.recipeId], references: [recipes.id] }),
	business: one(businesses, { fields: [productPrices.businessId], references: [businesses.id] })
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
	recipe: one(recipes, { fields: [batches.recipeId], references: [recipes.id] }),
	business: one(businesses, { fields: [batches.businessId], references: [businesses.id] }),
	producer: one(user, { fields: [batches.producedBy], references: [user.id] }),
	batchIngredients: many(batchIngredients)
}));

export const batchIngredientsRelations = relations(batchIngredients, ({ one }) => ({
	batch: one(batches, { fields: [batchIngredients.batchId], references: [batches.id] }),
	ingredient: one(ingredients, { fields: [batchIngredients.ingredientId], references: [ingredients.id] })
}));

export const userRelations = relations(user, ({ one }) => ({
	business: one(businesses, { fields: [user.businessId], references: [businesses.id] })
}));
