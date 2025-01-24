import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { documentTypes } from '$lib/stores/mockDocumentTypes';

export const load = (async ({ params, parent }) => {
    const documentType = documentTypes.getById(params.id);
    
    if (!documentType) {
        throw error(404, 'Document type not found');
    }

    return {
        documentType,

    };
}) 
