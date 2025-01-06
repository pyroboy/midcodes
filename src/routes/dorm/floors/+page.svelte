<script lang="ts">
  import FloorForm from './FloorForm.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { floorSchema } from './formSchema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import type { z } from 'zod';
  import type { Floor, FloorWithProperty } from './formSchema';
  // Define types based on your database schema
  interface Property {
    id: number;
    name: string;
  }


  interface PageData {
    floors: FloorWithProperty[];
    properties: Property[];
    form: SuperValidated<z.infer<typeof floorSchema>>;
    user: { role: string } | null;
  }

  export let data: PageData;

  const { form, enhance, errors, constraints } = superForm(data.form, {
    id: 'floor-form',
    validators: zodClient(floorSchema),
    validationMethod: 'auto',
    dataType: 'json',
    delayMs: 10,
    taintedMessage: null,
    onError: ({ result }) => {
      console.log('Validation errors:', result.error);
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        selectedFloor = undefined;
        editMode = false;
      }
    }
  });

  let editMode = false;
  let selectedFloor: FloorWithProperty | undefined = undefined;

  function handleFloorClick(floor: FloorWithProperty) {
    selectedFloor = floor;
    editMode = true;
    
    $form = {
      id: floor.id,
      property_id: floor.property_id,
      floor_number: floor.floor_number,
      wing: floor.wing || undefined,
      status: floor.status
    };
  }

  function handleAddFloor() {
    selectedFloor = undefined;
    editMode = false;
    
    $form = {
      id: undefined,
      property_id: 0,
      floor_number: 0,
      wing: undefined,
      status: 'ACTIVE'
    };
  }

  function handleCancel() {
    selectedFloor = undefined;
    editMode = false;
  }

  function getStatusVariant(status: Floor['status']): "default" | "destructive" | "outline" | "secondary" {
    switch (status) {
      case 'ACTIVE':
        return 'secondary';
      case 'INACTIVE':
        return 'destructive';
      case 'MAINTENANCE':
        return 'outline';
      default:
        return 'default';
    }
  }
</script>

<div class="container mx-auto p-4 flex">
  <div class="w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Floors</h1>
      {#if data.user?.role === 'staff'}
        <Button on:click={handleAddFloor}>Add Floor</Button>
      {/if}
    </div>

    <Card>
      <CardContent class="p-0">
        <div class="grid grid-cols-4 gap-4 p-4 font-medium border-b bg-muted/50">
          <div>Property</div>
          <div>Floor</div>
          <div>Wing</div>
          <div>Status</div>
        </div>

        {#if data.floors && data.floors.length > 0}
          {#each data.floors as floor (floor.id)}
            <button 
              type="button"
              class="grid grid-cols-4 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0"
              class:pointer-events-none={data.user?.role !== 'staff'}
              on:click={() => handleFloorClick(floor)}
            >
              <div class="font-medium">{floor.property.name}</div>
              <div>Floor {floor.floor_number}</div>
              <div>{floor.wing || '-'}</div>
              <div>
                <Badge variant={getStatusVariant(floor.status)}>
                  {floor.status}
                </Badge>
              </div>
            </button>
          {/each}
        {:else}
          <div class="p-4 text-center text-muted-foreground">
            No floors found
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>

  <div class="w-1/3 pl-4">
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? 'Edit' : 'Add'} Floor</CardTitle>
      </CardHeader>
      <CardContent>
        <FloorForm
          {data}
          {editMode}
          {form}
          {errors}
          {enhance}
          {constraints}
          on:cancel={handleCancel}
          on:floorSaved={() => {
            selectedFloor = undefined;
            editMode = false;
          }}
        />
      </CardContent>
    </Card>
  </div>
</div>