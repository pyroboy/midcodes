<script lang="ts">
    import DocumentTypeForm from '$lib/components/document-types/DocumentTypeForm.svelte';
</script>

<div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6">
            <h1 class="text-2xl font-semibold text-gray-900">Create Document Type</h1>
            <a href="/admin/document-types" class="text-blue-500 hover:text-blue-700">← Back to Document Types</a>
        </div>

        <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <DocumentTypeForm />
        </div>
    </div>
</div>