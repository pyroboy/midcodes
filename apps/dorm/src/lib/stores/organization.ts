import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Organization } from '$lib/types/database';

interface OrganizationStore {
	selectedId: string | null;
	current: Organization | null;
	organizations: Organization[];
}

const initialState: OrganizationStore = {
	selectedId: browser ? localStorage.getItem('selectedOrgId') : null,
	current: null,
	organizations: []
};

function createOrganizationStore() {
	const { subscribe, set, update }: Writable<OrganizationStore> = writable(initialState);

	return {
		subscribe,
		setSelected: (orgId: string | null) => {
			if (browser) {
				if (orgId) {
					localStorage.setItem('selectedOrgId', orgId);
				} else {
					localStorage.removeItem('selectedOrgId');
				}
			}
			update((state) => ({
				...state,
				selectedId: orgId,
				current: state.organizations.find((org) => org.id === orgId) || null
			}));
		},
		/**
		 * Load organizations from page data instead of querying directly.
		 * Organizations should be passed from the layout load function.
		 */
		setOrganizations: (organizations: Organization[]) => {
			update((state) => ({
				...state,
				organizations,
				current:
					organizations.find((org) => org.id === state.selectedId) || organizations[0] || null
			}));
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem('selectedOrgId');
			}
			set(initialState);
		}
	};
}

export const organizationStore = createOrganizationStore();
