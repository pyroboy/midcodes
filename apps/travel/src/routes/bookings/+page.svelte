<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import BookingModal from './BookingModal.svelte';
  import type { Room } from './types';
  
  const props = {
    data: {} as PageData
  };
  
  let state = {
    showModal: false,
    selectedRoom: null as Room | null,
    successMessage: '',
    errorMessage: ''
  };
  
  const handleOpenModal = (room: Room) => {
    state.selectedRoom = room;
    state.showModal = true;
  };
  
  const handleCloseModal = () => {
    state.showModal = false;
    state.selectedRoom = null;
  };
  
  const handleSubmitBooking = async (bookingData: any) => {
    try {
      const formData = new FormData();
      
      // Add all booking data to form
      Object.entries(bookingData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      // Submit the form data to the server action
      const response = await fetch('?/createBooking', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        state.successMessage = 'Booking created successfully!';
        state.errorMessage = '';
        handleCloseModal();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          state.successMessage = '';
        }, 5000);
      } else {
        state.errorMessage = result.message || 'Failed to create booking';
        state.successMessage = '';
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      state.errorMessage = 'An unexpected error occurred';
      state.successMessage = '';
    }
  };
</script>

<svelte:head>
  <title>Bookings - Cabilao Cliff Diving Resort</title>
  <meta name="description" content="Book your stay at Cabilao Cliff Diving Resort" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Bookings</h1>
  
  {#if state.successMessage}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
      <span class="block sm:inline">{state.successMessage}</span>
      <button 
        class="absolute top-0 bottom-0 right-0 px-4 py-3"
        onclick={() => state.successMessage = ''}
      >
        <span class="sr-only">Close</span>
        <span class="text-2xl">&times;</span>
      </button>
    </div>
  {/if}
  
  {#if state.errorMessage}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
      <span class="block sm:inline">{state.errorMessage}</span>
      <button 
        class="absolute top-0 bottom-0 right-0 px-4 py-3"
        onclick={() => state.errorMessage = ''}
      >
        <span class="sr-only">Close</span>
        <span class="text-2xl">&times;</span>
      </button>
    </div>
  {/if}
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#if $props.data.rooms && $props.data.rooms.length > 0}
      {#each $props.data.rooms as room}
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src={room.image} 
            alt={room.name} 
            class="w-full h-48 object-cover"
          />
          <div class="p-4">
            <h2 class="text-xl font-semibold mb-2">{room.name}</h2>
            <p class="text-gray-600 mb-4 line-clamp-2">{room.description}</p>
            <div class="flex justify-between items-center">
              <span class="text-lg font-bold">₱{room.price.toLocaleString()}/night</span>
              <button
                class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                onclick={() => handleOpenModal(room)}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500">No rooms available at the moment.</p>
      </div>
    {/if}
  </div>
</div>

  {#if state.showModal && state.selectedRoom}
    <BookingModal
      room={state.selectedRoom}
      show={state.showModal}
    onClose={handleCloseModal}
    onSubmit={handleSubmitBooking}
  />
{/if}
