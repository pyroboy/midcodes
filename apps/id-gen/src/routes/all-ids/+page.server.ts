import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

interface IDCardField {
    value: string | null;
    side: 'front' | 'back';
}

interface TemplateVariable {
    variableName: string;
    side: 'front' | 'back';
}

interface PaginationInfo {
    total_records: number;
    current_offset: number;
    limit: number | null;
}

interface Metadata {
    organization_name: string;
    templates: {
        [templateName: string]: TemplateVariable[];
    };
    pagination: PaginationInfo;
}

export interface IDCard {
    idcard_id: string;
    template_name: string;
    front_image: string | null;
    back_image: string | null;
    created_at: string;
    fields: {
        [fieldName: string]: IDCardField;
    };
}

interface IDCardResponse {
    metadata: Metadata;
    idcards: IDCard[];
}

export const load = (async ({ locals }) => {
    const { session, supabase, org_id } = locals;
    if (!session) throw error(401, 'Unauthorized');
    if (!org_id) throw error(403, 'No organization context found');

    const { data, error: fetchError } = await supabase
        .rpc('get_idcards_by_org', {
            org_id: org_id,
            page_limit: null,
            page_offset: 0
        });

    if (fetchError) throw error(500, fetchError.message);
    if (!data) throw error(404, 'No ID cards found');

    // Type guard for the response structure
    const response = data as IDCardResponse;
    if (
        !response.metadata?.organization_name ||
        !Array.isArray(response.idcards) ||
        !response.metadata.templates ||
        !response.metadata.pagination
    ) {
        throw error(500, 'Invalid API response format');
    }

    return {
        idCards: response.idcards,
        metadata: response.metadata,
    };
}) satisfies PageServerLoad;