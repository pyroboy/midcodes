<script lang="ts">
  import MeterForm from './MeterForm.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';

  export let data;

  let showForm = false;
  let selectedMeter = undefined;

  function handleMeterClick(meter) {
    if (data.isAdminLevel || data.isUtility) {
      selectedMeter = meter;
      showForm = true;
    }
  }

  function handleMeterAdded() {
    showForm = false;
    selectedMeter = undefined;
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'MAINTENANCE':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  function getTypeVariant(type: string) {
    switch (type) {
      case 'WATER':
        return 'info';
      case 'ELECTRICITY':
        return 'warning';
      case 'GAS':
        return 'destructive';
      default:
        return 'secondary';
    }
  }
</script>

<div class="space-y-4">
  {#if !showForm}
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Utility Meters</h1>
      {#if data.isAdminLevel || data.isUtility}
        <Button on:click={() => showForm = true}>Add Meter</Button>
      {/if}
    </div>

    <div class="grid gap-4">
      {#each data.meters as meter}
        <Card.Root 
          class="cursor-pointer {(data.isAdminLevel || data.isUtility) ? 'hover:bg-gray-50' : ''}"
          on:click={() => handleMeterClick(meter)}
        >
          <Card.Header>
            <Card.Title class="flex justify-between items-center">
              <span>
                {meter.name}
                <Badge variant={getStatusVariant(meter.status)} class="ml-2">
                  {meter.status}
                </Badge>
                <Badge variant={getTypeVariant(meter.type)} class="ml-2">
                  {meter.type}
                </Badge>
              </span>
              <span class="text-sm font-normal">
                Room {meter.room?.room_number}
                {#if meter.room?.floor}
                  - Floor {meter.room.floor.floor_number}
                  {#if meter.room.floor.wing}
                    Wing {meter.room.floor.wing}
                  {/if}
                {/if}
              </span>
            </Card.Title>
            <Card.Description>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Property:</strong> {meter.room?.floor?.property?.name}
                </div>
                <div>
                  <strong>Initial Reading:</strong> {meter.initial_reading}
                </div>
                <div>
                  <strong>Unit Rate:</strong> ₱{meter.unit_rate.toFixed(2)}
                </div>
              </div>
            </Card.Description>
          </Card.Header>
          {#if meter.notes}
            <Card.Content>
              <div class="text-sm">
                <strong>Notes:</strong> {meter.notes}
              </div>
            </Card.Content>
          {/if}
        </Card.Root>
      {/each}
    </div>
  {:else}
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">{selectedMeter ? 'Edit' : 'Add'} Meter</h1>
      <Button variant="outline" on:click={() => {
        showForm = false;
        selectedMeter = undefined;
      }}>
        Cancel
      </Button>
    </div>

    <MeterForm
      {data}
      rooms={data.rooms}
      editMode={!!selectedMeter}
      meter={selectedMeter}
      on:meterAdded={handleMeterAdded}
    />
  {/if}
</div>

{#if !data.isAdminLevel && !data.isUtility && !data.isMaintenance}
  <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p class="text-yellow-800">
      You are viewing this page in read-only mode. Contact an administrator if you need to make changes.
    </p>
  </div>
{/if}