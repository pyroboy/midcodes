import type { EmployeeRole } from '$lib/types';

// Shared reactive role state — set by the protected layout, read by all pages
let currentRole = $state<EmployeeRole>('admin');

export const roleStore = {
	get role() { return currentRole; },
	set role(value: EmployeeRole) { currentRole = value; }
};
