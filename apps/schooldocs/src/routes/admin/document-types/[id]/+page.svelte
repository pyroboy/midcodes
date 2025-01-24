<script lang="ts">
    import DocumentTypeForm from '$lib/components/document-types/DocumentTypeForm.svelte';
    export let data;
</script>

<div class="mb-6">
    <h1 class="text-2xl font-bold">Edit Document Type</h1>
    <a href="/admin/document-types" class="text-blue-500 hover:text-blue-700">← Back to Document Types</a>
</div>

<DocumentTypeForm documentType={data.documentType} />