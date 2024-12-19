<script lang="ts">
  import MeterForm from './MeterForm.svelte';
  import type { PageData } from './$types';
  import type { z } from 'zod';
  import { meterSchema } from './formSchema';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  type Meter = z.infer<typeof meterSchema> & {
    room?: {
      id: number;
      room_number: string;
      floor?: {
        floor_number: string;
        wing?: string;
        property?: {
          name: string;
        };
      };
    };
    created_by_user?: {
      full_name: string;
    };
    updated_by_user?: {
      full_name: string;
    };
    readings?: {
      id: number;
      reading_value: number;
      reading_date: string;
    }[];
  };

  export let data: PageData;

  let showForm = false;
  let selectedMeter: Meter | undefined = undefined;

  function handleMeterClick(meter: Meter) {
    if (data.isAdminLevel || data.isUtility) {
      selectedMeter = meter;
      showForm = true;
    }
  }

  function handleMeterAdded() {
    showForm = false;
    selectedMeter = undefined;
  }

  function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
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

  function getTypeVariant(type: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    switch (type) {
      case 'WATER':
        return 'secondary';
      case 'ELECTRICITY':
        return 'destructive';
      case 'GAS':
        return 'outline';
      default:
        return 'default';
    }
  }

  function formatReading(value: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
</script>

<div class="space-y-4">
  {#if !showForm}
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Meters</h1>
      {#if data.isAdminLevel || data.isUtility}
        <Button on:click={() => showForm = true}>Add Meter</Button>
      {/if}
    </div>

    <div class="grid gap-4">
      {#each data.meters || [] as meter}
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
                {#if meter.room}
                  Room {meter.room.room_number}
                  {#if meter.room.floor}
                    - Floor {meter.room.floor.floor_number}
                    {#if meter.room.floor.wing}
                      Wing {meter.room.floor.wing}
                    {/if}
                    {#if meter.room.floor.property}
                      ({meter.room.floor.property.name})
                    {/if}
                  {/if}
                {:else}
                  Unknown Room
                {/if}
              </span>
            </Card.Title>
            <Card.Description>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Initial Reading:</strong> {formatReading(meter.initial_reading)}
                </div>
                <div>
                  <strong>Unit Rate:</strong> ₱{formatReading(meter.unit_rate)}/unit
                </div>
                {#if meter.readings && meter.readings.length > 0}
                  <div>
                    <strong>Latest Reading:</strong> {formatReading(meter.readings[0].reading_value)}
                    ({new Date(meter.readings[0].reading_date).toLocaleDateString()})
                  </div>
                  <div>
                    <strong>Total Readings:</strong> {meter.readings.length}
                  </div>
                {/if}
                {#if meter.notes}
                  <div class="col-span-2">
                    <strong>Notes:</strong> {meter.notes}
                  </div>
                {/if}
                <div>
                  <strong>Created By:</strong> {meter.created_by_user?.full_name || 'Unknown'}
                </div>
                {#if meter.updated_by_user}
                  <div>
                    <strong>Last Updated By:</strong> {meter.updated_by_user.full_name}
                  </div>
                {/if}
              </div>
            </Card.Description>
          </Card.Header>
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