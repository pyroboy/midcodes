# Spec-29-Aug20-HEADER-LOADING-STATES

## Technical Specification: Header Loading States & Performance

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (2/10)  
**Scope:** Performance & UX Enhancement

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Add proper loading states** for credits display instead of showing "---"
- **Implement skeleton loaders** for header components during initial load
- **Optimize header performance** by reducing unnecessary re-renders
- **Add smooth transitions** for loading state changes
- **Handle error states** gracefully when data fails to load
- **Keep bite-sized scope** - focus only on loading states and performance

---

## Step 2 – Context Awareness

### Current Loading Issues in MobileHeader

```typescript
// Current problematic code:
<span class="text-sm font-medium text-gray-900 dark:text-white">
  {user.credits ?? '---'}  // Shows "---" while loading
</span>

// Issues identified:
1. No loading indicators
2. "---" placeholder is confusing
3. No error handling if credits fail to load
4. Heavy re-renders on user data changes
5. Inline SVG icons instead of cached components
```

### Performance Analysis

- **Header re-renders** on every user data update
- **Dropdown content** always rendered even when closed
- **SVG icons** inlined instead of using cached Lucide components
- **No memoization** of computed values like user initials

---

## Step 3 – Spec Expansion

### Loading State Architecture

```typescript
// Enhanced loading state management:
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface HeaderState {
	credits: {
		value: number | null;
		state: LoadingState;
		error?: string;
	};
	user: {
		data: User | null;
		state: LoadingState;
	};
}
```

### Component Loading States

#### Credits Loading Component

```svelte
<!-- CreditsDisplay.svelte -->
<script lang="ts">
	let { user, isLoading = false } = $props();

	$: creditsValue = user?.credits;
	$: hasCredits = typeof creditsValue === 'number';
</script>

<div class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
	<CreditCardIcon class="h-4 w-4 text-primary" />

	{#if isLoading}
		<!-- Loading skeleton -->
		<div class="animate-pulse">
			<div class="h-4 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
		</div>
	{:else if hasCredits}
		<!-- Actual credits -->
		<span class="text-sm font-medium text-gray-900 dark:text-white">
			{creditsValue}
		</span>
		<span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline"> credits </span>
	{:else}
		<!-- Error or no data state -->
		<span class="text-sm font-medium text-gray-500 dark:text-gray-400"> -- </span>
	{/if}
</div>
```

#### User Avatar Loading Component

```svelte
<!-- UserAvatar.svelte -->
<script lang="ts">
	import { derived } from 'svelte/store';

	let { user, isLoading = false } = $props();

	// Memoize user initials calculation
	const userInitials = derived(
		() => user?.email,
		(email) => {
			if (!email) return 'U';
			return email.substring(0, 2).toUpperCase();
		}
	);
</script>

<Button variant="ghost" class="relative h-10 w-10 rounded-full" aria-label="User account menu">
	{#if isLoading}
		<!-- Loading skeleton -->
		<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
	{:else}
		<!-- User avatar -->
		<div
			class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium"
		>
			{$userInitials}
		</div>
	{/if}
</Button>
```

### Header Performance Optimizations

#### Lazy Dropdown Content

```svelte
<!-- Optimized dropdown - only render when open -->
{#if isDropdownOpen}
	<div class="dropdown-content" transition:fade={{ duration: 150 }}>
		<!-- Dropdown content only rendered when needed -->
	</div>
{/if}
```

#### Icon Component Optimization

```svelte
<!-- Replace inline SVG with cached Lucide components -->
<script lang="ts">
	import { Menu, CreditCard, User, Settings, LogOut } from '@lucide/svelte';
</script>

<!-- Before: Inline SVG -->
<svg
	xmlns="http://www.w3.org/2000/svg"
	class="h-6 w-6"
	fill="none"
	viewBox="0 0 24 24"
	stroke="currentColor"
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M4 6h16M4 12h16M4 18h16"
	/>
</svg>

<!-- After: Cached Lucide component -->
<Menu class="h-6 w-6" />
```

---

## Step 4 – Implementation Guidance

### Enhanced MobileHeader with Loading States

```svelte
<!-- src/lib/components/MobileHeader.svelte -->
<script lang="ts">
	import { Menu, CreditCard, User, ChevronDown } from '@lucide/svelte';
	import CreditsDisplay from './ui/CreditsDisplay.svelte';
	import UserAvatar from './ui/UserAvatar.svelte';

	let { user, onMenuToggle } = $props();

	// Loading state management
	let isUserLoading = $state(!user);
	let isCreditsLoading = $state(!user?.credits && user?.credits !== 0);

	// Reactive loading states
	$effect(() => {
		isUserLoading = !user;
		isCreditsLoading = user && (user.credits === undefined || user.credits === null);
	});

	// Memoized computed values
	const userInitials = $derived(() => {
		if (!user?.email) return 'U';
		return user.email.substring(0, 2).toUpperCase();
	});

	// Dropdown state with performance optimization
	let isDropdownOpen = $state(false);
	let dropdownTimeout: number;

	function toggleDropdown() {
		clearTimeout(dropdownTimeout);
		isDropdownOpen = !isDropdownOpen;
	}

	function closeDropdown() {
		dropdownTimeout = setTimeout(() => {
			isDropdownOpen = false;
		}, 100); // Small delay for better UX
	}
</script>

<header
	class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
>
	<div class="px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Left: Hamburger Menu + Logo -->
			<div class="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					class="lg:hidden"
					onclick={() => onMenuToggle?.()}
					aria-label="Open menu"
				>
					<Menu class="h-6 w-6" />
				</Button>

				<a href="/" class="flex items-center gap-2">
					<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<CreditCard class="h-5 w-5 text-white" />
					</div>
					<span class="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
						ID Generator
					</span>
				</a>
			</div>

			<!-- Right: Credits + User Account -->
			{#if user || isUserLoading}
				<div class="flex items-center gap-3">
					<!-- Credits with loading state -->
					<CreditsDisplay {user} isLoading={isCreditsLoading} />

					<!-- User Avatar with loading state -->
					<div class="relative">
						<UserAvatar {user} isLoading={isUserLoading} onclick={toggleDropdown} />

						<!-- Optimized dropdown - only render when open -->
						{#if isDropdownOpen && !isUserLoading}
							<!-- Backdrop -->
							<div
								class="fixed inset-0 z-40"
								onclick={closeDropdown}
								onkeydown={(e) => e.key === 'Escape' && closeDropdown()}
								role="button"
								tabindex="-1"
								aria-label="Close dropdown"
							></div>

							<!-- Dropdown Content -->
							<div class="dropdown-content" transition:fade={{ duration: 150 }}>
								<!-- Dropdown menu items -->
								<!-- ... existing dropdown content ... -->
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Sign in button with loading state -->
				<Button href="/auth" variant="default" size="sm">Sign In</Button>
			{/if}
		</div>
	</div>
</header>

<style>
	.dropdown-content {
		@apply absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50;
	}
</style>
```

### Skeleton Loader Components

```svelte
<!-- src/lib/components/ui/SkeletonLoader.svelte -->
<script lang="ts">
	let { class: className = '', width = 'w-full', height = 'h-4' } = $props();
</script>

<div
	class="animate-pulse bg-gray-300 dark:bg-gray-600 rounded {width} {height} {className}"
	aria-label="Loading..."
></div>
```

### Error Handling for Credits

```svelte
<!-- Enhanced CreditsDisplay with error handling -->
<script lang="ts">
	import { onMount } from 'svelte';

	let { user } = $props();
	let creditsError = $state(null);
	let isRetrying = $state(false);

	async function retryLoadCredits() {
		isRetrying = true;
		try {
			// Trigger user data refresh
			await fetch('/api/user/refresh', { method: 'POST' });
			creditsError = null;
		} catch (error) {
			creditsError = 'Failed to load credits';
		} finally {
			isRetrying = false;
		}
	}
</script>

<div class="credits-display">
	{#if creditsError}
		<button
			onclick={retryLoadCredits}
			class="text-xs text-red-500 hover:text-red-700"
			disabled={isRetrying}
		>
			{isRetrying ? 'Retrying...' : 'Retry'}
		</button>
	{:else}
		<!-- Normal credits display -->
	{/if}
</div>
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 3/10)** – Skeleton loaders, smooth loading transitions, and improved visual feedback
2. **UX Changes (Complexity: 4/10)** – Much better loading experience with clear states and error handling
3. **Data Handling (Complexity: 2/10)** – Enhanced loading state management and error recovery
4. **Function Logic (Complexity: 2/10)** – Memoization, performance optimizations, and loading logic
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems, only loading improvements

**Estimated Development Time:** 1-2 hours  
**Performance Impact**: Reduced re-renders, better caching, smoother loading experience  
**Success Criteria:** No more "---" placeholders, smooth loading states, error handling works, better performance
