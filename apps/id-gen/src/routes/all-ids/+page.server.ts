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

interface HeaderMetadata {
    organization_name: string;
    templates: {
        [templateName: string]: TemplateVariable[];
    };
    pagination: PaginationInfo;
}

interface HeaderRow {
    is_header: true;
    metadata: HeaderMetadata;
    idcard_id: null;
    template_name: null;
    front_image: null;
    back_image: null;
    created_at: null;
    fields: null;
}

interface DataRow {
    is_header: false;
    metadata: null;
    idcard_id: string;
    template_name: string;
    front_image: string | null;
    back_image: string | null;
    created_at: string;
    fields: {
        [fieldName: string]: IDCardField;
    };
}

type IDCardResponse = [HeaderRow, ...DataRow[]];

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
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw error(404, 'No ID cards found');
    }

    // Validate response structure
    const [header, ...rows] = data;
    if (
        !header?.is_header ||
        !header.metadata ||
        header.idcard_id !== null ||
        !rows.every(row => 
            !row.is_header &&
            typeof row.idcard_id === 'string' &&
            typeof row.template_name === 'string'
        )
    ) {
        throw error(500, 'Invalid API response format');
    }

    return {
        idCards: data as IDCardResponse,
        organizationName: header.metadata.organization_name,
        pagination: header.metadata.pagination
    };
}) satisfies PageServerLoad;