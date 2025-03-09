<!-- +page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import BookingModal from './bookings/BookingModal.svelte';
	
	// Update the Room interface
	interface Room {
	  id: number;
	  name: string;
	  description: string;
	  beds: string;
	  capacity: string;
	  features: string[];
	  size: string;
	  image: string;
	  price: number;  
	}
	
	interface BookingForm {
	  firstName: string;
	  lastName: string;
	  email: string;
	  phone: string;
	  checkIn: string;
	  checkOut: string;
	  adults: number;
	  children: number;
	  roomId: number | null;
	  specialRequests: string;
	}
	
	let videoElement = $state<HTMLVideoElement | undefined>(undefined);
	let showModal = $state(false);
	let selectedRoom = $state<Room | null>(null);
	let bookingForm = $state({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		checkIn: '',
		checkOut: '',
		adults: 1,
		children: 0,
		roomId: null as number | null,
		specialRequests: ''
	});
	let successMessage = $state('');
	let errorMessage = $state('');
	
	// Update the rooms array
	const rooms: Room[] = [
	  {
		id: 1,
		name: 'Family Room',
		description: 'Spacious accommodation perfect for families, this room comfortably fits 2 adults and 2 children. Experience comfort with modern amenities and stunning views. The room features full air-conditioning and comes with complimentary breakfast for all guests.',
		beds: 'Family bed',
		capacity: '2 adults, 2 children',
		features: [
		  'Hot & Cold Water Supply',
		  'Fully air-conditioned',
		  'Wi-Fi access',
		  'Free Breakfast',
		  'Fully Secured Area',
		  'Extra Bed Available (₱500)',
		  'Free Swimming Pool Usage',
		  'Free Usage of Viewing Gazebo',
		  'UV Disinfected'
		],
		size: '45sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1489349716_u7ay9s.jpg',
		price: 4500  
	  },
	  {
		id: 2,
		name: 'Twin Room',
		description: 'Perfect for small families or groups, this twin-bedded room accommodates 2 adults and 2 children comfortably. Enjoy a relaxing stay with essential amenities and access to resort facilities including the swimming pool and viewing gazebo.',
		beds: '2 twin beds',
		capacity: '2 adults, 2 children',
		features: [
		  'Hot & Cold Water Supply',
		  'Fully air-conditioned',
		  'Wi-Fi access',
		  'Free Breakfast',
		  'Fully Secured Area',
		  'Extra Bed Available (₱500)',
		  'Free Swimming Pool Usage',
		  'Free Usage of Viewing Gazebo',
		  'UV Disinfected'
		],
		size: '40sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491582688_jsxxeg.jpg',
		price: 3500  
	  }
	];
	
	function openBooking(room: Room): void {
	  selectedRoom = room;
	  bookingForm.roomId = room.id;
	  showModal = true;
	}
	
	function closeModal(): void {
	  showModal = false;
	  selectedRoom = null;
	}
	
	async function handleSubmitBooking(bookingData: any): Promise<void> {
	  try {
	    const formData = new FormData();
	    
	    // Add all booking data to form
	    Object.entries(bookingData).forEach(([key, value]) => {
	      formData.append(key, value as string);
	    });
	    
	    // Submit the form data to the server action
	    const response = await fetch('/bookings?/createBooking', {
	      method: 'POST',
	      body: formData
	    });
	    
	    const result = await response.json();
	    
	    if (result.success) {
	      successMessage = 'Booking created successfully!';
	      errorMessage = '';
	      closeModal();
	      
	      // Clear success message after 5 seconds
	      setTimeout(() => {
	        successMessage = '';
	      }, 5000);
	    } else {
	      errorMessage = result.message || 'Failed to create booking';
	      successMessage = '';
	    }
	  } catch (error) {
	    console.error('Error submitting booking:', error);
	    errorMessage = 'An unexpected error occurred';
	    successMessage = '';
	  }
	}
	
	function handleEscapeKey(event: KeyboardEvent): void {
	  if (event.key === 'Escape' && showModal) {
		closeModal();
	  }
	}
	
	function scrollToRooms(): void {
	  const roomsSection = document.getElementById('rooms');
	  if (roomsSection) {
		roomsSection.scrollIntoView({ behavior: 'smooth' });
	  }
	}
	
	onMount(() => {
	  if (videoElement) {
		videoElement.play().catch((error: Error) => {
		  console.log("Video autoplay failed:", error);
		});
	  }
	});
</script>

<svelte:head>
	<title>Cabilao Cliff Diving Resort</title>
	<meta name="description" content="Experience luxury accommodation in paradise" />
</svelte:head>

<svelte:window onkeydown={handleEscapeKey}/>

<main class="min-h-screen bg-white text-gray-800 font-sans m-0 p-0 overflow-x-hidden">
	<!-- Hero Section -->
	<section class="relative h-[600px] md:h-screen w-full overflow-hidden [margin-top:-64px]">
		<div class="absolute inset-0 z-10 bg-gradient-radial from-transparent via-black/80 to-black/95"></div>
		<div class="absolute inset-0 w-full h-full overflow-hidden">
			<iframe 
			  class="absolute w-full h-full scale-[1.5] object-cover" 
			  src="https://www.youtube.com/embed/leb38cVmbhE?autoplay=1&mute=1&loop=1&playlist=leb38cVmbhE&controls=0" 
			  frameborder="0" 
			  allow="autoplay; encrypted-media" 
			  allowfullscreen
			  title="Cabilao Cliffs Dive Resort Video"
			></iframe>
		</div>
		
		<!-- Content -->
		<div class="relative h-full flex items-center justify-center px-4 z-20">
		  <div class="max-w-4xl text-center text-white">
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 tracking-wider">Cabilao Cliffs Dive Resort</h1>
			<p class="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 opacity-90">Experience luxury accommodation in paradise</p>
			<button 
			  class="bg-orange-600 text-white px-6 md:px-10 py-3 md:py-4 rounded text-sm md:text-base font-medium tracking-wide transition-all hover:-translate-y-1 hover:opacity-90"
			  onclick={scrollToRooms}
			>
			  View Rooms
			</button>
		  </div>
		</div>
	</section>

	<!-- Rooms Section -->
	<section id="rooms" class="py-20 bg-white">
		<div class="max-w-7xl mx-auto px-4">
			<h2 class="text-4xl font-bold text-center mb-16">Our Accommodations</h2>
			
			{#if successMessage}
				<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
					<span class="block sm:inline">{successMessage}</span>
					<button 
						class="absolute top-0 bottom-0 right-0 px-4 py-3"
						onclick={() => { successMessage = ''; }}
					>
						<span class="sr-only">Close</span>
						<span class="text-2xl">&times;</span>
					</button>
				</div>
			{/if}
			
			{#if errorMessage}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
					<span class="block sm:inline">{errorMessage}</span>
					<button 
						class="absolute top-0 bottom-0 right-0 px-4 py-3"
						onclick={() => { errorMessage = ''; }}
					>
						<span class="sr-only">Close</span>
						<span class="text-2xl">&times;</span>
					</button>
				</div>
			{/if}
			
			<div class="space-y-32">
				{#each rooms as room}
					<div class="flex flex-col md:flex-row {room.id % 2 === 0 ? 'md:flex-row-reverse' : ''} gap-12 items-center">
						<div class="flex-1">
							<img 
								src={room.image} 
								alt={room.name}
								class="w-full h-[600px] object-cover rounded-xl shadow-xl"
							/>
						</div>
						
						<div class="flex-1 space-y-6">
							<h3 class="text-3xl font-bold">{room.name}</h3>
							<p class="text-gray-600 text-lg">{room.description}</p>
							
							<div class="grid grid-cols-2 gap-4 my-6">
							  <div>
							    <span class="text-gray-500">Beds</span>
							    <p class="font-semibold">{room.beds}</p>
							  </div>
							  <div>
							    <span class="text-gray-500">Capacity</span>
							    <p class="font-semibold">{room.capacity}</p>
							  </div>
							  <div>
							    <span class="text-gray-500">Room Size</span>
							    <p class="font-semibold">{room.size}</p>
							  </div>
							  <div>
							    <span class="text-gray-500">Price per Night</span>
							    <p class="font-semibold">₱{room.price.toLocaleString()}</p>
							  </div>
							</div>
							
							<div class="space-y-2">
								<h4 class="font-semibold text-lg">Room Features:</h4>
								<ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
									{#each room.features as feature}
										<li class="flex items-center text-gray-600">
											<span class="text-orange-600 mr-2">✓</span>
											{feature}
										</li>
									{/each}
								</ul>
							</div>
							
							<button 
								class="mt-6 bg-orange-600 text-white px-6 py-3 rounded text-sm font-medium tracking-wide transition-all hover:-translate-y-1 hover:opacity-90"
								onclick={() => openBooking(room)}
							>
								Book Now
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	{#if showModal && selectedRoom}
		<BookingModal
			room={selectedRoom}
			show={showModal}
			onClose={closeModal}
			onSubmit={handleSubmitBooking}
		/>
	{/if}
</main>