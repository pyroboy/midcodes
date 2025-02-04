<!-- +page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	interface Package {
	  id: number;
	  name: string;
	  description: string;
	  price: number;
	  duration: string;
	  includes: string[];
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
	  packageId: number | null;
	  addons: {
		airport_transfer: boolean;
		photography: boolean;
		equipment_rental: boolean;
	  };
	  specialRequests: string;
	}
	
	let videoElement: HTMLVideoElement;
	let showModal = false;
	let selectedPackage: Package | null = null;
	let bookingForm: BookingForm = {
	  firstName: '',
	  lastName: '',
	  email: '',
	  phone: '',
	  checkIn: '',
	  checkOut: '',
	  adults: 1,
	  children: 0,
	  packageId: null,
	  addons: {
		airport_transfer: false,
		photography: false,
		equipment_rental: false
	  },
	  specialRequests: ''
	};
	
	const packages: Package[] = [
	  {
		id: 1,
		name: 'Weekend Warrior',
		description: 'Perfect for a quick adventure getaway. Experience cliff diving with basic training.',
		price: 299,
		duration: '2 Days',
		includes: [
		  'Basic cliff diving training',
		  'Safety equipment rental',
		  '1 night accommodation',
		  'Breakfast and lunch',
		  'Island transfer'
		]
	  },
	  {
		id: 2,
		name: 'Adventure Seeker',
		description: 'Comprehensive cliff diving experience with advanced techniques.',
		price: 599,
		duration: '4 Days',
		includes: [
		  'Advanced cliff diving training',
		  'Multiple dive spots',
		  'Full gear package',
		  '3 nights accommodation',
		  'All meals included'
		]
	  },
	  {
		id: 3,
		name: 'Ultimate Explorer',
		description: 'The complete Cabilao Island experience with exclusive access.',
		price: 899,
		duration: '6 Days',
		includes: [
		  'Expert-level training',
		  'Premium dive locations',
		  'Luxury accommodation',
		  'Private guide',
		  'All inclusive package'
		]
	  },
	  {
		id: 4,
		name: 'Family Adventure',
		description: 'A perfect package for families looking to experience cliff diving together in a safe and fun environment.',
		price: 1299,
		duration: '5 Days',
		includes: [
		  'Family-friendly diving lessons',
		  'Kid-specific safety training',
		  'Professional family photoshoot',
		  '4 nights family suite accommodation',
		  'All meals and snacks included',
		  'Family beach activities',
		  'Private family instructor'
		]
	  }
	];
	
	function openBooking(pkg: Package): void {
	  selectedPackage = pkg;
	  bookingForm.packageId = pkg.id;
	  showModal = true;
	}
	
	function closeModal(): void {
	  showModal = false;
	  selectedPackage = null;
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
	
	function calculateTotal(): number {
	  if (!selectedPackage) return 0;
	  
	  let total = selectedPackage.price;
	  if (bookingForm.addons.airport_transfer) total += 50;
	  if (bookingForm.addons.photography) total += 99;
	  if (bookingForm.addons.equipment_rental) total += 75;
	  
	  return total;
	}
	function scrollToPackages(): void {
  const packagesSection = document.getElementById('packages');
  if (packagesSection) {
    packagesSection.scrollIntoView({ behavior: 'smooth' });
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
	<meta name="description" content="Experience the thrill of cliff diving in paradise" />
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
			<p class="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 opacity-90">Experience the thrill of cliff diving in paradise</p>
			<button 
			  class="bg-orange-600 text-white px-6 md:px-10 py-3 md:py-4 rounded text-sm md:text-base font-medium tracking-wide transition-all hover:-translate-y-1 hover:opacity-90"
			  on:click={scrollToPackages}
			>
			  View Packages
			</button>
		  </div>
		</div>
	  </section>
	<!-- Packages Section -->
	<section id="packages" class="py-20 px-8">
	  <div class="max-w-7xl mx-auto">
		<h2 class="text-4xl font-bold mb-12 text-center">Our Packages</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
		  {#each packages as pkg (pkg.id)}
			<div class="bg-white rounded-lg shadow-lg p-8 transition-transform duration-300 hover:-translate-y-2">
			  <h3 class="text-2xl font-bold mb-2">{pkg.name}</h3>
			  <p class="text-orange-600 font-medium mb-4">{pkg.duration}</p>
			  <p class="text-gray-600 mb-6">{pkg.description}</p>
			  <div class="mb-6">
				<h4 class="text-lg font-semibold mb-3">Package Includes:</h4>
				<ul class="space-y-2">
				  {#each pkg.includes as item}
					<li class="pl-6 relative text-gray-600 before:content-['✓'] before:absolute before:left-0 before:text-orange-600">{item}</li>
				  {/each}
				</ul>
			  </div>
			  <div class="pt-6 border-t border-gray-200">
				<div class="mb-4">
				  <span class="text-sm text-gray-600 block">Starting at</span>
				  <span class="text-3xl font-bold">${pkg.price}</span>
				</div>
				<button 
				  class="w-full bg-orange-600 text-white py-3 rounded font-medium transition-all hover:opacity-90"
				  on:click={() => openBooking(pkg)}
				>
				  Book Now
				</button>
			  </div>
			</div>
		  {/each}
		</div>
	  </div>
	</section>
  
	<!-- About Section -->
	<section class="bg-gray-50 py-20 px-8">
	  <div class="max-w-4xl mx-auto text-center">
		<h2 class="text-4xl font-bold mb-8">Experience Cabilao</h2>
		<p class="text-xl text-gray-600 mb-8">
		  Discover the pristine waters and breathtaking cliffs of Cabilao Island. Our experienced instructors will guide you through an unforgettable adventure in one of the most beautiful diving spots in the Philippines.
		</p>
		<a href="/about" class="text-orange-600 font-medium hover:translate-x-2 transition-transform inline-block">
		  Learn More →
		</a>
	  </div>
	</section>
  
	<!-- Modal -->
	{#if showModal}
	  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
		  <button 
			class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
			on:click={closeModal}
		  >
			×
		  </button>
		  <div class="p-8">
			<h2 class="text-3xl font-bold mb-6">Book Your Adventure</h2>
			{#if selectedPackage}
			  <div class="mb-8 pb-6 border-b border-gray-200">
				<h3 class="text-xl font-semibold">{selectedPackage.name}</h3>
				<p class="text-2xl font-bold text-orange-600">${selectedPackage.price}</p>
			  </div>
			{/if}
  
			<form on:submit={handleSubmit} class="space-y-6">
			  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-2">
				  <label for="firstName" class="block text-gray-600">First Name *</label>
				  <input
					type="text"
					id="firstName"
					bind:value={bookingForm.firstName}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					placeholder="Enter your first name"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="lastName" class="block text-gray-600">Last Name *</label>
				  <input
					type="text"
					id="lastName"
					bind:value={bookingForm.lastName}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					placeholder="Enter your last name"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="email" class="block text-gray-600">Email *</label>
				  <input
					type="email"
					id="email"
					bind:value={bookingForm.email}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					placeholder="Enter your email"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="phone" class="block text-gray-600">Phone Number *</label>
				  <input
					type="tel"
					id="phone"
					bind:value={bookingForm.phone}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					placeholder="Enter your phone number"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="checkIn" class="block text-gray-600">Check-in Date *</label>
				  <input 
					type="date" 
					id="checkIn" 
					bind:value={bookingForm.checkIn} 
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="checkOut" class="block text-gray-600">Check-out Date *</label>
				  <input 
					type="date" 
					id="checkOut" 
					bind:value={bookingForm.checkOut} 
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="adults" class="block text-gray-600">Adults (18+) *</label>
				  <input
					type="number"
					id="adults"
					bind:value={bookingForm.adults}
					min="1"
					max="10"
					required
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
				  />
				</div>
  
				<div class="space-y-2">
				  <label for="children" class="block text-gray-600">Children (under 18)</label>
				  <input
					type="number"
					id="children"
					bind:value={bookingForm.children}
					min="0"
					max="10"
					class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
				  />
				</div>
			  </div>
  
			  <div class="space-y-4">
				<h4 class="font-semibold text-lg">Additional Services</h4>
				<div class="space-y-3">
				  <label class="flex items-center space-x-3 text-gray-600">
					<input
					  type="checkbox"
					  bind:checked={bookingForm.addons.airport_transfer}
					  class="w-4 h-4 text-orange-600 focus:ring-orange-500"
					/>
					<span>Airport Transfer Service (+$50)</span>
				  </label>
  
				  <label class="flex items-center space-x-3 text-gray-600">
					<input
					  type="checkbox"
					  bind:checked={bookingForm.addons.photography}
					  class="w-4 h-4 text-orange-600 focus:ring-orange-500"
					/>
					<span>Professional Photography Package (+$99)</span>
				  </label>
  
				  <label class="flex items-center space-x-3 text-gray-600">
					<input
					  type="checkbox"
					  bind:checked={bookingForm.addons.equipment_rental}
					  class="w-4 h-4 text-orange-600 focus:ring-orange-500"
					/>
					<span>Premium Equipment Rental (+$75)</span>
				  </label>
				</div>
			  </div>
  
			  <div class="space-y-2">
				<label for="specialRequests" class="block text-gray-600">Special Requests</label>
				<textarea
				  id="specialRequests"
				  bind:value={bookingForm.specialRequests}
				  rows="3"
				  class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
				  placeholder="Any special requirements or requests?"
				></textarea>
			  </div>
  
			  <div class="bg-gray-50 p-6 rounded-lg space-y-2">
				<h4 class="font-semibold text-lg">Booking Summary</h4>
				<p class="text-gray-600">Package: {selectedPackage?.name}</p>
				<p class="text-gray-600">Total Guests: {bookingForm.adults + bookingForm.children}</p>
				<p class="text-xl font-bold text-orange-600">Total: ${calculateTotal()}</p>
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