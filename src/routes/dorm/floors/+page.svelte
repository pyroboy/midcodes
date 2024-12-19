<script lang="ts">
  import FloorForm from './FloorForm.svelte';
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import type { PageData } from './$types';
  import type { Database } from '$lib/database.types';

  type Floor = Database['public']['Tables']['floors']['Row'] & {
    property: {
      name: string;
    } | null;
  };

  export let data: PageData;

  let selectedFloor: Floor | undefined = undefined;
  let editMode = false;

  function handleFloorClick(floor: Floor) {
    if (data.isAdminLevel || data.isStaffLevel) {
      selectedFloor = floor;
      editMode = true;
    }
  }

  function handleFloorAdded() {
    selectedFloor = undefined;
    editMode = false;
  }

  $: canAdd = data.isAdminLevel || data.isStaffLevel;
  $: floors = (data.floors ?? []) as Floor[];
</script>

<div class="container mx-auto p-4 space-y-8">
  {#if !data.isAdminLevel && !data.isStaffLevel}
    <Alert variant="info">
      <AlertDescription>
        You are viewing this page in read-only mode. Contact an administrator for edit access.
      </AlertDescription>
    </Alert>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Floor List -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Floors</h2>
        {#if canAdd && !editMode}
          <button
            class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            on:click={() => {
              selectedFloor = undefined;
              editMode = true;
            }}
          >
            Add Floor
          </button>
        {/if}
      </div>

      {#if !floors.length}
        <p class="text-gray-500">No floors found.</p>
      {:else}
        <div class="grid gap-4">
          {#each floors as floor (floor.id)}
            <Card.Root
              class="cursor-pointer hover:shadow-lg transition-shadow"
              on:click={() => handleFloorClick(floor)}
            >
              <Card.Header>
                <Card.Title>Floor {floor.floor_number}</Card.Title>
                <Card.Description>
                  Property: {floor.property?.name ?? 'N/A'}
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <div class="flex items-center gap-2">
                  <Badge variant={floor.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {floor.status}
                  </Badge>
                  {#if floor.wing}
                    <Badge variant="outline">Wing {floor.wing}</Badge>
                  {/if}
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Floor Form -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">{editMode ? (selectedFloor ? 'Edit' : 'Add') : ''} Floor</h2>
      {#if editMode}
        <FloorForm
          data={data}
          properties={data.properties ?? []}
          editMode={!!selectedFloor}
          floor={selectedFloor}
          on:floorAdded={handleFloorAdded}
        />
      {/if}
    </div>
  </div>
</div>
