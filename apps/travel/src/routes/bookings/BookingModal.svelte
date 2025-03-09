<script lang="ts">
  import { BookingFormSchema } from './BookingSchema';
  import type { Room } from './types';
  import { format } from 'date-fns';
  
  let { room, show = false, onClose = () => {}, onSubmit = (data: any) => {} } = $props();
  
  let bookingForm = $state({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    roomId: room?.id || '',
    specialRequests: '',
    errors: {} as Record<string, string>,
    isSubmitting: false
  });

  // Update roomId when room changes
  $effect(() => {
    if (room?.id) {
      bookingForm.roomId = room.id;
    }
  });
  
  const calculateTotalPrice = () => {
    if (!room?.price) return 0;
    
    const checkInDate = new Date(bookingForm.checkIn);
    const checkOutDate = new Date(bookingForm.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    return room.price * nights;
  };
  
  const validateForm = () => {
    try {
      BookingFormSchema.parse({
        firstName: bookingForm.firstName,
        lastName: bookingForm.lastName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        adults: bookingForm.adults,
        children: bookingForm.children,
        roomId: bookingForm.roomId,
        specialRequests: bookingForm.specialRequests
      });
      bookingForm.errors = {};
      return true;
    } catch (error: any) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        formattedErrors[err.path[0]] = err.message;
      });
      bookingForm.errors = formattedErrors;
      return false;
    }
  };
  
  const handleSubmit = (event: Event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    bookingForm.isSubmitting = true;
    
    const bookingData = {
      firstName: bookingForm.firstName,
      lastName: bookingForm.lastName,
      email: bookingForm.email,
      phone: bookingForm.phone,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      adults: bookingForm.adults,
      children: bookingForm.children,
      roomId: bookingForm.roomId,
      specialRequests: bookingForm.specialRequests,
      totalPrice: calculateTotalPrice()
    };
    
    onSubmit(bookingData);
  };
  
  const handleClose = () => {
    onClose();
  };
  
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && show) {
      handleClose();
    }
  };
</script>

<svelte:window onkeydown={handleEscapeKey} />

{#if show}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
      <button 
        class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        onclick={handleClose}
      >
        ×
      </button>
      
      <div class="p-6 md:p-8">
        <h2 class="text-2xl font-bold mb-6">Book {room?.name}</h2>
        
        <div class="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold mb-2">Room Details</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-gray-500 text-sm">Room Type</span>
              <p>{room?.name}</p>
            </div>
            <div>
              <span class="text-gray-500 text-sm">Price per Night</span>
              <p>₱{room?.price?.toLocaleString()}</p>
            </div>
            <div>
              <span class="text-gray-500 text-sm">Capacity</span>
              <p>{room?.capacity}</p>
            </div>
            <div>
              <span class="text-gray-500 text-sm">Beds</span>
              <p>{room?.beds}</p>
            </div>
          </div>
        </div>
        
        <form onsubmit={handleSubmit}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
              <input
                type="text"
                id="firstName"
                bind:value={bookingForm.firstName}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.firstName}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.firstName}</p>
              {/if}
            </div>
            
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
              <input
                type="text"
                id="lastName"
                bind:value={bookingForm.lastName}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.lastName}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.lastName}</p>
              {/if}
            </div>
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email*</label>
              <input
                type="email"
                id="email"
                bind:value={bookingForm.email}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.email}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.email}</p>
              {/if}
            </div>
            
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
              <input
                type="tel"
                id="phone"
                bind:value={bookingForm.phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.phone}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.phone}</p>
              {/if}
            </div>
            
            <div>
              <label for="checkIn" class="block text-sm font-medium text-gray-700 mb-1">Check-in Date*</label>
              <input
                type="date"
                id="checkIn"
                bind:value={bookingForm.checkIn}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.checkIn}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.checkIn}</p>
              {/if}
            </div>
            
            <div>
              <label for="checkOut" class="block text-sm font-medium text-gray-700 mb-1">Check-out Date*</label>
              <input
                type="date"
                id="checkOut"
                bind:value={bookingForm.checkOut}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.checkOut}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.checkOut}</p>
              {/if}
            </div>
            
            <div>
              <label for="adults" class="block text-sm font-medium text-gray-700 mb-1">Adults*</label>
              <input
                type="number"
                id="adults"
                bind:value={bookingForm.adults}
                min="1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {#if bookingForm.errors.adults}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.adults}</p>
              {/if}
            </div>
            
            <div>
              <label for="children" class="block text-sm font-medium text-gray-700 mb-1">Children</label>
              <input
                type="number"
                id="children"
                bind:value={bookingForm.children}
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {#if bookingForm.errors.children}
                <p class="text-red-500 text-xs mt-1">{bookingForm.errors.children}</p>
              {/if}
            </div>
          </div>
          
          <div class="mb-6">
            <label for="specialRequests" class="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
            <textarea
              id="specialRequests"
              bind:value={bookingForm.specialRequests}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <div class="flex justify-between items-center">
              <span class="font-semibold">Total Price:</span>
              <span class="text-xl font-bold">₱{calculateTotalPrice().toLocaleString()}</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              {room?.price?.toLocaleString()} × {Math.max(1, Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24)))} nights
            </p>
          </div>
          
          <div class="flex justify-end gap-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              onclick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              disabled={bookingForm.isSubmitting}
            >
              {bookingForm.isSubmitting ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}