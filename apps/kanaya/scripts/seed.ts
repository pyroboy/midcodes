import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/schema';
import {
	rolePermissions,
	templateSizePresets,
	orgSettings,
	organizations
} from '../src/lib/server/schema';
import { eq } from 'drizzle-orm';

// Setup DB connection locally
if (!process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL) {
	throw new Error('NEON_DATABASE_URL or DATABASE_URL is not set in environment');
}
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

const PERMISSIONS = {
	super_admin: [
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
	],
	org_admin: [
		'payments.read',
		'payments.update',
		'payment_schedules.read',
		'meters.read',
		'readings.read',
		'events.create',
		'events.read',
		'events.update',
		'attendees.create',
		'attendees.read',
		'attendees.update',
		'attendees.check_qr',
		'templates.create',
		'templates.read',
		'templates.update',
		'idcards.create',
		'idcards.read',
		'idcards.update',
		'idcards.delete',
		'organizations.read',
		'organizations.update',
		'profiles.read',
		'profiles.update',
		'bookings.read',
		'bookings.update'
	],
	id_gen_admin: [
		'templates.create',
		'templates.read',
		'templates.update',
		'templates.delete',
		'idcards.create',
		'idcards.read',
		'idcards.update',
		'idcards.delete',
		'profiles.read',
		'profiles.update'
	],
	id_gen_user: [
		'templates.read',
		'idcards.create',
		'idcards.read',
		'idcards.update',
		'profiles.read',
		'profiles.update'
	],
	user: ['events.read', 'attendees.read', 'bookings.read']
};

const SIZE_PRESETS = [
	{
		name: 'CR80 (ATM Size)',
		slug: 'cr80',
		widthInches: '3.375',
		heightInches: '2.125',
		widthMm: '85.60',
		heightMm: '53.98',
		widthPixels: 1013,
		heightPixels: 638,
		dpi: 300,
		aspectRatio: '1.5882',
		description: 'Standard credit card size, used for most ID cards.',
		sortOrder: 1
	},
	{
		name: 'Business Card',
		slug: 'business_card',
		widthInches: '3.5',
		heightInches: '2.0',
		widthMm: '89.00',
		heightMm: '51.00',
		widthPixels: 1050,
		heightPixels: 600,
		dpi: 300,
		aspectRatio: '1.7500',
		description: 'Standard business card size.',
		sortOrder: 2
	},
	{
		name: 'Event Badge (Std)',
		slug: 'event_badge_std',
		widthInches: '4.0',
		heightInches: '3.0',
		widthMm: '101.60',
		heightMm: '76.20',
		widthPixels: 1200,
		heightPixels: 900,
		dpi: 300,
		aspectRatio: '1.3333',
		description: 'Standard event badge size.',
		sortOrder: 3
	},
	{
		name: 'Event Badge (Lg)',
		slug: 'event_badge_lg',
		widthInches: '6.0',
		heightInches: '4.0',
		widthMm: '152.40',
		heightMm: '101.60',
		widthPixels: 1800,
		heightPixels: 1200,
		dpi: 300,
		aspectRatio: '1.5000',
		description: 'Large event badge size.',
		sortOrder: 4
	},
	{
		name: 'Name Tag (Pin)',
		slug: 'name_tag',
		widthInches: '3.0',
		heightInches: '1.0',
		widthMm: '76.20',
		heightMm: '25.40',
		widthPixels: 900,
		heightPixels: 300,
		dpi: 300,
		aspectRatio: '3.0000',
		description: 'Standard name tag size.',
		sortOrder: 5
	}
];

async function seed() {
	console.log('🌱 Starting seed...');

	try {
		// 1. Roles & Permissions
		console.log('Syncing Role Permissions...');

		for (const [role, permissions] of Object.entries(PERMISSIONS)) {
			for (const permission of permissions) {
				const check = await db.query.rolePermissions.findFirst({
					where: (rp, { and, eq }) =>
						and(eq(rp.role, role as any), eq(rp.permission, permission as any))
				});

				if (!check) {
					await db.insert(rolePermissions).values({
						role: role as any,
						permission: permission as any
					});
				}
			}
		}
		console.log('✅ Role Permissions synced.');

		// 2. Template Size Presets
		console.log('Syncing Template Size Presets...');
		for (const preset of SIZE_PRESETS) {
			await db
				.insert(templateSizePresets)
				.values(preset as any)
				.onConflictDoUpdate({
					target: templateSizePresets.slug,
					set: preset
				});
		}
		console.log('✅ Template Size Presets synced.');

		// 3. Organization: "MidCodes"
		const midCodesOrg = await db.query.organizations.findFirst({
			where: (org, { eq }) => eq(org.name, 'MidCodes')
		});

		if (!midCodesOrg) {
			console.log('Creating "MidCodes" organization...');
			const [newOrg] = await db
				.insert(organizations)
				.values({
					name: 'MidCodes'
				})
				.returning();

			// Initialize settings
			if (newOrg) {
				await db.insert(orgSettings).values({
					orgId: newOrg.id,
					paymentsEnabled: true
				});
			}
			console.log('✅ "MidCodes" Organization created.');
		} else {
			console.log('ℹ️ "MidCodes" Organization already exists.');
		}

		console.log('🎉 Seed completed successfully!');
		process.exit(0);
	} catch (e) {
		console.error('❌ Seed failed:', e);
		process.exit(1);
	}
}

seed();
