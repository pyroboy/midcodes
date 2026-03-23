import { pgTable, text, integer, timestamp, boolean, decimal, numeric, jsonb, varchar, uuid, index, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable(
	'users',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		phone: varchar('phone', { length: 20 }),
		name: varchar('name', { length: 255 }).notNull(),
		role: varchar('role', { length: 50, enum: ['player', 'venue_manager', 'admin'] }).notNull().default('player'),
		avatarUrl: text('avatar_url'),
		homeLat: numeric('home_lat'),
		homeLng: numeric('home_lng'),
		skillLevel: varchar('skill_level', { length: 50, enum: ['beginner', 'intermediate', 'advanced', 'competitive'] }).default('beginner'),
		duprRating: numeric('dupr_rating'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull(),
		updatedAt: timestamp('updated_at').default(sql`now()`).notNull()
	},
	(table) => ({
		emailIdx: index('users_email_idx').on(table.email),
		roleIdx: index('users_role_idx').on(table.role)
	})
);

// Venues table
export const venues = pgTable(
	'venues',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		ownerId: uuid('owner_id').notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		address: text('address').notNull(),
		lat: numeric('lat').notNull(),
		lng: numeric('lng').notNull(),
		description: text('description'),
		courtCount: integer('court_count').notNull(),
		courtType: varchar('court_type', { length: 50, enum: ['glass', 'concrete', 'acrylic', 'clay'] }).default('acrylic'),
		surfaceType: varchar('surface_type', { length: 50, enum: ['indoor', 'outdoor', 'hybrid'] }).default('outdoor'),
		amenities: jsonb('amenities').$type<string[]>().default(sql`'[]'::jsonb`),
		pricingOffPeak: numeric('pricing_off_peak'),
		pricingPeak: numeric('pricing_peak'),
		operatingHours: jsonb('operating_hours'),
		cancellationPolicy: varchar('cancellation_policy', { length: 500 }),
		photos: text('photos').$type<string[]>().default(sql`'[]'::jsonb`),
		isVerified: boolean('is_verified').default(false),
		isActive: boolean('is_active').default(true),
		ratingAvg: numeric('rating_avg'),
		reviewCount: integer('review_count').default(0),
		paymongoAccountId: varchar('paymongo_account_id'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull(),
		updatedAt: timestamp('updated_at').default(sql`now()`).notNull()
	},
	(table) => ({
		ownerIdx: index('venues_owner_id_idx').on(table.ownerId),
		activeIdx: index('venues_is_active_idx').on(table.isActive)
	})
);

// Courts table
export const courts = pgTable(
	'courts',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		venueId: uuid('venue_id').notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		type: varchar('type', { length: 50, enum: ['indoor', 'outdoor'] }).notNull(),
		status: varchar('status', { length: 50, enum: ['active', 'maintenance'] }).default('active'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull()
	},
	(table) => ({
		venueIdx: index('courts_venue_id_idx').on(table.venueId)
	})
);

// Slots table
export const slots = pgTable(
	'slots',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		courtId: uuid('court_id').notNull(),
		date: timestamp('date').notNull(),
		startTime: varchar('start_time', { length: 50 }).notNull(),
		endTime: varchar('end_time', { length: 50 }).notNull(),
		pricePhp: numeric('price_php'),
		status: varchar('status', { length: 50, enum: ['available', 'booked', 'blocked'] }).default('available'),
		bookingId: uuid('booking_id'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull()
	},
	(table) => ({
		courtIdx: index('slots_court_id_idx').on(table.courtId),
		dateIdx: index('slots_date_idx').on(table.date),
		statusIdx: index('slots_status_idx').on(table.status)
	})
);

// Bookings table
export const bookings = pgTable(
	'bookings',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		playerId: uuid('player_id').notNull(),
		slotId: uuid('slot_id').notNull(),
		venueId: uuid('venue_id').notNull(),
		status: varchar('status', { length: 50, enum: ['confirmed', 'cancelled', 'completed', 'no_show'] }).default('confirmed'),
		paymentId: uuid('payment_id'),
		totalPhp: numeric('total_php'),
		bookedVia: varchar('booked_via', { length: 50, enum: ['direct', 'snipe'] }).default('direct'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull(),
		cancelledAt: timestamp('cancelled_at')
	},
	(table) => ({
		playerIdx: index('bookings_player_id_idx').on(table.playerId),
		slotIdx: index('bookings_slot_id_idx').on(table.slotId),
		venueIdx: index('bookings_venue_id_idx').on(table.venueId),
		statusIdx: index('bookings_status_idx').on(table.status)
	})
);

// Snipes table
export const snipes = pgTable(
	'snipes',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		playerId: uuid('player_id').notNull(),
		criteria: jsonb('criteria').notNull(),
		status: varchar('status', { length: 50, enum: ['active', 'watching', 'booked', 'expired', 'cancelled'] }).default('active'),
		matchedBookingId: uuid('matched_booking_id'),
		autoPay: boolean('auto_pay').default(false),
		createdAt: timestamp('created_at').default(sql`now()`).notNull(),
		expiresAt: timestamp('expires_at').notNull()
	},
	(table) => ({
		playerIdx: index('snipes_player_id_idx').on(table.playerId),
		statusIdx: index('snipes_status_idx').on(table.status),
		expiresAtIdx: index('snipes_expires_at_idx').on(table.expiresAt)
	})
);

// Payments table
export const payments = pgTable(
	'payments',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		bookingId: uuid('booking_id').notNull(),
		playerId: uuid('player_id').notNull(),
		amountPhp: numeric('amount_php').notNull(),
		commissionPhp: numeric('commission_php'),
		netVenuePhp: numeric('net_venue_php'),
		paymentMethod: varchar('payment_method', { length: 50, enum: ['card', 'gcash', 'bank_transfer'] }),
		paymongoPaymentId: varchar('paymongo_payment_id'),
		status: varchar('status', { length: 50, enum: ['pending', 'completed', 'failed', 'refunded'] }).default('pending'),
		paidAt: timestamp('paid_at'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull()
	},
	(table) => ({
		bookingIdx: index('payments_booking_id_idx').on(table.bookingId),
		playerIdx: index('payments_player_id_idx').on(table.playerId),
		statusIdx: index('payments_status_idx').on(table.status)
	})
);

// Reviews table
export const reviews = pgTable(
	'reviews',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		playerId: uuid('player_id').notNull(),
		venueId: uuid('venue_id').notNull(),
		bookingId: uuid('booking_id').notNull(),
		rating: integer('rating').notNull(),
		text: text('text'),
		venueResponse: text('venue_response'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull(),
		updatedAt: timestamp('updated_at').default(sql`now()`).notNull()
	},
	(table) => ({
		venueIdx: index('reviews_venue_id_idx').on(table.venueId),
		playerIdx: index('reviews_player_id_idx').on(table.playerId)
	})
);

// Payouts table
export const payouts = pgTable(
	'payouts',
	{
		id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
		venueId: uuid('venue_id').notNull(),
		amountPhp: numeric('amount_php').notNull(),
		periodStart: timestamp('period_start').notNull(),
		periodEnd: timestamp('period_end').notNull(),
		status: varchar('status', { length: 50, enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending'),
		paymongoPayoutId: varchar('paymongo_payout_id'),
		completedAt: timestamp('completed_at'),
		createdAt: timestamp('created_at').default(sql`now()`).notNull()
	},
	(table) => ({
		venueIdx: index('payouts_venue_id_idx').on(table.venueId),
		statusIdx: index('payouts_status_idx').on(table.status)
	})
);

// Foreign keys
export const usersForeignKeys = [
	foreignKey(() => ({
		columns: [venues.ownerId],
		foreignColumns: [users.id]
	})),
	foreignKey(() => ({
		columns: [courts.venueId],
		foreignColumns: [venues.id]
	})),
	foreignKey(() => ({
		columns: [slots.courtId],
		foreignColumns: [courts.id]
	})),
	foreignKey(() => ({
		columns: [bookings.playerId],
		foreignColumns: [users.id]
	})),
	foreignKey(() => ({
		columns: [bookings.venueId],
		foreignColumns: [venues.id]
	})),
	foreignKey(() => ({
		columns: [snipes.playerId],
		foreignColumns: [users.id]
	})),
	foreignKey(() => ({
		columns: [reviews.playerId],
		foreignColumns: [users.id]
	})),
	foreignKey(() => ({
		columns: [reviews.venueId],
		foreignColumns: [venues.id]
	})),
	foreignKey(() => ({
		columns: [payouts.venueId],
		foreignColumns: [venues.id]
	}))
];
