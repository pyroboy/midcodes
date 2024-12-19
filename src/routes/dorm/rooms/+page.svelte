<script lang="ts">
  import RoomForm from './RoomForm.svelte';
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  export let data;

  let selectedRoom: any = undefined;
  let editMode = false;

  function handleRoomClick(room: any) {
    selectedRoom = room;
    editMode = true;
  }

  function handleRoomAdded() {
    selectedRoom = undefined;
    editMode = false;
  }

  $: isAdminLevel = data.user?.role === 'super_admin' || data.user?.role === 'property_admin';
  $: isStaffLevel = data.user?.role === 'staff' || data.user?.role === 'frontdesk';
  $: canCreate = isAdminLevel || isStaffLevel;

  function getStatusColor(status: string) {
    switch (status) {
      case 'VACANT':
        return 'success';
      case 'OCCUPIED':
        return 'default';
      case 'MAINTENANCE':
        return 'warning';
      case 'RESERVED':
        return 'secondary';
      default:
        return 'default';
    }
  }
</script>

<div class="container mx-auto p-4 space-y-8">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Room List -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">Rooms</h2>
      <div class="grid gap-4">
        {#each data.rooms as room}
          <Card.Root 
            class="cursor-pointer hover:shadow-md transition-shadow" 
            on:click={() => handleRoomClick(room)}
          >
            <Card.Header>
              <Card.Title>
                Room {room.room_number}
                <Badge variant={getStatusColor(room.room_status)}>
                  {room.room_status}
                </Badge>
              </Card.Title>
              <Card.Description>
                {room.property.name} - Floor {room.floor.floor_number}
                {#if room.floor.wing}
                  - Wing {room.floor.wing}
                {/if}
              </Card.Description>
            </Card.Header>
            <Card.Content class="grid grid-cols-2 gap-2">
              <div>
                <span class="font-semibold">Capacity:</span> {room.capacity}
              </div>
              <div>
                <span class="font-semibold">Rate:</span> ${room.rate}
              </div>
              {#if room.description}
                <div class="col-span-2">
                  <span class="font-semibold">Description:</span> {room.description}
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>

    <!-- Room Form -->
    {#if canCreate || editMode}
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">
          {editMode ? 'Edit Room' : 'Add New Room'}
        </h2>
        <RoomForm
          {data}
          properties={data.properties}
          floors={data.floors}
          {editMode}
          room={selectedRoom}
          user={data.user}
          on:roomAdded={handleRoomAdded}
        />
      </div>
    {/if}
  </div>
</div>