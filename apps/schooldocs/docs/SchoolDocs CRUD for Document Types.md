schooldocs/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.svelte       # Reusable button component
│   │   │   │   ├── Input.svelte        # Form input component
│   │   │   │   ├── Select.svelte       # Dropdown component
│   │   │   │   ├── Table.svelte        # Data table component
│   │   │   │   └── Toast.svelte        # Notification component
│   │   │   └── document-types/
│   │   │       ├── DocumentTypeForm.svelte    # Shared form for create/edit
│   │   │       ├── DocumentTypeList.svelte    # List view component
│   │   │       ├── DocumentTypeCard.svelte    # Individual document display
│   │   │       ├── DocumentTypeFilters.svelte # Search and filter controls
│   │   │       └── StatusBadge.svelte        # Status indicator
│   │   ├── stores/
│   │   │   ├── mockDocumentTypes.ts    # Mock data store
│   │   │   └── toast.ts               # Notification store
│   │   ├── types/
│   │   │   └── document-types.ts      # TypeScript interfaces
│   │   └── utils/
│   │       ├── formatCurrency.ts      # Price formatting
│   │       └── validateForm.ts        # Form validation
│   └── routes/
│       └── admin/
│           └── document-types/
│               ├── +page.svelte       # List view
│               ├── +page.ts           # Load data
│               ├── new/
│               │   └── +page.svelte   # Create using shared form
│               └── [id]/
│                   ├── +page.svelte   # Edit using shared form
│                   └── +page.ts       # Load document data

// Key Implementation Files:

// src/lib/types/document-types.ts
export interface DocumentType {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    price: number;
    processing_time_hours: number;
    requirements: string[];
    max_copies: number;
    purpose_required: boolean;
    status: 'active' | 'inactive' | 'archived';
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// src/lib/stores/mockDocumentTypes.ts
import { writable } from 'svelte/store';

const mockData: DocumentType[] = [
    {
        id: '1',
        organization_id: 'org1',
        name: 'Transcript of Records',
        description: 'Official transcript of academic records',
        price: 500.00,
        processing_time_hours: 72,
        requirements: ['Valid ID', 'Clearance Form'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

function createDocumentTypeStore() {
    const { subscribe, set, update } = writable<DocumentType[]>(mockData);

    return {
        subscribe,
        getAll: () => mockData,
        getById: (id: string) => mockData.find(doc => doc.id === id),
        addDocumentType: (doc: Omit<DocumentType, 'id' | 'created_at' | 'updated_at'>) => {
            const newDoc = {
                ...doc,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            update(docs => [...docs, newDoc]);
            return newDoc;
        },
        updateDocumentType: (id: string, updates: Partial<DocumentType>) => {
            update(docs => docs.map(doc => 
                doc.id === id 
                    ? { ...doc, ...updates, updated_at: new Date().toISOString() } 
                    : doc
            ));
        },
        deleteDocumentType: (id: string) => {
            update(docs => docs.filter(doc => doc.id !== id));
        }
    };
}

export const documentTypes = createDocumentTypeStore();

// src/lib/components/document-types/DocumentTypeForm.svelte
<script lang="ts">
    import type { DocumentType } from '$lib/types/document-types';
    import { documentTypes } from '$lib/stores/mockDocumentTypes';
    
    export let documentType: Partial<DocumentType> = {
        name: '',
        description: '',
        price: 0,
        processing_time_hours: 24,
        requirements: [],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {}
    };
    
    let requirementsString = documentType.requirements?.join(', ') || '';
    let successMessage = '';
    
    function handleSubmit() {
        const formData = {
            ...documentType,
            requirements: requirementsString.split(',').map(r => r.trim()),
            price: Number(documentType.price),
            processing_time_hours: Number(documentType.processing_time_hours),
            max_copies: Number(documentType.max_copies)
        };
        
        if (documentType.id) {
            documentTypes.updateDocumentType(documentType.id, formData);
        } else {
            documentTypes.addDocumentType(formData);
        }
        
        successMessage = `Document type ${documentType.id ? 'updated' : 'created'} successfully`;
        setTimeout(() => successMessage = '', 3000);
    }
</script>

<div class="container mx-auto p-4">
    <form on:submit|preventDefault={handleSubmit} class="space-y-4 max-w-2xl">
        <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
                type="text"
                id="name"
                bind:value={documentType.name}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
            />
        </div>

        <!-- Add other form fields similarly -->

        <div class="flex justify-end space-x-3">
            <a href="/admin/document-types" 
               class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Cancel
            </a>
            <button type="submit" 
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                {documentType.id ? 'Save Changes' : 'Create Document Type'}
            </button>
        </div>
    </form>
</div>

// Routes Implementation:

// src/routes/admin/document-types/+page.ts
import type { PageLoad } from './$types';
import { documentTypes } from '$lib/stores/mockDocumentTypes';

export const load: PageLoad = () => ({
    documentTypes: documentTypes.getAll()
});

// src/routes/admin/document-types/new/+page.svelte
<script lang="ts">
    import DocumentTypeForm from '$lib/components/document-types/DocumentTypeForm.svelte';
</script>

<div class="mb-6">
    <h1 class="text-2xl font-bold">Create Document Type</h1>
    <a href="/admin/document-types" class="text-blue-500 hover:text-blue-700">← Back to Document Types</a>
</div>

<DocumentTypeForm />

// src/routes/admin/document-types/[id]/+page.ts
import { error } from '@sveltejs/kit';
import { documentTypes } from '$lib/stores/mockDocumentTypes';

export const load = ({ params }) => {
    const documentType = documentTypes.getById(params.id);
    if (!documentType) throw error(404, 'Document type not found');
    return { documentType };
};

// src/routes/admin/document-types/[id]/+page.svelte
<script lang="ts">
    import DocumentTypeForm from '$lib/components/document-types/DocumentTypeForm.svelte';
    export let data;
</script>

<div class="mb-6">
    <h1 class="text-2xl font-bold">Edit Document Type</h1>
    <a href="/admin/document-types" class="text-blue-500 hover:text-blue-700">← Back to Document Types</a>
</div>

<DocumentTypeForm documentType={data.documentType} />