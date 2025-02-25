<script lang="ts">
    // Default maintenance message
    let maintenanceMessage = "We're updating our site to better serve the March of Faith community. Please check back soon!";
    
    // Import onMount from svelte
    import { onMount } from 'svelte';
    
    onMount(() => {
      // Use TypeScript type assertions to handle element selection
      const bgLogo = document.querySelector('.bg-logo-img') as HTMLElement | null;
      const starsContainer = document.querySelector('.stars-container') as HTMLElement | null;
      const mainContainer = document.querySelector('.main-container') as HTMLElement | null;
      
      // Keep track of alternating colors
      let isNextStarRed = true;
      
      function animateBackground() {
        if (!bgLogo) return; // Guard clause to prevent null errors
        
        // Gentle floating animation
        let y = 0;
        let direction = 1;
        
        setInterval(() => {
          if (y > 8) direction = -1;
          if (y < -8) direction = 1;
          
          y += 0.15 * direction;
          bgLogo.style.transform = `translateY(${y}px)`;
        }, 50);
      }
      
      // Function to create and animate a shooting star (laser)
// Function to create and animate a proper shooting star
const createShootingStar = (clientX?: number, clientY?: number) => {
  if (!starsContainer) return;
  
  // Create shooting star container
  const shootingStar = document.createElement('div');
  shootingStar.className = 'shooting-star-container';
  
  // Create star head
  const starHead = document.createElement('div');
  starHead.className = 'shooting-star-head';
  
  // Create star trail
  const starTrail = document.createElement('div');
  starTrail.className = 'shooting-star-trail';
  
  // Alternate between red and blue with slight variations
  const baseColor = isNextStarRed ? '#e63946' : '#457b9d';
  isNextStarRed = !isNextStarRed; // Toggle for next star
  
  // Size for the shooting star (3-5px for head)
  const headSize = Math.floor(Math.random() * 3) + 3; // 3-5px
  
  // Position logic - completely random if not clicked
  let startX, startY;
  
  if (typeof clientX === 'number' && typeof clientY === 'number') {
    // Use click position as starting point
    const containerRect = starsContainer.getBoundingClientRect();
    startX = ((clientX - containerRect.left) / containerRect.width) * 100;
    startY = ((clientY - containerRect.top) / containerRect.height) * 100;
  } else {
    // Random starting position near the top or sides of the screen
    const edge = Math.floor(Math.random() * 3); // 0: top, 1: right, 2: left
    
    if (edge === 0) { // Top edge
      startX = Math.random() * 100;
      startY = -5; // Slightly above the viewport
    } else if (edge === 1) { // Right edge
      startX = 105; // Slightly to the right of viewport
      startY = Math.random() * 50; // Top half
    } else { // Left edge
      startX = -5; // Slightly to the left of viewport
      startY = Math.random() * 50; // Top half
    }
  }
  
  // Calculate angle for natural trajectory
  let angle;
  
  if (startX < 0) { // Coming from left edge → move down-right
    angle = Math.random() * 30 + 15; // 15-45 degrees
  } else if (startX > 100) { // Coming from right edge → move down-left
    angle = Math.random() * 30 + 135; // 135-165 degrees
  } else { // Coming from top → move down at angle
    angle = Math.random() * 60 + 60; // 60-120 degrees
  }
  
  // Duration between 1-3 seconds (faster is more like a shooting star)
  const duration = Math.random() * 1500 + 1000; // 1-2.5 seconds
  
  // Set styles
  starHead.style.width = `${headSize}px`;
  starHead.style.height = `${headSize}px`;
  starHead.style.background = baseColor;
  
  starTrail.style.setProperty('--trail-width', `${headSize * 15}px`);
  starTrail.style.setProperty('--trail-height', `${headSize}px`);
  starTrail.style.setProperty('--base-color', baseColor);
  
  shootingStar.style.setProperty('--angle', `${angle}deg`);
  shootingStar.style.setProperty('--duration', `${duration}ms`);
  shootingStar.style.left = `${startX}%`;
  shootingStar.style.top = `${startY}%`;
  
  // Add to container structure
  shootingStar.appendChild(starTrail);
  shootingStar.appendChild(starHead);
  starsContainer.appendChild(shootingStar);
  
  // Remove after animation completes
  setTimeout(() => {
    if (shootingStar.parentNode) {
      shootingStar.parentNode.removeChild(shootingStar);
    }
  }, duration + 100); // Slightly longer than animation duration
};
      
      // Create automatic shooting stars
      function startShootingStars() {
        // Create a shooting star every 4 seconds (more frequent)
        setInterval(() => createShootingStar(), 4000);
        // Immediately create first star
        setTimeout(() => createShootingStar(), 500);
      }
      
      // Add click event for shooting stars
      if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
          createShootingStar(e.clientX, e.clientY);
        });
      }
      
      animateBackground();
      startShootingStars();
    });
    
    // URLs for social media links - using proper URLs to fix a11y warnings
    const twitterUrl = "https://twitter.com/marchoffaith";
    const facebookUrl = "https://facebook.com/marchoffaith";
  </script>
  
  <div class="main-container flex min-h-screen items-center justify-center bg-white p-4 relative overflow-hidden">
    <!-- Background Logo - Better centered and more visible -->
    <div class="absolute inset-0 flex items-center justify-center opacity-25">
      <img 
        src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1740474451/MOFI_web_logo_yrzxyh.webp" 
        alt="Background MOFI Logo" 
        class="bg-logo-img w-1/2 max-w-2xl blur-sm"
      />
    </div>
    
    <!-- Star-shaped twinkling elements -->
    <div class="stars-container absolute inset-0" aria-hidden="true">
      <!-- Regular stars -->
      {#each Array(60) as _, i}
        <div 
          class="absolute star-twinkle"
          style="
            --size: {Math.random() * 12 + 8}px;
            --color: {i % 3 === 0 ? '#e63946' : i % 3 === 1 ? '#457b9d' : '#e1e5eb'};
            top: {Math.random() * 100}%; 
            left: {Math.random() * 100}%; 
            opacity: {Math.random() * 0.7 + 0.3};
            animation: 
              twinkle {Math.random() * 2 + 1}s ease-in-out infinite alternate-reverse,
              float {Math.random() * 5 + 10}s ease-in-out infinite alternate-reverse;
            filter: blur({i % 5 === 0 ? '1px' : '0'});
          "
        ></div>
      {/each}
    </div>
    
    <div class="w-full max-w-md rounded-xl border border-red-100 bg-white p-8 shadow-xl z-10">
      <div class="flex flex-col items-center">
        <!-- Logo -->
        <div class="mb-6">
          <img 
            src="https://res.cloudinary.com/dexcw6vg0/image/upload/v1740474451/MOFI_web_logo_yrzxyh.webp" 
            alt="MOFI Logo" 
            class="h-24"
          />
        </div>
        
        <!-- Title -->
        <h1 class="mb-4 text-3xl font-bold text-red-700 tracking-tight text-center">
          Site Under Construction
        </h1>
        
        <!-- Description -->
        <p class="mb-8 text-center text-gray-700 text-lg">
          {maintenanceMessage}
        </p>
        
        <!-- Divider -->
        <div class="w-16 h-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-full mb-6"></div>
        
        <!-- Additional Information -->
        <div class="mt-2 text-center">
          <p class="text-xs text-red-500 italic mb-2">
            Click anywhere for a shooting star!
          </p>
          <p class="text-sm text-gray-600 mb-3">
            Follow our progress on:
          </p>
          <div class="flex justify-center space-x-6">
            <a href={twitterUrl} class="text-red-600 hover:text-red-800 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
              Twitter
            </a>
            <a href={facebookUrl} class="text-blue-600 hover:text-blue-800 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    /* Properly shaped 4-pointed star */
    .star-twinkle {
      position: absolute;
      width: var(--size);
      height: var(--size);
      background-color: var(--color);
      clip-path: polygon(50% 0%, 59% 42%, 91% 49%, 59% 58%, 50% 99%, 42% 58%, 11% 51%, 41% 43%);
      box-shadow: 0 0 15px var(--color), 0 0 5px var(--color);
      transform-origin: center;
      will-change: transform, opacity;
    }
    
    /* Laser-like shooting star - using :global() for dynamically created elements */
  /* Remove the old shooting star style */

/* Shooting star container */
:global(.shooting-star-container) {
  position: absolute;
  transform-origin: center;
  animation: shootingStar var(--duration) cubic-bezier(0.1, 0.4, 0.2, 0.9) forwards;
  z-index: 5;
  pointer-events: none;
  overflow: visible;
  will-change: transform, opacity;
}

/* Shooting star head (the bright main body) */
:global(.shooting-star-head) {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  filter: blur(0.5px);
  box-shadow: 0 0 6px 1px white, 0 0 10px 2px var(--base-color);
  z-index: 2;
  animation: twinkleHead 0.15s ease-in-out infinite alternate;
}

/* Shooting star trail */
:global(.shooting-star-trail) {
  position: absolute;
  width: var(--trail-width);
  height: var(--trail-height);
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.1) 20%, 
    rgba(255, 255, 255, 0.4) 60%, 
    var(--base-color) 85%, 
    white 98%);
  border-radius: 50% 0 0 50%;
  filter: blur(1px);
  opacity: 0.8;
  z-index: 1;
}

/* Define animations */
@keyframes shootingStar {
  0% {
    transform: rotate(var(--angle)) translateX(0) scale(0.1);
    opacity: 0;
  }
  5% {
    transform: rotate(var(--angle)) translateX(20px) scale(0.8);
    opacity: 1;
  }
  95% {
    opacity: 1;
    transform: rotate(var(--angle)) translateX(calc(150vh)) scale(1);
  }
  100% {
    transform: rotate(var(--angle)) translateX(calc(150vh + 50px)) scale(0.2);
    opacity: 0;
  }
}

@keyframes twinkleHead {
  0% {
    opacity: 0.8;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* CSS variables with TypeScript support */
:global(.shooting-star-container) {
  --angle: 45deg;
  --duration: 2000ms;
}

:global(.shooting-star-head) {
  --base-color: #e63946;
}

:global(.shooting-star-trail) {
  --trail-width: 60px;
  --trail-height: 4px;
  --base-color: #e63946;
}
    
    @keyframes twinkle {
      0% { 
        opacity: 0.3; 
        transform: scale(0.8) rotate(0deg); 
      }
      50% {
        opacity: 0.7;
        transform: scale(1.1) rotate(22.5deg);
      }
      100% { 
        opacity: 1; 
        transform: scale(1.3) rotate(45deg);
      }
    }
    
    @keyframes float {
      0% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-15px);
      }
      100% {
        transform: translateY(5px);
      }
    }
    
    @keyframes shoot {
      0% {
        transform: translateX(0) rotate(var(--angle));
        opacity: 0;
      }
      5% {
        opacity: 0.9;
      }
      100% {
        transform: translateX(150vw) rotate(var(--angle));
        opacity: 0;
      }
    }
    
    /* Make CSS vars work with proper TypeScript support */
    :global(.star-twinkle) {
      --size: 10px;
      --color: #e63946;
    }
    
    :global(.shooting-star) {
      --size: 3px;
      --color: #e63946;
      --angle: 45deg;
    }
  </style>