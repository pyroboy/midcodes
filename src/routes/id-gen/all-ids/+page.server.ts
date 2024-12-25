import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

interface IDCardField {
    value: string;
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
    id: null;
    template_name: null;
    front_image: null;
    back_image: null;
    created_at: null;
    fields: null;
}

interface DataRow {
    is_header: false;
    metadata: null;
    id: string;
    template_name: string;
    front_image: string | null;
    back_image: string | null;
    created_at: string;
    fields: {
        [fieldName: string]: IDCardField;
    };
}

type IDCardResponse = [HeaderRow, ...DataRow[]];

export const load = (async ({ locals: { supabase, safeGetSession, profile }, url }) => {
    const { session,roleEmulation } = await safeGetSession();
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    if (!profile) {
        throw error(400, 'Profile not found');
    }

    // Get the effective organization ID (either emulated or actual)
    const effectiveOrgId = roleEmulation?.active ? 
        roleEmulation.emulated_org_id : 
        profile.org_id;
    
    if (!effectiveOrgId) {
        throw error(500, 'Organization ID not found');
    }

    const userRole = profile.role;
    
    // Check role-specific access
    const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
    if (!allowedRoles.includes(userRole)) {
        throw redirect(303, '/unauthorized');
    }

    const { data, error: fetchError } = await supabase
        .rpc('get_idcards_by_org', {
            org_id: effectiveOrgId,
            page_limit: null,  // Fetch all records
            page_offset: 0
        });

    if (fetchError) {
        throw error(500, fetchError.message);
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
        throw error(404, 'No ID cards found');
    }

    // Validate that the response matches our expected type
    const [header, ...rows] = data as IDCardResponse;
    if (!header.is_header || !header.metadata) {
        throw error(500, 'Invalid response format');
    }

    return {
        idCards: data as IDCardResponse
    };
}) satisfies PageServerLoad;
