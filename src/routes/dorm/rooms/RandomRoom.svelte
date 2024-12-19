<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { supabase } from '$lib/supabase';

  export let propertyId: number;
  export let floorId: number | null = null;
  export let excludeRoomIds: number[] = [];

  const dispatch = createEventDispatcher();

  async function getRandomRoom() {
    const query = supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId)
      .eq('room_status', 'VACANT');

    if (floorId) {
      query.eq('floor_id', floorId);
    }

    if (excludeRoomIds.length > 0) {
      query.not('id', 'in', `(${excludeRoomIds.join(',')})`);
    }

    const { data: rooms, error } = await query;

    if (error) {
      console.error('Error fetching random room:', error);
      return;
    }

    if (rooms && rooms.length > 0) {
      const randomIndex = Math.floor(Math.random() * rooms.length);
      dispatch('roomSelected', rooms[randomIndex]);
    }
  }
</script>

<Button variant="outline" on:click={getRandomRoom}>
  Get Random Room
</Button>