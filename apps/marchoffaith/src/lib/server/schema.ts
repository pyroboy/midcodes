import { pgTable, text, timestamp, boolean, jsonb, serial, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Articles (news/blog posts from Facebook @marchoffaithinc) ───

export const articles = pgTable('articles', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	date: text('date').notNull(),
	category: text('category').notNull(),
	description: text('description').notNull(),
	featuredImage: text('featured_image'),
	images: jsonb('images').$type<ArticleImage[]>().default([]),
	content: jsonb('content').$type<ContentBlock[]>().default([]),
	isPublished: boolean('is_published').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Churches ───

export const churches = pgTable('churches', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	street: text('street').notNull(),
	city: text('city').notNull(),
	province: text('province').notNull(),
	phone: text('phone'),
	email: text('email'),
	facebookHandle: text('facebook_handle'),
	instagramHandle: text('instagram_handle'),
	youtubeHandle: text('youtube_handle'),
	imageUrl: text('image_url'),
	services: jsonb('services').$type<ServiceSchedule[]>().default([]),
	totalMembers: integer('total_members'),
	yearFounded: integer('year_founded'),
	isActive: boolean('is_active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Pastors ───

export const pastors = pgTable('pastors', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	role: text('role'),
	bio: text('bio'),
	photoUrl: text('photo_url'),
	phone: text('phone'),
	email: text('email'),
	ministryFocus: text('ministry_focus'),
	isActive: boolean('is_active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Church ↔ Pastor assignments (many-to-many) ───

export const churchPastors = pgTable('church_pastors', {
	id: serial('id').primaryKey(),
	churchId: integer('church_id').notNull().references(() => churches.id, { onDelete: 'cascade' }),
	pastorId: integer('pastor_id').notNull().references(() => pastors.id, { onDelete: 'cascade' }),
	role: text('role').notNull().default('Resident Pastor'),
	since: text('since'),
	isPrimary: boolean('is_primary').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	uniqueIndex('idx_church_pastors_unique').on(table.churchId, table.pastorId),
	index('idx_church_pastors_church').on(table.churchId),
	index('idx_church_pastors_pastor').on(table.pastorId)
]);

// ─── Events ───

export const events = pgTable('events', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	date: timestamp('date', { withTimezone: true }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true }),
	location: text('location'),
	churchId: integer('church_id').references(() => churches.id, { onDelete: 'set null' }),
	description: text('description'),
	imageUrl: text('image_url'),
	isPublished: boolean('is_published').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Sermons ───

export const sermons = pgTable('sermons', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	date: text('date').notNull(),
	speaker: text('speaker').notNull(),
	videoUrl: text('video_url'),
	audioUrl: text('audio_url'),
	description: text('description'),
	thumbnailUrl: text('thumbnail_url'),
	isPublished: boolean('is_published').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Photo Galleries ───

export const galleries = pgTable('galleries', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	date: text('date'),
	description: text('description'),
	coverImageUrl: text('cover_image_url'),
	isPublished: boolean('is_published').default(false).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const galleryImages = pgTable('gallery_images', {
	id: serial('id').primaryKey(),
	galleryId: integer('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }),
	imageUrl: text('image_url').notNull(),
	caption: text('caption'),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('idx_gallery_images_gallery').on(table.galleryId)
]);

// ─── Announcements (site-wide banner) ───

export const announcements = pgTable('announcements', {
	id: serial('id').primaryKey(),
	message: text('message').notNull(),
	linkUrl: text('link_url'),
	linkText: text('link_text'),
	isActive: boolean('is_active').default(true).notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Prayer Requests ───

export const prayerRequests = pgTable('prayer_requests', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email'),
	request: text('request').notNull(),
	isApproved: boolean('is_approved').default(false).notNull(),
	isPublic: boolean('is_public').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Contact Submissions ───

export const contactSubmissions = pgTable('contact_submissions', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	subject: text('subject'),
	message: text('message').notNull(),
	isRead: boolean('is_read').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// ─── Relations (for Drizzle relational queries) ───

export const churchesRelations = relations(churches, ({ many }) => ({
	churchPastors: many(churchPastors),
	events: many(events)
}));

export const pastorsRelations = relations(pastors, ({ many }) => ({
	churchPastors: many(churchPastors)
}));

export const churchPastorsRelations = relations(churchPastors, ({ one }) => ({
	church: one(churches, {
		fields: [churchPastors.churchId],
		references: [churches.id]
	}),
	pastor: one(pastors, {
		fields: [churchPastors.pastorId],
		references: [pastors.id]
	})
}));

export const eventsRelations = relations(events, ({ one }) => ({
	church: one(churches, {
		fields: [events.churchId],
		references: [churches.id]
	})
}));

export const galleriesRelations = relations(galleries, ({ many }) => ({
	images: many(galleryImages)
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
	gallery: one(galleries, {
		fields: [galleryImages.galleryId],
		references: [galleries.id]
	})
}));

// ─── TypeScript types matching existing frontend interfaces ───

export interface ArticleImage {
	url: string;
	alt: string;
	caption: string;
}

export type ContentBlock =
	| { type: 'paragraph'; text: string }
	| { type: 'heading'; text: string }
	| { type: 'quote'; text: string }
	| { type: 'image'; src: string; alt: string; caption: string }
	| { type: 'list'; items: string[] }
	| { type: 'imageCarousel' }
	| { type: 'social'; platform: string; url: string; label: string };

export interface ServiceSchedule {
	day: string;
	time: string;
	type: string;
}
