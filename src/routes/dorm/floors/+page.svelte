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
    isAdminLevel: boolean;
    isStaffLevel: boolean;
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

  async function handleDeleteFloor(floor: FloorWithProperty) {
    if (confirm(`Are you sure you want to delete floor ${floor.floor_number}?`)) {
      const formData = new FormData();
      formData.append('id', floor.id.toString());
      
      try {
        const result = await fetch('?/delete', {
          method: 'POST',
          body: formData
        });
        
        const response = await result.json();
        
        if (result.ok && response.type === 'success') {
          // Remove deleted floor from the list
          data.floors = data.floors.filter(f => f.id !== floor.id);
          // Reset form and selection
          selectedFloor = undefined;
          editMode = false;
          // Show success message
          alert('Floor deleted successfully');
        } else {
          console.error('Delete failed with status:', result.status, response);
          alert(`Failed to delete floor (status ${result.status}): ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting floor:', error);
        alert(`Error deleting floor: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 font-medium border-b bg-muted/50">
          <div class="flex items-center">Property</div>
          <div class="flex items-center">Floor</div>
          <div class="flex items-center">Wing</div>
          <div class="flex items-center">Status</div>
          <div class="flex items-center justify-center">Rental_Units</div>
          <div class="flex items-center">Actions</div>
        </div>

        {#if data.floors && data.floors.length > 0}
          {#each data.floors as floor (floor.id)}
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0">
              <div class="font-medium">{floor.property.name}</div>
              <div>Floor {floor.floor_number}</div>
              <div>{floor.wing || '-'}</div>
              <div>
                <Badge variant={getStatusVariant(floor.status)}>
                  {floor.status}
                </Badge>
              </div>
              <div class="flex items-center justify-center">
                {floor.rental_unit?.length || 0}
              </div>
              <div class="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  on:click={() => handleFloorClick(floor)}
                  disabled={!data.isAdminLevel && !data.isStaffLevel && data.user?.role !== 'staff'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  on:click={() => handleDeleteFloor(floor)}
                  disabled={!data.isAdminLevel && data.user?.role !== 'staff'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                  </svg>
                  Delete
                </Button>
              </div>
            </div>
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