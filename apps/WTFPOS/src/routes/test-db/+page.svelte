<script lang="ts">
    import { onMount } from 'svelte';
    import { getDb } from '$lib/db';
    import { createRxStore } from '$lib/stores/sync.svelte';
    import { nanoid } from 'nanoid';

    // Reactive store for tables connected to rxdb
    const { value: tables, initialized } = $derived(createRxStore('tables', db => db.tables.find()));

    let dbInstance: any;
    let newTableName = $state('');

    onMount(async () => {
        dbInstance = await getDb();
    });

    async function addTable() {
        if (!newTableName) return;
        
        await dbInstance.tables.insert({
            id: nanoid(),
            locationId: 'test-loc',
            number: tables.length + 1,
            label: newTableName,
            zone: 'main',
            capacity: 4,
            x: 0,
            y: 0,
            status: 'available',
            updatedAt: new Date().toISOString()
        });

        newTableName = '';
    }

    async function deleteTable(id: string) {
        const query = dbInstance.tables.findOne(id);
        await query.remove();
    }
</script>

<div class="p-8">
    <h1 class="text-2xl font-bold mb-4">RxDB Test Page</h1>

    {#if !initialized}
        <p>Loading database...</p>
    {:else}
        <div class="mb-6 flex gap-2">
            <input 
                type="text" 
                bind:value={newTableName} 
                class="border p-2 rounded" 
                placeholder="Table Name" 
            />
            <button 
                onclick={addTable} 
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Add Table
            </button>
        </div>

        <div class="grid gap-4 max-w-md">
            {#each tables as table (table.id)}
                <div class="border p-4 rounded flex justify-between items-center shadow-sm">
                    <div>
                        <h3 class="font-bold">{table.label}</h3>
                        <p class="text-sm text-gray-500">Status: {table.status} | ID: {table.id.substring(0,6)}</p>
                    </div>
                    <button 
                        onclick={() => deleteTable(table.id)} 
                        class="text-red-500 hover:text-red-700 font-bold"
                    >
                        Delete
                    </button>
                </div>
            {:else}
                <p class="text-gray-500 italic">No tables found. Add one above.</p>
            {/each}
        </div>
    {/if}
</div>
