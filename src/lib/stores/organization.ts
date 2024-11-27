import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Organization } from '$lib/types/database';

interface OrganizationStore {
    selectedId: string | null;
    current: Organization | null;
}

const initialState: OrganizationStore = {
    selectedId: browser ? localStorage.getItem('selectedOrgId') : null,
    current: null
};

function createOrganizationStore() {
    const { subscribe, set, update }: Writable<OrganizationStore> = writable(initialState);

    return {
        subscribe,
        setSelected: (orgId: string | null) => {
            update(state => {
                if (browser) {
                    if (orgId) {
                        localStorage.setItem('selectedOrgId', orgId);
                    } else {
                        localStorage.removeItem('selectedOrgId');
                    }
                }
                return { ...state, selectedId: orgId };
            });
        },
        setCurrent: (org: Organization | null) => {
            update(state => ({ ...state, current: org }));
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
