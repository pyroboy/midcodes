<!-- +page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	interface Room {
	  id: number;
	  name: string;
	  description: string;
	  beds: string;
	  capacity: string;
	  features: string[];
	  size: string;
	  image: string;
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
	
	let videoElement: HTMLVideoElement;
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
	
	const rooms: Room[] = [
	  {
		id: 1,
		name: 'Hip Deluxe Room',
		description: 'This twin room is equipped with a terrace with seating area, flat screen cable TV and superior linen. The room also includes a desk, wardrobe and safe. The private bathroom has a hairdryer and free toiletries.',
		beds: '2 single',
		capacity: '2 persons',
		features: [
		  'Terrace with seating area',
		  'Flat screen cable TV',
		  'Superior linen',
		  'Desk and wardrobe',
		  'Safe',
		  'Private bathroom',
		  'Hairdryer',
		  'Free toiletries',
		  'UV Disinfected'
		],
		size: '40sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1489349716_u7ay9s.jpg'
	  },
	  {
		id: 2,
		name: 'Hip Junior Suites',
		description: 'This twin room is equipped with a terrace with seating area, flat screen cable TV and superior linen. The room also includes a desk, wardrobe, safe and a Living Area. The private bathroom has a hairdryer and free toiletries.',
		beds: '1 queen bed + 1 single bed + living area',
		capacity: '3 persons',
		features: [
		  'Terrace with seating area',
		  'Flat screen cable TV',
		  'Superior linen',
		  'Desk and wardrobe',
		  'Safe',
		  'Living Area',
		  'Private bathroom',
		  'Hairdryer',
		  'Free toiletries',
		  'UV Disinfected'
		],
		size: '82sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491582688_jsxxeg.jpg'
	  },
	  {
		id: 3,
		name: 'Hive Villa',
		description: 'Featuring a balcony with seating area and views of the tropical, this room is fitted with air conditioning, a flat-screen cable TV, and a desk. There is also a wardrobe and a refrigerator in the room. Included in the private bathroom is a large bathtub and free toiletries.',
		beds: '1 queen',
		capacity: '2 persons',
		features: [
		  'Balcony with tropical views',
		  'Air conditioning',
		  'Flat-screen cable TV',
		  'Desk and wardrobe',
		  'Refrigerator',
		  'Large bathtub',
		  'Free toiletries',
		  'UV Disinfected'
		],
		size: '50sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248184/1491584800_vj3see.jpg'
	  },
	  {
		id: 4,
		name: 'Hiatus Villa',
		description: 'Hiatus Villa has a separate kitchen and leisure area, also has a terrace with a sunbed. The villa has a private garden on the first floor, a private bathroom with shower and toilet, a guest room and a bathroom with fumigation bed on the second floor, including free toiletries and hair dryers.',
		beds: '1 queen',
		capacity: '2 persons',
		features: [
		  'Separate kitchen',
		  'Leisure area',
		  'Terrace with sunbed',
		  'Private garden',
		  'Two-floor layout',
		  'Guest room',
		  'Multiple bathrooms',
		  'Free toiletries',
		  'Hair dryers',
		  'UV Disinfected'
		],
		size: '90sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248183/1491575830_bwgafh.jpg'
	  },
	  {
		id: 5,
		name: 'Harmony Villa',
		description: 'The Harmony Villa has a terrace with a view of the public swimming pool and the distant island. The room has a kitchen area and a family entertainment area. Private bathrooms have free toiletries and hair dryers. The villa has direct access to the private swimming pool.',
		beds: '3 queen',
		capacity: '7 persons',
		features: [
		  'Terrace with pool view',
		  'Kitchen area',
		  'Family entertainment area',
		  'Direct pool access',
		  'Private bathrooms',
		  'Free toiletries',
		  'Hair dryers',
		  'UV Disinfected'
		],
		size: '260sqm',
		image: 'https://res.cloudinary.com/ddlz560fk/image/upload/v1739248182/1491581611_c7vqud.jpg'
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
	<section class="relative h-screen w-full overflow-hidden [margin-top:-64px]">
		<!-- Video Background -->
		<video
		  bind:this={videoElement}
		  class="absolute inset-0 w-full h-full object-cover"
		  autoplay
		  muted
		  loop
		  playsinline
		>
		  <source src="https://media.istockphoto.com/id/1822494596/video/woman-jumps-off-a-cliff-into-the-sea.mp4?s=mp4-640x640-is&k=20&c=nxzAh3Srg-9dfLcpVk3xjRxGl7KHHcLZ0Si-UXxebYo=" type="video/mp4">
		</video>
		
		<!-- Overlay -->
		<div class="absolute inset-0 bg-black/40"></div>
		
		<!-- Content -->
		<div class="relative h-full flex items-center justify-center px-4">
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