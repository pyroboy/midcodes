<script lang="ts">
  import FloorForm from './FloorForm.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { floorSchema } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import type { FloorWithProperty } from './formSchema';
  import { invalidate,invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';


  let { data } = $props();
  
  let editMode = $state(false);

  const { form: formData, enhance, errors, constraints, reset } = superForm(data.form, {
    id: 'floor-form',
    validators: zodClient(floorSchema),
    validationMethod: 'oninput',
    dataType: 'json',
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form submission error:', {
        error: result.error,
        status: result.status
      });
      if (result.error) {
        console.error('Server error:', result.error.message);
      }
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        editMode = false;
        await invalidate('app:floors');
      }
    }
  });

  function handleFloorClick(floor: FloorWithProperty) {
    editMode = true;
    $formData = {
      id: floor.id,
      floor_number: floor.floor_number,
      wing: floor.wing || undefined,  // Convert null to undefined
      status: floor.status || 'ACTIVE'
    };
  }

  function getStatusVariant(status: FloorWithProperty['status']): "default" | "destructive" | "outline" | "secondary" {
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
    if (!confirm(`Are you sure you want to delete floor ${floor.floor_number}?`)) {
      return;
    }

    const formData = new FormData();
    formData.append('id', String(floor.id));
    
    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });
      
      const response = await result.json();
      
      if (result.ok) {
        editMode = false;
        await invalidateAll();
      } else {
        console.error('Delete failed:', {
          status: result.status,
          response,
          error: response.message
        });
        alert(`Failed to delete floor: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting floor:', error);
      alert(`Error deleting floor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  onMount(() => {
    invalidate('app:floors');
  });
</script>

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Floors</h1>
    </div>

    <Card>
      <CardContent class="p-0">
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 font-medium border-b bg-muted/50">
          <div class="flex items-center">Property</div>
          <div class="flex items-center">Floor</div>
          <div class="flex items-center">Wing</div>
          <div class="flex items-center">Status</div>
          <div class="flex items-center justify-center">Units</div>
          <div class="flex items-center">Actions</div>
        </div>

        {#if data.floors?.length > 0}
          {#each data.floors as floor (floor.id)}
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0">
              <div class="font-medium">
                {floor.property?.name || 'Unknown Property'}
              </div>
              <div>Floor {floor.floor_number}</div>
              <div>{floor.wing || '-'}</div>
              <div>
                <Badge variant={getStatusVariant(floor.status || 'ACTIVE')}>
                  {floor.status || 'ACTIVE'}
                </Badge>
              </div>
              <!-- <div class="flex items-center justify-center">
                {(floor.rental_unit_count || 0}
              </div> -->
              <div class="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onclick={() => handleFloorClick(floor as unknown as FloorWithProperty)}
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
                  onclick={() => handleDeleteFloor(floor as unknown as FloorWithProperty)}
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

  <div class="w-full lg:w-1/3">
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? 'Edit' : 'Add'} Floor</CardTitle>
      </CardHeader>
      <CardContent>
        <FloorForm
          {data}
          {editMode}
          form={formData}
          {errors}
          {enhance}
          {constraints}
        />
      </CardContent>
    </Card>
  </div>
</div>