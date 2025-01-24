<script lang="ts">
  import { documentTypes } from '$lib/stores/mockDocumentTypes';
  import type { DocumentType } from '$lib/types/document-types';

  let documentTypesList: DocumentType[] = [];
  documentTypes.subscribe(value => {
    documentTypesList = value;
  });

  function handleRowClick(id: string) {
    window.location.href = `/admin/document-types/${id}`;
  }
</script>

<div class="py-6">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Document Types</h1>
      <a
        href="/admin/document-types/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        New Document Type
      </a>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Description
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Processing Time
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each documentTypesList as type}
            <tr
              class="hover:bg-gray-50 cursor-pointer"
              on:click={() => handleRowClick(type.id)}
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {type.name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {type.description || 'No description'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ₱{type.price.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {type.processing_time_hours} hours
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>