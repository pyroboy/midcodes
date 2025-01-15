// @ts-nocheck
import type { PageLoad, PageData } from './$types';

export const load = async ({ data }: { data: PageData }) => {
    return {
        ...data
    };
};
;null as any as PageLoad;