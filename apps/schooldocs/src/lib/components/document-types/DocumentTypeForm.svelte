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
        status: 'active' as const,
        metadata: {}
    };
    
    let requirementsString = documentType.requirements?.join(', ') || '';
    let successMessage = '';
    
    function handleSubmit() {
        const formData = {
            name: documentType.name || '',
            description: documentType.description || null,
            price: Number(documentType.price),
            processing_time_hours: Number(documentType.processing_time_hours),
            requirements: requirementsString.split(',').map(r => r.trim()).filter(Boolean),
            max_copies: Number(documentType.max_copies),
            purpose_required: documentType.purpose_required || false,
            status: documentType.status || 'active',
            metadata: documentType.metadata || {}
        };
        
        if (documentType.id) {
            documentTypes.updateDocumentType(documentType.id, formData);
            successMessage = 'Document type updated successfully!';
        } else {
            const newDoc = documentTypes.addDocumentType(formData);
            successMessage = 'Document type created successfully!';
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if successMessage}
        <div class="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
            {successMessage}
        </div>
    {/if}

    <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" id="name" bind:value={documentType.name} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    </div>

    <div>
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" bind:value={documentType.description} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
    </div>

    <div>
        <label for="price" class="block text-sm font-medium text-gray-700">Price</label>
        <input type="number" id="price" bind:value={documentType.price} required min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    </div>

    <div>
        <label for="processing_time_hours" class="block text-sm font-medium text-gray-700">Processing Time (hours)</label>
        <input type="number" id="processing_time_hours" bind:value={documentType.processing_time_hours} required min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    </div>

    <div>
        <label for="requirements" class="block text-sm font-medium text-gray-700">Requirements (comma-separated)</label>
        <input type="text" id="requirements" bind:value={requirementsString} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    </div>

    <div>
        <label for="max_copies" class="block text-sm font-medium text-gray-700">Maximum Copies</label>
        <input type="number" id="max_copies" bind:value={documentType.max_copies} required min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    </div>

    <div class="flex items-center">
        <input type="checkbox" id="purpose_required" bind:checked={documentType.purpose_required} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
        <label for="purpose_required" class="ml-2 block text-sm text-gray-700">Purpose Required</label>
    </div>

    <div>
        <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
        <select id="status" bind:value={documentType.status} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
        </select>
    </div>

    <div>
        <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            {documentType.id ? 'Update' : 'Create'} Document Type
        </button>
    </div>
</form>