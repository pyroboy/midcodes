<script lang="ts">
  import Form from './Form.svelte';
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Alert from '$lib/components/ui/alert/alert.svelte';
  import type { PageData } from './$types';
  import type { Database } from '$lib/database.types';

  type Floor = Database['public']['Tables']['floors']['Row'] & {
    property: {
      name: string;
    };
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
  $: floors = data.floors as Floor[] || [];
</script>

<div class="container mx-auto p-4 space-y-8">
  {#if !data.isAdminLevel && !data.isStaffLevel}
    <Alert variant="info">
      You are viewing this page in read-only mode. Contact an administrator for edit access.
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

      <div class="grid gap-4">
        {#each floors as floor (floor.id)}
          <Card.Root 
            class="cursor-pointer {(data.isAdminLevel || data.isStaffLevel) ? 'hover:bg-gray-50' : ''}" 
            on:click={() => handleFloorClick(floor)}
          >
            <Card.Header>
              <Card.Title>
                Floor {floor.floor_number}
                {#if floor.wing}
                  - Wing {floor.wing}
                {/if}
              </Card.Title>
              <Card.Description>
                Property: {floor.property.name}
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <Badge
                variant={floor.status === 'ACTIVE'
                  ? 'default'
                  : floor.status === 'MAINTENANCE'
                  ? 'secondary'
                  : 'destructive'}
              >
                {floor.status}
              </Badge>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>

    <!-- Floor Form -->
    {#if editMode || (!selectedFloor && canAdd)}
      <div>
        <h2 class="text-2xl font-bold mb-4">
          {editMode ? 'Edit Floor' : 'Add New Floor'}
        </h2>
        <Form
          {data}
          properties={data.properties ?? []}
          {editMode}
          floor={selectedFloor}
          on:floorAdded={handleFloorAdded}
        />
      </div>
    {/if}
  </div>
</div>
