<script lang="ts">
	import { scrollState } from '$lib/stores/scrollStore';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let headerElement: HTMLElement | null = $state(null);
	let resizeObserver: ResizeObserver | null = null;
	let viewportHeight = $state(0);
	
	// Handle resize calculations
	function handleResize(entries: ResizeObserverEntry[]) {
	  const entry = entries[0];
	  if (entry) {
		const newWidth = Math.round(entry.contentRect.width);
		const newHeight = Math.round(entry.contentRect.height);
		
		if (newWidth !== containerWidth || newHeight !== containerHeight) {
		  requestAnimationFrame(() => {
			containerWidth = newWidth;
			containerHeight = newHeight;
		  });
		}
	  }
	}
	
	// Setup observer
	function setupResizeObserver() {
	  if (!headerElement || !browser) return;
	  
	  if (resizeObserver) {
		resizeObserver.disconnect();
	  }
	
	  resizeObserver = new ResizeObserver(handleResize);
	  resizeObserver.observe(headerElement);
	
	  // Initial measurement
	  setTimeout(() => {
		if (headerElement) {
		  const rect = headerElement.getBoundingClientRect();
		  containerWidth = Math.round(rect.width);
		  containerHeight = Math.round(rect.height);
		}
	  }, 0);
	}
	
	// Window resize handler
	function handleWindowResize() {
	  if (browser) {
		viewportHeight = window.innerHeight;
		
		if (headerElement) {
		  const rect = headerElement.getBoundingClientRect();
		  const newWidth = Math.round(rect.width);
		  const newHeight = Math.round(rect.height);
		  
		  if (newWidth !== containerWidth || newHeight !== containerHeight) {
			containerWidth = newWidth;
			containerHeight = newHeight;
		  }
		}
	  }
	}
	
	onMount(() => {
	  if (!browser) return;
	
	  viewportHeight = window.innerHeight;
	  
	  if (headerElement) {
		const rect = headerElement.getBoundingClientRect();
		containerWidth = Math.round(rect.width);
		containerHeight = Math.round(rect.height);
	  }
	  
	  setupResizeObserver();
	  window.addEventListener('resize', handleWindowResize);
	  handleWindowResize();
	});
	
	onDestroy(() => {
	  if (!browser) return;
	  
	  if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	  }
	  window.removeEventListener('resize', handleWindowResize);
	});
	
	$effect(() => {
	  if (headerElement && browser) {
		setupResizeObserver();
	  }
	});
	</script>
	
	<section class="relative min-h-screen bg-gradient-to-b from-[#15B392] to-[#264b45] z-10">
	  <div 
		class="content-container flex flex-col items-start justify-center" 
		bind:this={headerElement}
		style="min-height: {viewportHeight}px"
	  >
		<div
		  class="text-white leading-tight w-full fixed -top-0 md:top-16 left-0 md:left-14 z-30 transition-all duration-1000 {$scrollState.hadReachedMiddle ? 'opacity-100' : 'opacity-40'}"
		  style="z-index: {$scrollState.hasScrolled ? '5' : '30'}; filter: blur({$scrollState.hadReachedMiddle ? '0px' : '5px'})"
		>
		  <p
			class="font-bold pl-14 mb-2 md:mb-4 transition-transform duration-300"
			style="--base-size: {containerWidth && containerHeight ? 
			  `${Math.min(containerWidth * 0.15, containerHeight * 0.15)}px` : '2.5rem'}; 
			  font-size: clamp(2.5rem, var(--base-size), 5.2rem)"
		  >
			Dok
		  </p>
		  
		  <div class="flex flex-col items-center w-full p-4">
			<h1
			  class="transition-all duration-300 font-bold mb-3 md:mb-6 -mt-2 sm:-mt-3 md:-mt-4 w-full"
			  style="--base-size: {containerWidth && containerHeight ? 
				`${Math.min(containerWidth * 0.2, containerHeight * 0.2)}px` : '9.5rem'}; 
				font-size: clamp(5.5rem, var(--base-size), 16.2rem);
				line-height: 0.6"
			>
			  MUTYA
			</h1>
	
			<h1
			  class="transition-all duration-300 font-bold mb-3 md:mb-6 w-full -mt-2 sm:-mt-3 md:-mt-4"
			  style="--base-size: {containerWidth && containerHeight ? 
				`${Math.min(containerWidth * 0.2, containerHeight * 0.2)}px` : '10.5rem'}; 
				font-size: clamp(7.5rem, var(--base-size), 22.2rem);
				line-height: 1"
			>
			  TIROL
			</h1>
	
			<div class="flex items-center gap-2 sm:gap-3 md:gap-4 -mt-2 sm:-mt-3 md:mt-0 mb-3 md:mb-6 w-full">
			  <span class="text-xl sm:text-2xl md:text-3xl font-medium whitespace-nowrap">
				For FIRST DISTRICT
			  </span>
			  <div class="h-0.5 bg-white flex-grow max-w-[200px]"></div>
			</div>
	
			<h2 
			  class="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-8 w-full"
			  style="--base-size: {containerWidth && containerHeight ? 
				`${Math.min(containerWidth * 0.2, containerHeight * 0.2)}px` : '5.5rem'}; 
				font-size: clamp(4.5rem, var(--base-size), 6rem);
				line-height: 1"
			>
			  BOARD MEMBER
			</h2>
		  </div>
		</div>
	
		<div
		  class="flex flex-col space-y-3 absolute bottom-[7%] md:fixed md:bottom-[40%] md:left-[65%] left-1/2 -translate-x-1/2"
		  style="z-index: {$scrollState.hasScrolled ? '5' : '30'}"
		>
		  <img
			src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1738737910/Libreng_Serbisyo_zcaggh.webp"
			alt="Libreng Serbisyo"
			class="w-[150px] h-[150px] md:w-[350px] md:h-[350px] object-contain hover:scale-105 transition-transform cursor-pointer"
			style="filter: blur({$scrollState.hasScrolled ? '0px' : '10px'}); transition: filter 1000ms"
		  />
		</div>
	  </div>
	
	  <!-- Image Container -->
	  <div
		class="absolute bottom-0 w-screen overflow-visible transition-all duration-300 {$scrollState.hasScrolled ? 'blur-sm' : ''}"
		style="height: calc(93%); z-index: {$scrollState.hasScrolled ? '1' : '40'}"
	  >
		<img
		  src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1738468771/AOEwLogo_se84km.webp"
		  alt="AOEw Logo"
		  class="absolute bottom-0 max-w-none h-full object-bottom transform -translate-x-1/2 transition-all duration-300"
		  style="left: 66%"
		/>
	  </div>
	
	  <!-- Gradient Overlay -->
	  <div
		class="block absolute inset-0 w-full h-full bg-[#34635b] pointer-events-none transition-opacity duration-1000"
		style="opacity: {$scrollState.hasScrolled ? '0.5' : '0'}; z-index: {$scrollState.hasScrolled ? '3' : '0'}"
	  ></div>
	</section>
	
	<style>
	  :global(body) {
		margin: 0;
		padding: 0;
		width: 100%;
		overflow-x: hidden;
	  }
	
	  :global(#app) {
		overflow-x: hidden;
		width: 100%;
		position: relative;
	  }
	
	  section {
		width: 100vw;
		overflow: hidden;
		position: relative;
		mask-image: linear-gradient(to bottom, black 0%, black 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 100%);
	  }
	
	  .content-container {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
	  }
	</style>