<script lang="ts">
  import FloorForm from './FloorForm.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { floorSchema } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Accordion from '$lib/components/ui/accordion';
  import type { FloorWithProperty } from './formSchema';
  import { invalidateAll } from '$app/navigation';
  import { propertyStore } from '$lib/stores/property';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';

  let { data } = $props();

  let editMode = $state(false);
  let isDeleteDialogOpen = $state(false);
  let floorToDelete = $state<FloorWithProperty | null>(null);

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
        await invalidateAll();
      }
    }
  });

  let selectedProperty = $derived($propertyStore.selectedProperty);
  let filteredFloors = $derived(
    selectedProperty && data.floors
      ? data.floors.filter((floor) => floor.property_id === selectedProperty?.id)
      : []
  );

  let selectedFloor = $state<FloorWithProperty | null>(null);

  function handleFloorClick(floor: FloorWithProperty) {
    console.log('--- Edit Floor Clicked ---');
    console.log('Floor data:', floor);
    editMode = true;
    selectedFloor = floor;
    reset({
      data: {
        id: floor.id,
        property_id: floor.property_id,
        floor_number: floor.floor_number,
        wing: floor.wing,
        status: floor.status
      }
    });
    console.log('Form reset with new data for editing.');
  }

  function confirmDelete(floor: FloorWithProperty) {
    floorToDelete = floor;
    isDeleteDialogOpen = true;
  }

  async function proceedWithDelete() {
    if (!floorToDelete) return;

    console.log('--- Delete Floor Confirmed ---');
    console.log('Floor to delete:', floorToDelete);

    const formData = new FormData();
    formData.append('id', floorToDelete.id.toString());
    const response = await fetch('?/delete', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('Floor deleted successfully, invalidating data.');
      await invalidateAll();
    } else {
      console.error('Failed to delete floor.', response);
      alert('Failed to delete floor.');
    }

    isDeleteDialogOpen = false;
    floorToDelete = null;
  }
</script>

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Floors</h1>
    </div>
    <Card>
      <CardContent class="p-0">
        <div class="hidden md:grid md:grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2 font-medium border-b bg-muted/50">
          <div>Floor Number</div>
          <div>Rental Units</div>
          <div>Status</div>
          <div class="text-right">Actions</div>
        </div>
        {#if !selectedProperty}
          <div class="text-center py-8">
            <p class="text-gray-500">Please select a property to view floors.</p>
          </div>
        {:else if !filteredFloors.length}
          <div class="text-center py-8">
            <p class="text-gray-500">No floors found for this property.</p>
          </div>
        {:else}
          <div class="divide-y">
            {#each filteredFloors as floor (floor.id)}
              <Accordion.Root type="single" class="w-full" >
                <Accordion.Item value={floor.id.toString()} class="border-b-0">
                  <div class="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 px-4 py-2">
                    <div>{floor.floor_number}</div>
                    <div>{floor.rental_unit.length}</div>
                    <div><Badge>{floor.status}</Badge></div>
                    <div class="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" on:click={(e) => { e.stopPropagation(); handleFloorClick(floor); }}>
                        <span class="sr-only">Edit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                      </Button>
                      <Button size="icon" variant="ghost" on:click={(e) => { e.stopPropagation(); confirmDelete(floor); }}>
                        <span class="sr-only">Delete</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </Button>
                      <Accordion.Trigger class="p-1 rounded-md hover:bg-muted" />
                    </div>
                  </div>
                  <Accordion.Content>
                    <div class="p-4 bg-muted/50">
                      <div class="font-medium mb-2">Wing: {floor.wing || 'N/A'}</div>
                      <h4 class="font-medium mb-2">Rental Units:</h4>
                      {#if floor.rental_unit.length > 0}
                        <ul class="list-disc pl-5 space-y-1">
                          {#each floor.rental_unit as unit}
                            {@const activeLeases = unit.leases.filter(lease => lease.status === 'ACTIVE')}
                            {@const tenantCount = activeLeases.reduce((acc, lease) => acc + lease.lease_tenants.length, 0)}
                                                      <li>Unit {unit.number} - {tenantCount} Tenants</li>
                          {/each}
                        </ul>
                      {:else}
                        <p>No rental units on this floor.</p>
                      {/if}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            {/each}
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

<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone. This will permanently delete the floor and all associated rental units.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={proceedWithDelete}>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>