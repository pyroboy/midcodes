# Spec-33-Aug20-HEADER-ANIMATION-POLISH

## Technical Specification: Header Animation & Polish

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (2/10)  
**Scope:** UX Polish & Micro-interactions

---

## Step 1 – Requirement Extraction

### Core Requirements
- **Add smooth micro-animations** for header interactions (hover, focus, state changes)
- **Implement header scroll behavior** with show/hide animation
- **Create polished dropdown animations** with proper easing and timing
- **Add loading state animations** for credits and user data
- **Improve visual feedback** for all interactive elements
- **Keep bite-sized scope** - focus only on animation and polish improvements

---

## Step 2 – Context Awareness

### Current Animation Issues
```typescript
// Issues in MobileHeader.svelte:
1. No hover animations on interactive elements
2. Abrupt dropdown show/hide without transitions
3. No scroll-based header behavior
4. Missing loading state animations
5. No visual feedback for touch interactions
6. Credits and user data updates without smooth transitions
```

### Animation Performance Requirements
```typescript
// Performance considerations:
- Use CSS transforms instead of layout properties
- Leverage GPU acceleration with transform3d
- Respect prefers-reduced-motion settings
- Keep animations under 300ms for responsiveness
- Use will-change sparingly and clean up
```

---

## Step 3 – Spec Expansion

### Scroll-Based Header Animation
```svelte
<!-- Enhanced MobileHeader.svelte with scroll behavior -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { spring } from 'svelte/motion';
  
  let { user, onMenuToggle } = $props();
  
  // Scroll state management
  let isScrolled = $state(false);
  let isHeaderVisible = $state(true);
  let lastScrollY = $state(0);
  
  // Smooth header transform
  const headerTransform = spring(0, {
    stiffness: 0.1,
    damping: 0.8
  });
  
  // Scroll handler with throttling
  let ticking = false;
  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Show/hide header based on scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - hide header
          isHeaderVisible = false;
          headerTransform.set(-64); // Header height
        } else {
          // Scrolling up - show header
          isHeaderVisible = true;
          headerTransform.set(0);
        }
        
        // Add shadow when scrolled
        isScrolled = currentScrollY > 10;
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  }
  
  onMount(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  });
</script>

<header 
  class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out
         {isScrolled ? 'shadow-md' : 'shadow-none'}"
  style="transform: translateY({$headerTransform}px)"
>
  <!-- Header content -->
</header>
```

### Animated Dropdown Component
```svelte
<!-- AnimatedDropdown.svelte -->
<script lang="ts">
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  let { isOpen, onClose, children } = $props();
  
  // Animation variants
  const dropdownVariants = {
    mobile: {
      in: { y: -10, opacity: 0 },
      out: { y: -10, opacity: 0 }
    },
    desktop: {
      in: { y: -8, opacity: 0, scale: 0.95 },
      out: { y: -8, opacity: 0, scale: 0.95 }
    }
  };
  
  // Detect if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const variant = isMobile ? dropdownVariants.mobile : dropdownVariants.desktop;
</script>

{#if isOpen}
  <!-- Backdrop with fade -->
  <div
    class="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
    transition:fade={{ duration: 200, easing: quintOut }}
    onclick={onClose}
    role="button"
    tabindex="-1"
    aria-label="Close dropdown"
  ></div>

  <!-- Dropdown content with combined animations -->
  <div
    class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    transition:fly={{
      y: variant.in.y,
      opacity: variant.in.opacity,
      duration: 200,
      easing: quintOut
    }}
    style="transform-origin: top right"
  >
    {@render children()}
  </div>
{/if}
```

### Interactive Element Animations
```css
/* Enhanced hover and focus animations */
.animated-button {
  @apply transition-all duration-200 ease-out;
  @apply hover:scale-105 hover:shadow-lg;
  @apply focus:scale-105 focus:shadow-lg;
  @apply active:scale-95;
  
  /* Add subtle glow effect */
  &:hover, &:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1),
                0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
}

.animated-link {
  @apply relative transition-colors duration-200 ease-out;
  
  /* Underline animation */
  &::after {
    content: '';
    @apply absolute bottom-0 left-0 h-0.5 bg-primary;
    width: 0;
    transition: width 0.3s ease-out;
  }
  
  &:hover::after,
  &:focus::after {
    width: 100%;
  }
}

/* Credits animation */
.credits-counter {
  @apply transition-all duration-500 ease-out;
  
  /* Number change animation */
  &.updating {
    @apply scale-110 text-primary;
    animation: pulse-glow 0.6s ease-out;
  }
}

@keyframes pulse-glow {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% { 
    transform: scale(1.05); 
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
}

/* Loading skeleton with shimmer */
.skeleton-shimmer {
  background: linear-gradient(90deg, 
    #f0f0f0 25%, 
    #e0e0e0 50%, 
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.dark .skeleton-shimmer {
  background: linear-gradient(90deg, 
    #374151 25%, 
    #4b5563 50%, 
    #374151 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animated-button,
  .animated-link,
  .credits-counter {
    transition: none;
  }
  
  .skeleton-shimmer {
    animation: none;
    background: #f0f0f0;
  }
  
  .dark .skeleton-shimmer {
    background: #374151;
  }
}
```

### Loading State Animations
```svelte
<!-- LoadingCredits.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  
  let { credits, isLoading } = $props();
  
  // Animated counter
  const displayCredits = tweened(0, {
    duration: 800,
    easing: cubicOut
  });
  
  // Update counter when credits change
  $effect(() => {
    if (typeof credits === 'number') {
      displayCredits.set(credits);
    }
  });
  
  // Format number with animation
  $: formattedCredits = Math.round($displayCredits).toLocaleString();
</script>

<div class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
  <svg class="h-4 w-4 text-primary" aria-hidden="true">
    <!-- Credit icon -->
  </svg>
  
  {#if isLoading}
    <!-- Animated loading skeleton -->
    <div class="skeleton-shimmer h-4 w-8 rounded"></div>
  {:else}
    <!-- Animated counter -->
    <span 
      class="text-sm font-medium text-gray-900 dark:text-white credits-counter"
      class:updating={$displayCredits !== credits}
    >
      {formattedCredits}
    </span>
    <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
      credits
    </span>
  {/if}
</div>
```

### Mobile Touch Animations
```svelte
<!-- TouchFeedback.svelte -->
<script lang="ts">
  let ripples = $state([]);
  let rippleId = 0;
  
  function createRipple(event: TouchEvent | MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    let x, y;
    if (event instanceof TouchEvent) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    
    const ripple = {
      id: rippleId++,
      x,
      y,
      size: Math.max(rect.width, rect.height) * 2
    };
    
    ripples = [...ripples, ripple];
    
    // Remove ripple after animation
    setTimeout(() => {
      ripples = ripples.filter(r => r.id !== ripple.id);
    }, 600);
  }
</script>

<button
  class="relative overflow-hidden"
  onmousedown={createRipple}
  ontouchstart={createRipple}
>
  <!-- Button content -->
  <slot />
  
  <!-- Ripple effects -->
  {#each ripples as ripple (ripple.id)}
    <span
      class="absolute pointer-events-none bg-white/30 rounded-full animate-ping"
      style="
        left: {ripple.x - ripple.size/2}px;
        top: {ripple.y - ripple.size/2}px;
        width: {ripple.size}px;
        height: {ripple.size}px;
        animation-duration: 0.6s;
      "
    ></span>
  {/each}
</button>
```

---

## Step 4 – Implementation Guidance

### Performance Optimization
```typescript
// src/lib/utils/animations.ts
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createOptimizedTransition(element: HTMLElement, config: any) {
  // Use will-change for performance
  element.style.willChange = 'transform, opacity';
  
  // Clean up after animation
  setTimeout(() => {
    element.style.willChange = 'auto';
  }, config.duration + 100);
  
  return config;
}

// Throttled scroll handler
export function throttleScroll(callback: Function, limit: number = 16) {
  let inThrottle: boolean;
  return function(...args: any[]) {
    if (!inThrottle) {
      callback.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}
```

### Animation State Management
```svelte
<!-- AnimationProvider.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Global animation settings
  const animationSettings = writable({
    reducedMotion: false,
    headerScrollBehavior: true,
    microInteractions: true,
    loadingAnimations: true
  });
  
  // Check user preferences
  onMount(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    animationSettings.update(settings => ({
      ...settings,
      reducedMotion: prefersReducedMotion
    }));
  });
  
  setContext('animations', animationSettings);
</script>

<slot />
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 3/10)** – Smooth animations, scroll behavior, loading states, and micro-interactions
2. **UX Changes (Complexity: 4/10)** – Significantly more polished and responsive user experience
3. **Data Handling (Complexity: 1/10)** – No data structure changes, only visual enhancements
4. **Function Logic (Complexity: 2/10)** – Animation logic, scroll handling, and performance optimization
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems, only presentation layer

**Estimated Development Time:** 2-3 hours  
**UX Impact**: Major polish improvement with smooth animations and better visual feedback  
**Success Criteria:** All animations smooth and performant, respects reduced motion preferences, improves perceived performance