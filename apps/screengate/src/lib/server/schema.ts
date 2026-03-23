import { pgTable, text, timestamp, uuid, pgEnum, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────
export const personTypeEnum = pgEnum('person_type', ['student', 'employee']);
export const contactRelationEnum = pgEnum('contact_relation', ['mother', 'father', 'guardian']);

// ─── Better Auth tables ──────────────────────────────────
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: text('role').default('user'),
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

export const people = pgTable('people', {
	id: uuid('id').defaultRandom().primaryKey(),
	idNumber: text('id_number').notNull().unique(),
	fullName: text('full_name').notNull(),
	photoUrl: text('photo_url'),
	type: personTypeEnum('type').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const grades = pgTable('grades', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const students = pgTable('students', {
	id: uuid('id').defaultRandom().primaryKey(),
	personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
	gradeId: uuid('grade_id').notNull().references(() => grades.id, { onDelete: 'restrict' })
});

export const employees = pgTable('employees', {
	id: uuid('id').defaultRandom().primaryKey(),
	personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
	position: text('position').notNull()
});

export const contacts = pgTable('contacts', {
	id: uuid('id').defaultRandom().primaryKey(),
	personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
	relation: contactRelationEnum('relation').notNull(),
	fullName: text('full_name').notNull(),
	phoneNumber: text('phone_number').notNull()
});

export const scans = pgTable('scans', {
	id: uuid('id').defaultRandom().primaryKey(),
	personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
	anomalyData: text('anomaly_data'),
	scannedAt: timestamp('scanned_at').defaultNow().notNull()
});

// ─── Relations ───────────────────────────────────────────

export const peopleRelations = relations(people, ({ many, one }) => ({
	student: one(students, { fields: [people.id], references: [students.personId] }),
	employee: one(employees, { fields: [people.id], references: [employees.personId] }),
	contacts: many(contacts),
	scans: many(scans)
}));

export const gradesRelations = relations(grades, ({ many }) => ({
	students: many(students)
}));

export const studentsRelations = relations(students, ({ one }) => ({
	person: one(people, { fields: [students.personId], references: [people.id] }),
	grade: one(grades, { fields: [students.gradeId], references: [grades.id] })
}));

export const employeesRelations = relations(employees, ({ one }) => ({
	person: one(people, { fields: [employees.personId], references: [people.id] })
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
	person: one(people, { fields: [contacts.personId], references: [people.id] })
}));

export const scansRelations = relations(scans, ({ one }) => ({
	person: one(people, { fields: [scans.personId], references: [people.id] })
}));
