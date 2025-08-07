import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Organization } from '$lib/types/database';
import { supabase } from '$lib/supabaseClient';

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
		loadOrganizations: async (profile: { role: string; org_id?: string | null }) => {
			let organizations: Organization[] = [];

			try {
				if (profile.role === 'super_admin') {
					const { data: orgs, error: orgsError } = await supabase
						.from('organizations')
						.select('*')
						.order('name');

					if (orgsError) throw orgsError;
					organizations = orgs || [];
				} else if (profile.role === 'org_admin' && profile.org_id) {
					const { data: org, error: orgError } = await supabase
						.from('organizations')
						.select('*')
						.eq('id', profile.org_id)
						.single();

					if (orgError) throw orgError;
					organizations = org ? [org] : [];
				}

				update((state) => ({
					...state,
					organizations,
					current:
						organizations.find((org) => org.id === state.selectedId) || organizations[0] || null
				}));

				return organizations;
			} catch (error) {
				console.error('Error loading organizations:', error);
				update((state) => ({ ...state, organizations: [], current: null }));
				return [];
			}
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
