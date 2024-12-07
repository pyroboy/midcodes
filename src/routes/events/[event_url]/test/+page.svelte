<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Test Route</h1>
    
    <div class="bg-white shadow rounded-lg p-6 mb-4">
        <h2 class="text-xl font-semibold mb-2">Event Information</h2>
        <pre class="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data.event, null, 2)}
        </pre>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-2">Debug Information</h2>
        <pre class="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data.debug, null, 2)}
        </pre>
    </div>
</div>
