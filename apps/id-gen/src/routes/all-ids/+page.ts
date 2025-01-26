import type { PageLoad } from './$types';

export const load = (async ({ data }) => {
    return {
        ...data,
        title: 'Generated ID Cards',
        description: 'View and manage your generated ID cards'
    };
}) satisfies PageLoad;
