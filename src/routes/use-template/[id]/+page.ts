import type { PageLoad, PageData } from './$types';

export const load: PageLoad = async ({ data }: { data: PageData }) => {
    return {
        ...data
    };
};
