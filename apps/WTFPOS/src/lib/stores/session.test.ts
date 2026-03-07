import { describe, it, expect } from 'vitest';
import {
	ELEVATED_ROLES,
	ADMIN_ROLES,
	ROLE_NAV_ACCESS,
	LOCATIONS,
	deriveSessionState
} from './session.svelte';

describe('RBAC constants', () => {
	it('ELEVATED_ROLES includes owner, admin, manager', () => {
		expect(ELEVATED_ROLES).toContain('owner');
		expect(ELEVATED_ROLES).toContain('admin');
		expect(ELEVATED_ROLES).toContain('manager');
	});

	it('ELEVATED_ROLES does not include staff or kitchen', () => {
		expect(ELEVATED_ROLES).not.toContain('staff');
		expect(ELEVATED_ROLES).not.toContain('kitchen');
	});

	it('ADMIN_ROLES includes owner and admin only', () => {
		expect(ADMIN_ROLES).toContain('owner');
		expect(ADMIN_ROLES).toContain('admin');
		expect(ADMIN_ROLES).not.toContain('manager');
		expect(ADMIN_ROLES).not.toContain('staff');
	});

	it('ADMIN_ROLES is a subset of ELEVATED_ROLES', () => {
		for (const role of ADMIN_ROLES) {
			expect(ELEVATED_ROLES).toContain(role);
		}
	});
});

describe('ROLE_NAV_ACCESS', () => {
	it('staff can only access /pos', () => {
		expect(ROLE_NAV_ACCESS.staff).toEqual(['/pos']);
	});

	it('kitchen can access /kitchen and /stock but not /pos', () => {
		expect(ROLE_NAV_ACCESS.kitchen).toContain('/kitchen');
		expect(ROLE_NAV_ACCESS.kitchen).toContain('/stock');
		expect(ROLE_NAV_ACCESS.kitchen).not.toContain('/pos');
	});

	it('manager cannot access /admin', () => {
		expect(ROLE_NAV_ACCESS.manager).not.toContain('/admin');
	});

	it('owner and admin can access /admin', () => {
		expect(ROLE_NAV_ACCESS.owner).toContain('/admin');
		expect(ROLE_NAV_ACCESS.admin).toContain('/admin');
	});

	it('every role has at least one route', () => {
		for (const [role, routes] of Object.entries(ROLE_NAV_ACCESS)) {
			expect(routes.length, `${role} has no routes`).toBeGreaterThan(0);
		}
	});
});

describe('LOCATIONS', () => {
	it('includes tag, pgl, wh-tag, and all', () => {
		const ids = LOCATIONS.map(l => l.id);
		expect(ids).toContain('tag');
		expect(ids).toContain('pgl');
		expect(ids).toContain('wh-tag');
		expect(ids).toContain('all');
	});

	it('wh-tag is a warehouse type', () => {
		const wh = LOCATIONS.find(l => l.id === 'wh-tag');
		expect(wh?.type).toBe('warehouse');
	});

	it('retail locations are tag and pgl', () => {
		const retail = LOCATIONS.filter(l => l.type === 'retail').map(l => l.id);
		expect(retail).toContain('tag');
		expect(retail).toContain('pgl');
	});

	it('every location has a name', () => {
		for (const loc of LOCATIONS) {
			expect(loc.name, `name missing on ${loc.id}`).toBeTruthy();
		}
	});
});

describe('deriveSessionState', () => {
	it('locks staff to their assigned location', () => {
		const result = deriveSessionState('staff', 'tag');
		expect(result.isLocked).toBe(true);
		expect(result.resolvedLocationId).toBe('tag');
	});

	it('locks kitchen to their assigned location', () => {
		const result = deriveSessionState('kitchen', 'pgl');
		expect(result.isLocked).toBe(true);
		expect(result.resolvedLocationId).toBe('pgl');
	});

	it('staff with locationId="all" falls back to tag', () => {
		const result = deriveSessionState('staff', 'all');
		expect(result.isLocked).toBe(true);
		expect(result.resolvedLocationId).toBe('tag');
	});

	it('owner is not locked and can be set to "all"', () => {
		const result = deriveSessionState('owner', 'all');
		expect(result.isLocked).toBe(false);
		expect(result.resolvedLocationId).toBe('all');
	});

	it('admin is not locked', () => {
		const result = deriveSessionState('admin', 'wh-tag');
		expect(result.isLocked).toBe(false);
		expect(result.resolvedLocationId).toBe('wh-tag');
	});

	it('manager is not locked and can switch locations freely', () => {
		const result = deriveSessionState('manager', 'pgl');
		expect(result.isLocked).toBe(false);
		expect(result.resolvedLocationId).toBe('pgl');
	});

	it('manager can be set to "all"', () => {
		const result = deriveSessionState('manager', 'all');
		expect(result.isLocked).toBe(false);
		expect(result.resolvedLocationId).toBe('all');
	});
});
