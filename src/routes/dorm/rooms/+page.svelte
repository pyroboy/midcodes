<script lang="ts">
  import RoomForm from './RoomForm.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { Room } from './formSchema';
  import { checkAccess } from '$lib/utils/roleChecks';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { roomSchema } from './formSchema';
  import type { SuperValidated } from 'sveltekit-superforms';

  // Using the same type structure as RoomForm.svelte
  interface PageData {
    rooms: Array<Room & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
    form: SuperValidated<any>;
    user: { role: string } | null;
  }

  export let data: PageData;

  const { form, errors, enhance: superEnhance } = superForm(data.form, {
    validators: zodClient(roomSchema),
    applyAction: true,
    resetForm: true,
    taintedMessage: null,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        showForm = false;
        selectedRoom = undefined;
      }
    }
  });

  // Using the same type as defined in PageData for consistency
  let selectedRoom: (Room & { 
    property: { name: string }; 
    floor: { floor_number: number; wing?: string } 
  }) | undefined = undefined;

  let editMode = false;
  let showForm = false;

  function handleRoomClick(room: PageData['rooms'][number]) {
    selectedRoom = room;
    editMode = true;
    showForm = true;
  }

  function handleRoomSaved() {
    selectedRoom = undefined;
    editMode = false;
    showForm = false;
  }

  function handleCancel() {
    selectedRoom = undefined;
    editMode = false;
    showForm = false;
  }

  function handleAddRoom() {
    selectedRoom = undefined;
    editMode = false;
    showForm = true;
  }

  type StatusVariant = 'default' | 'destructive' | 'outline' | 'secondary';
  
  function getStatusColor(status: string): StatusVariant {
    switch (status) {
      case 'VACANT':
        return 'secondary';
      case 'OCCUPIED':
        return 'default';
      case 'RESERVED':
        return 'outline';
      default:
        return 'default';
    }
  }
</script>

<div class="container mx-auto p-4 flex">
  <!-- Left side: List -->
  <div class="w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Rooms</h1>
      {#if checkAccess(data.user?.role, 'staff')}
        <Button on:click={handleAddRoom}>Add Room</Button>
      {/if}
    </div>

    <div class="rounded-md border">
      <div class="grid grid-cols-4 gap-4 p-4 font-medium border-b bg-muted/50">
        <div>Room</div>
        <div>Type</div>
        <div>Status</div>
        <div>Rate</div>
      </div>

      {#if data.rooms && data.rooms.length > 0}
        {#each data.rooms as room (room.id)}
          <button 
            type="button"
            class="grid grid-cols-4 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0"
            class:pointer-events-none={!checkAccess(data.user?.role, 'staff')}
            on:click={() => handleRoomClick(room)}
          >
            <div>
              <div class="font-medium">{room.name}</div>
              <div class="text-sm text-muted-foreground">
                {room.property.name} - Floor {room.floor.floor_number}
                {#if room.floor.wing}
                  Wing {room.floor.wing}
                {/if}
              </div>
            </div>
            <div class="flex items-center">
              <span class="capitalize">{room.type.toLowerCase()}</span>
              {#if room.capacity > 1}
                <span class="text-sm text-muted-foreground ml-1">
                  ({room.capacity} pax)
                </span>
              {/if}
            </div>
            <div>
              <Badge variant={getStatusColor(room.room_status)}>
                {room.room_status}
              </Badge>
            </div>
            <div>
              ₱{room.base_rate.toLocaleString()}/mo
            </div>
          </button>
        {/each}
      {:else}
        <div class="p-4 text-center text-muted-foreground">
          No rooms found
        </div>
      {/if}
    </div>
  </div>

  <!-- Right side: Form -->
  <div class="w-1/3 pl-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">{editMode ? 'Edit' : 'Add'} Room</h1>
      </div>
      <RoomForm
        {data}
        {editMode}
        {selectedRoom}
        on:cancel={() => {
          selectedRoom = undefined;
        }}
      />
  </div>
</div>