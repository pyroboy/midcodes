import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import {
	tenantFormSchema,
	tenantResponseSchema,
	type EmergencyContact,
	parseEmergencyContactFromForm
} from './formSchema';
import type { TenantResponse } from '$lib/types/tenant';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import { tenants, leaseTenants, leases, rentalUnit, properties } from '$lib/server/schema';
import { eq, and, asc, ne, isNull, ilike, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, depends }) => {
	const { user, permissions } = locals;
	if (!permissions.includes('tenants.read')) throw error(401, 'Unauthorized');

	// Set up dependencies for invalidation
	depends('app:tenants');

	// Return minimal data for instant navigation
	return {
		tenants: [],
		properties: [],
		form: await superValidate(zod(tenantFormSchema)),
		lazy: true,
		tenantsPromise: loadTenantsData(),
		propertiesPromise: loadPropertiesData()
	};
};

async function loadTenantsData() {
	const cacheKey = cacheKeys.tenants();
	const cached = cache.get<TenantResponse[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached tenants data');
		return cached;
	}

	console.log('CACHE MISS: Fetching tenants from database');

	// Fetch all non-deleted tenants
	const tenantsData = await db
		.select()
		.from(tenants)
		.where(isNull(tenants.deletedAt))
		.orderBy(asc(tenants.name));

	// Fetch lease-tenant relationships with lease and rental unit data
	const leaseTenantsData = await db
		.select({
			tenantId: leaseTenants.tenantId,
			leaseId: leases.id,
			leaseName: leases.name,
			leaseStartDate: leases.startDate,
			leaseEndDate: leases.endDate,
			leaseStatus: leases.status,
			unitId: rentalUnit.id,
			unitName: rentalUnit.name,
			unitNumber: rentalUnit.number,
			unitBaseRate: rentalUnit.baseRate,
			propertyId: properties.id,
			propertyName: properties.name
		})
		.from(leaseTenants)
		.innerJoin(leases, eq(leaseTenants.leaseId, leases.id))
		.leftJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
		.leftJoin(properties, eq(rentalUnit.propertyId, properties.id));

	// Build tenant -> leases map
	const tenantLeasesMap = new Map<number, any[]>();
	for (const lt of leaseTenantsData) {
		if (!tenantLeasesMap.has(lt.tenantId)) tenantLeasesMap.set(lt.tenantId, []);
		tenantLeasesMap.get(lt.tenantId)!.push({
			id: lt.leaseId,
			name: lt.leaseName,
			start_date: lt.leaseStartDate,
			end_date: lt.leaseEndDate,
			status: lt.leaseStatus,
			rental_unit: lt.unitId
				? {
						id: lt.unitId,
						name: lt.unitName,
						number: lt.unitNumber,
						property: lt.propertyId ? { id: lt.propertyId, name: lt.propertyName } : null
					}
				: null
		});
	}

	// Process tenants with lease info
	const processedTenants = tenantsData.map((tenant) => {
		const tenantLeases = tenantLeasesMap.get(tenant.id) || [];
		const primaryLease =
			tenantLeases.find((l: any) => l.status === 'ACTIVE') || tenantLeases[0] || null;

		return {
			...tenant,
			leases: tenantLeases,
			lease: primaryLease
		};
	}) as TenantResponse[];

	console.log(`Processed ${processedTenants.length} tenants with status breakdown:`, {
		active: processedTenants.filter((t) => t.tenant_status === 'ACTIVE').length,
		inactive: processedTenants.filter((t) => t.tenant_status === 'INACTIVE').length,
		pending: processedTenants.filter((t) => t.tenant_status === 'PENDING').length,
		blacklisted: processedTenants.filter((t) => t.tenant_status === 'BLACKLISTED').length
	});

	cache.set(cacheKey, processedTenants, CACHE_TTL.MEDIUM);
	console.log('Cached tenants data');

	return processedTenants;
}

async function loadPropertiesData() {
	const cacheKey = cacheKeys.activeProperties();
	const cached = cache.get<any[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached properties data');
		return cached;
	}

	console.log('CACHE MISS: Fetching properties from database');
	const propertiesData = await db
		.select({ id: properties.id, name: properties.name })
		.from(properties)
		.where(eq(properties.status, 'ACTIVE'))
		.orderBy(asc(properties.name));

	cache.set(cacheKey, propertiesData, CACHE_TTL.LONG);
	console.log('Cached properties data');

	return propertiesData;
}

// Base tenant insert type
type TenantInsertBase = {
	name: string;
	contactNumber: string | null;
	email: string | null;
	address: string | null;
	tenantStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
	emergencyContact: EmergencyContact | null;
	profilePictureUrl?: string | null;
	schoolOrWorkplace: string | null;
	facebookName: string | null;
	birthday: string | null;
};

type TenantUpdate = Partial<TenantInsertBase & { updatedAt: Date }>;

export const actions: Actions = {
	create: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(tenantFormSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		console.log('Create action - Received form data:', form.data);

		const parsedEmergencyContact = parseEmergencyContactFromForm(form.data);

		// Check for duplicate email if provided (excluding soft-deleted tenants)
		if (form.data.email && form.data.email.trim() !== '') {
			const existingTenant = await db
				.select({ id: tenants.id })
				.from(tenants)
				.where(
					and(
						eq(tenants.email, form.data.email.trim()),
						isNull(tenants.deletedAt)
					)
				)
				.limit(1);

			if (existingTenant.length > 0) {
				form.errors.email = ['A tenant with this email already exists'];
				return fail(400, {
					form,
					message: 'Duplicate email found: A tenant with this email already exists'
				});
			}
		}

		// Safeguard: prevent exact-name duplicates without distinct contact details
		const normalizedName = form.data.name.trim();
		const normalizedEmail = form.data.email?.trim().toLowerCase() || null;
		const normalizedContact = form.data.contact_number?.trim() || null;

		const possibleDuplicates = await db
			.select({ id: tenants.id, name: tenants.name, email: tenants.email, contactNumber: tenants.contactNumber })
			.from(tenants)
			.where(
				and(
					ilike(tenants.name, normalizedName),
					isNull(tenants.deletedAt)
				)
			);

		if (possibleDuplicates.length > 0) {
			const conflict = possibleDuplicates.find((t) => {
				const tEmail = (t.email || '').trim().toLowerCase() || null;
				const tContact = (t.contactNumber || '').trim() || null;
				const sameEmail =
					normalizedEmail && tEmail
						? normalizedEmail === tEmail
						: !normalizedEmail && !tEmail;
				const sameContact =
					normalizedContact && tContact
						? normalizedContact === tContact
						: !normalizedContact && !tContact;
				return sameEmail || sameContact;
			});

			if (conflict) {
				form.errors.name = [
					'A tenant with this name already exists without distinct contact details'
				];
				return fail(400, {
					form,
					message: 'Duplicate tenant: provide distinct email or contact number'
				});
			}
		}

		try {
			await db.insert(tenants).values({
				name: form.data.name,
				contactNumber: form.data.contact_number || null,
				email: form.data.email && form.data.email.trim() !== '' ? form.data.email : null,
				address: form.data.address ?? null,
				tenantStatus: form.data.tenant_status || 'PENDING',
				emergencyContact: parsedEmergencyContact,
				profilePictureUrl: form.data.profile_picture_url || null,
				schoolOrWorkplace: form.data.school_or_workplace ?? null,
				facebookName: form.data.facebook_name ?? null,
				birthday: form.data.birthday ?? null
			});
		} catch (err: any) {
			console.error('Failed to create tenant:', err);
			if (err.message?.includes('Policy check failed')) {
				form.errors._errors = ['You do not have permission to create tenants'];
				return fail(403, { form });
			}
			form.errors._errors = ['Failed to create tenant'];
			return fail(500, { form });
		}

		console.log('Create action - Successfully created tenant');

		cache.delete(cacheKeys.tenants());
		console.log('Invalidated tenants cache');

		return { form };
	},

	update: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(tenantFormSchema));
		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const parsedEmergencyContact = parseEmergencyContactFromForm(form.data);

		// Check for duplicate email, excluding current tenant
		if (form.data.email && form.data.email.trim() !== '') {
			const existingTenant = await db
				.select({ id: tenants.id })
				.from(tenants)
				.where(
					and(
						eq(tenants.email, form.data.email.trim()),
						ne(tenants.id, form.data.id),
						isNull(tenants.deletedAt)
					)
				)
				.limit(1);

			if (existingTenant.length > 0) {
				form.errors.email = ['A tenant with this email already exists'];
				return fail(400, {
					form,
					message: 'Duplicate email found: A tenant with this email already exists'
				});
			}
		}

		// Safeguard: prevent exact-name duplicates (exclude self)
		const normalizedNameU = form.data.name.trim();
		const normalizedEmailU = form.data.email?.trim().toLowerCase() || null;
		const normalizedContactU = form.data.contact_number?.trim() || null;

		const possibleDuplicatesU = await db
			.select({ id: tenants.id, name: tenants.name, email: tenants.email, contactNumber: tenants.contactNumber })
			.from(tenants)
			.where(
				and(
					ilike(tenants.name, normalizedNameU),
					ne(tenants.id, form.data.id),
					isNull(tenants.deletedAt)
				)
			);

		if (possibleDuplicatesU.length > 0) {
			const conflict = possibleDuplicatesU.find((t) => {
				const tEmail = (t.email || '').trim().toLowerCase() || null;
				const tContact = (t.contactNumber || '').trim() || null;
				const sameEmail =
					normalizedEmailU && tEmail
						? normalizedEmailU === tEmail
						: !normalizedEmailU && !tEmail;
				const sameContact =
					normalizedContactU && tContact
						? normalizedContactU === tContact
						: !normalizedContactU && !tContact;
				return sameEmail || sameContact;
			});

			if (conflict) {
				form.errors.name = [
					'A tenant with this name already exists without distinct contact details'
				];
				return fail(400, {
					form,
					message: 'Duplicate tenant: provide distinct email or contact number'
				});
			}
		}

		try {
			await db
				.update(tenants)
				.set({
					name: form.data.name,
					contactNumber: form.data.contact_number || null,
					email:
						form.data.email && form.data.email.trim() !== '' ? form.data.email : null,
					address: form.data.address ?? null,
					tenantStatus: form.data.tenant_status,
					emergencyContact: parsedEmergencyContact,
					updatedAt: new Date(),
					profilePictureUrl: form.data.profile_picture_url || null,
					schoolOrWorkplace: form.data.school_or_workplace ?? null,
					facebookName: form.data.facebook_name ?? null,
					birthday: form.data.birthday ?? null
				})
				.where(eq(tenants.id, form.data.id));
		} catch (err: any) {
			console.error('Error updating tenant:', err);
			if (err.message?.includes('Policy check failed')) {
				form.errors._errors = ['You do not have permission to update tenants'];
				return fail(403, { form });
			}
			return fail(500, { form, message: 'Failed to update tenant' });
		}

		console.log('Update action - Successfully updated tenant');

		cache.delete(cacheKeys.tenants());
		console.log('Invalidated tenants cache');

		return { form };
	},

	delete: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const reason = formData.get('reason') || 'User initiated deletion';

		if (!id || typeof id !== 'string') {
			return fail(400, { message: 'Invalid tenant ID' });
		}

		const tenantId = parseInt(id, 10);
		if (isNaN(tenantId)) {
			return fail(400, { message: 'Invalid tenant ID format' });
		}

		// Get tenant details for confirmation message
		const tenantResult = await db
			.select({ name: tenants.name, email: tenants.email, contactNumber: tenants.contactNumber })
			.from(tenants)
			.where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
			.limit(1);

		const tenant = tenantResult[0];

		if (!tenant) {
			return fail(404, { message: 'Tenant not found or already deleted' });
		}

		// Soft delete by setting deleted_at timestamp
		try {
			await db
				.update(tenants)
				.set({
					deletedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(tenants.id, tenantId));
		} catch (err: any) {
			console.error('Error soft deleting tenant:', err);
			if (err.message?.includes('Policy check failed')) {
				return fail(403, { message: 'You do not have permission to delete tenants' });
			}
			return fail(500, { message: 'Failed to delete tenant' });
		}

		cache.delete(cacheKeys.tenants());
		console.log('Invalidated tenants cache');

		return {
			success: true,
			message: `Tenant "${tenant.name}" has been successfully archived. All data has been preserved for audit purposes.`
		};
	}
};
