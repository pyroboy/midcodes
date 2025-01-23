<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	
	let isVisible = false;
  
	onMount(() => {
	  isVisible = true;
	  const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
		  if (entry.isIntersecting) {
			entry.target.classList.add('opacity-100', 'translate-y-0');
			entry.target.classList.remove('opacity-0', 'translate-y-8');
		  }
		});
	  }, {
		threshold: 0.1
	  });
  
	  document.querySelectorAll('.scroll-fade').forEach(section => {
		observer.observe(section);
	  });
	});
  
	const amenities = [
	  "Marine Sanctuary",
	  "World-Class Dive Sites",
	  "Pristine Beaches",
	  "Local Cuisine",
	  "Eco-Adventures",
	  "Cultural Experiences"
	];
  </script>
  
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
	<!-- Hero Section -->
	{#if isVisible}
	<div 
	  in:fade={{ duration: 1000 }}
	  class="relative h-[80vh] overflow-hidden"
	>
	  <img 
		src="https://cdn-jealn.nitrocdn.com/asCOxDOMOaFmNWrQQTGwnJXtwiwbVeot/assets/images/optimized/rev-196a847/www.sea-explorers.com/wp-content/uploads/2020/06/cabilao-drone-01.jpg" 
		alt="Cabilao Island view" 
		class="w-full h-full object-cover"
	  />
	  <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
		<div class="text-center max-w-4xl mx-auto px-4">
		  <h1 
			in:fly={{ y: 50, duration: 1000 }}
			class="text-4xl md:text-6xl font-bold text-white mb-6"
		  >
			Discover Cabilao Island
		  </h1>
		  <p 
			in:fly={{ y: 50, duration: 1000, delay: 300 }}
			class="text-xl text-white opacity-90 leading-relaxed"
		  >
			A hidden gem in Bohol, where pristine waters meet vibrant marine life 
			and rich cultural heritage.
		  </p>
		</div>
	  </div>
	</div>
	{/if}
  
	<!-- Island Introduction -->
	<div class="max-w-7xl mx-auto px-4 py-20">
	  <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
		<div class="scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
		  <h2 class="text-3xl font-bold text-gray-900 mb-6">
			Paradise in the Philippines
		  </h2>
		  <p class="text-lg text-gray-600 leading-relaxed mb-6">
			Cabilao Island, nestled in the heart of the Bohol Sea, is a captivating 
			8-square-kilometer paradise known for its spectacular marine biodiversity 
			and pristine beaches. This small yet remarkable island offers world-class 
			diving experiences, with over 30 dive sites featuring dramatic wall dives 
			and vibrant coral gardens.
		  </p>
		  <p class="text-lg text-gray-600 leading-relaxed">
			Home to rare critters like pygmy seahorses and various species of nudibranchs, 
			Cabilao's waters are a photographer's dream and a marine enthusiast's paradise. 
			The island's protected marine sanctuaries ensure these underwater treasures 
			remain pristine for generations to come.
		  </p>
		</div>
		<div class="relative h-96 scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
		  <img 
			src="https://www.bohol-philippines.com/images/cabilao2.jpg" 
			alt="Cabilao coastline" 
			class="w-full h-full object-cover rounded-lg shadow-xl"
		  />
		</div>
	  </div>
	</div>
  
	<!-- Natural Wonders -->
	<div class="bg-gray-50 py-20">
	  <div class="max-w-7xl mx-auto px-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
		  <div class="order-2 md:order-1 grid grid-cols-2 gap-4">
			<div class="scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
			  <img 
				src="https://picsum.photos/600/800?random=22" 
				alt="Marine sanctuary" 
				class="w-full h-64 object-cover rounded-lg shadow-lg mb-4"
			  />
			  <img 
				src="https://picsum.photos/600/800?random=23" 
				alt="Beach sunset" 
				class="w-full h-48 object-cover rounded-lg shadow-lg"
			  />
			</div>
			<div class="mt-8 scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
			  <img 
				src="https://picsum.photos/600/800?random=24" 
				alt="Local wildlife" 
				class="w-full h-48 object-cover rounded-lg shadow-lg mb-4"
			  />
			  <img 
				src="https://picsum.photos/600/800?random=25" 
				alt="Island landscape" 
				class="w-full h-64 object-cover rounded-lg shadow-lg"
			  />
			</div>
		  </div>
		  <div class="order-1 md:order-2 scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
			<h2 class="text-3xl font-bold text-gray-900 mb-6">
			  Natural Wonders
			</h2>
			<p class="text-lg text-gray-600 leading-relaxed mb-8">
			  Beyond its underwater splendors, Cabilao boasts pristine white sand beaches, 
			  lush mangrove forests, and dramatic limestone cliffs. The island's lighthouse 
			  offers panoramic views of the surrounding Bohol Sea, while its untouched 
			  beaches provide perfect spots for sunset viewing and peaceful relaxation.
			</p>
			<ul class="grid grid-cols-2 gap-4">
			  {#each amenities as amenity}
				<li class="flex items-center text-gray-600">
				  <span class="text-blue-600 mr-2">✓</span>
				  {amenity}
				</li>
			  {/each}
			</ul>
		  </div>
		</div>
	  </div>
	</div>
  
	<!-- Experience Section -->
	<div class="max-w-7xl mx-auto px-4 py-20">
	  <div class="text-center max-w-3xl mx-auto mb-16 scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
		<h2 class="text-3xl font-bold text-gray-900 mb-6">
		  Island Experiences
		</h2>
		<p class="text-lg text-gray-600 leading-relaxed">
		  Immerse yourself in Cabilao's rich tapestry of experiences, from world-class 
		  diving to cultural encounters with the warm local community. Every corner of 
		  the island offers a new adventure waiting to be discovered.
		</p>
	  </div>
	  
	  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div class="relative group scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
		  <img 
			src="https://picsum.photos/600/400?random=26" 
			alt="Diving experience" 
			class="w-full h-64 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
		  />
		  <div class="absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
			<span class="text-white text-lg font-medium">World-Class Diving</span>
		  </div>
		</div>
		<div class="relative group scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
		  <img 
			src="https://picsum.photos/600/400?random=27" 
			alt="Cultural experience" 
			class="w-full h-64 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
		  />
		  <div class="absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
			<span class="text-white text-lg font-medium">Local Culture</span>
		  </div>
		</div>
		<div class="relative group scroll-fade opacity-0 translate-y-8 transition-all duration-1000 ease-out">
		  <img 
			src="https://picsum.photos/600/400?random=28" 
			alt="Beach experience" 
			class="w-full h-64 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
		  />
		  <div class="absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
			<span class="text-white text-lg font-medium">Beach Life</span>
		  </div>
		</div>
	  </div>
	</div>
  
	<!-- Booking CTA -->
	{#if isVisible}
	<div 
	  in:fade={{ duration: 1000 }}
	  class="max-w-7xl mx-auto px-4 py-20"
	>
	  <div class="bg-blue-600 rounded-2xl p-12 text-center relative overflow-hidden">
		<div class="relative z-10">
		  <h2 class="text-3xl font-bold text-white mb-4">
			Start Your Island Adventure
		  </h2>
		  <p class="text-xl text-blue-100 mb-8">
			Experience the magic of Cabilao Island - where every moment becomes an 
			unforgettable memory.
		  </p>
		  <button class="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200">
			Plan Your Visit
		  </button>
		</div>
	  </div>
	</div>
	{/if}
  </div>
  
  <style>
	/* Optional: Add smooth scrolling for the whole page */
	:global(html) {
	  scroll-behavior: smooth;
	}
  </style>