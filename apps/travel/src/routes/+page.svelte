<!-- +page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
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
	  price: number;  // Add this line
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
	
	let videoElement: HTMLVideoElement | undefined;
	let showModal = false;
	let selectedRoom: Room | null = null;
	let bookingForm: BookingForm = {
	  firstName: '',
	  lastName: '',
	  email: '',
	  phone: '',
	  checkIn: '',
	  checkOut: '',
	  adults: 1,
	  children: 0,
	  roomId: null,
	  specialRequests: ''
	};
	
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
		price: 4500  // Add this line
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
		price: 3500  // Add this line
	  }
	];
	
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
	
		function openBooking(room: Room): void {
	  selectedRoom = room;
	  bookingForm.roomId = room.id;
	  showModal = true;
	}
	
	function closeModal(): void {
	  showModal = false;
	  selectedRoom = null;
	}
	
	function handleSubmit(event: Event): void {
	  event.preventDefault();
	  console.log('Booking submitted:', bookingForm);
	  alert('Thank you for your booking! We will contact you shortly.');
	  closeModal();
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

<svelte:window on:keydown={handleEscapeKey}/>

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
			  on:click={scrollToRooms}
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
			<div class="space-y-32">
				{#each rooms as room}
					<div class="flex flex-col md:flex-row {room.id % 2 === 0 ? 'md:flex-row-reverse' : ''} gap-12 items-center">
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
								class="mt-6 bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 hover:scale-[1.02] text-lg font-medium"
								on:click={() => openBooking(room)}
							>
								Book Now
							</button>
						</div>
						
						<div class="flex-1">
							<img 
								src={room.image} 
								alt={room.name}
								class="w-full h-[600px] object-cover rounded-xl shadow-xl"
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Booking Modal -->
	{#if showModal}
		<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
				<button 
					class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
					on:click={closeModal}
				>
					×
				</button>
				
				<div class="p-6">
					<h3 class="text-2xl font-bold mb-4">Book {selectedRoom?.name}</h3>
					<form on:submit={handleSubmit} class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-2">
								<label for="firstName" class="block text-gray-600">First Name *</label>
								<input
									type="text"
									id="firstName"
									bind:value={bookingForm.firstName}
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="lastName" class="block text-gray-600">Last Name *</label>
								<input
									type="text"
									id="lastName"
									bind:value={bookingForm.lastName}
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="email" class="block text-gray-600">Email *</label>
								<input
									type="email"
									id="email"
									bind:value={bookingForm.email}
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="phone" class="block text-gray-600">Phone *</label>
								<input
									type="tel"
									id="phone"
									bind:value={bookingForm.phone}
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="checkIn" class="block text-gray-600">Check-in Date *</label>
								<input
									type="date"
									id="checkIn"
									bind:value={bookingForm.checkIn}
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="checkOut" class="block text-gray-600">Check-out Date *</label>
								<input
									type="date"
									id="checkOut"
									bind:value={bookingForm.checkOut}
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="adults" class="block text-gray-600">Adults *</label>
								<input
									type="number"
									id="adults"
									bind:value={bookingForm.adults}
									min="1"
									required
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							
							<div class="space-y-2">
								<label for="children" class="block text-gray-600">Children</label>
								<input
									type="number"
									id="children"
									bind:value={bookingForm.children}
									min="0"
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
								/>
							</div>
						</div>
						
						<div class="space-y-2">
							<label for="specialRequests" class="block text-gray-600">Special Requests</label>
							<textarea
								id="specialRequests"
								bind:value={bookingForm.specialRequests}
								rows="4"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
							></textarea>
						</div>
						
						<button 
							type="submit" 
							class="w-full bg-orange-600 text-white py-4 rounded font-medium text-lg transition-all hover:opacity-90"
						>
							Confirm Booking
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</main>