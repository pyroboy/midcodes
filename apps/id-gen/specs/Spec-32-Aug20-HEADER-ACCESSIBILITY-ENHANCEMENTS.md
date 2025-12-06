# Spec-32-Aug20-HEADER-ACCESSIBILITY-ENHANCEMENTS

## Technical Specification: Header Accessibility Enhancements

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (2/10)  
**Scope:** Accessibility & WCAG Compliance

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Achieve WCAG 2.1 AA compliance** for header navigation
- **Add proper ARIA labels** and semantic HTML structure
- **Implement keyboard navigation** with focus management
- **Ensure color contrast compliance** for all header elements
- **Add screen reader support** with proper announcements
- **Keep bite-sized scope** - focus only on accessibility improvements

---

## Step 2 – Context Awareness

### Current Accessibility Issues

```typescript
// Issues found in MobileHeader.svelte:
1. Missing ARIA landmarks and labels
2. Dropdown not keyboard accessible
3. No focus management for mobile menu
4. SVG icons without proper alt text
5. Color contrast issues with gray text
6. Missing skip links for navigation
7. No screen reader announcements for state changes
```

### WCAG 2.1 Requirements for Navigation

```typescript
// Required accessibility features:
- Semantic navigation landmarks
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus indicators and management
- Screen reader announcements
- Color contrast ratios ≥ 4.5:1
- Alternative text for images/icons
- Consistent navigation order
```

---

## Step 3 – Spec Expansion

### Accessible Header Structure

```svelte
<!-- Enhanced MobileHeader.svelte with accessibility -->
<script lang="ts">
	import { createFocusTrap } from 'focus-trap';
	import { announce } from '@svelte-a11y/announcer';

	let { user, onMenuToggle } = $props();

	// Focus management
	let headerRef: HTMLElement;
	let dropdownRef: HTMLElement;
	let menuButtonRef: HTMLButtonElement;

	// Dropdown state with a11y
	let isDropdownOpen = $state(false);
	let focusTrap: any;

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;

		if (isDropdownOpen) {
			// Create focus trap
			focusTrap = createFocusTrap(dropdownRef, {
				escapeDeactivates: true,
				clickOutsideDeactivates: true,
				onDeactivate: () => {
					isDropdownOpen = false;
					menuButtonRef?.focus();
				}
			});
			focusTrap.activate();

			// Announce state change
			announce('User menu opened');
		} else {
			focusTrap?.deactivate();
			announce('User menu closed');
		}
	}

	// Keyboard navigation
	function handleDropdownKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'Escape':
				e.preventDefault();
				toggleDropdown();
				break;
			case 'ArrowDown':
				e.preventDefault();
				focusNextMenuItem();
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusPreviousMenuItem();
				break;
		}
	}

	function focusNextMenuItem() {
		const menuItems = dropdownRef.querySelectorAll('[role="menuitem"]');
		const currentIndex = Array.from(menuItems).findIndex((item) => item === document.activeElement);
		const nextIndex = (currentIndex + 1) % menuItems.length;
		(menuItems[nextIndex] as HTMLElement)?.focus();
	}

	function focusPreviousMenuItem() {
		const menuItems = dropdownRef.querySelectorAll('[role="menuitem"]');
		const currentIndex = Array.from(menuItems).findIndex((item) => item === document.activeElement);
		const prevIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
		(menuItems[prevIndex] as HTMLElement)?.focus();
	}
</script>

<!-- Skip to main content link -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-white px-4 py-2 rounded-md"
>
	Skip to main content
</a>

<header
	bind:this={headerRef}
	role="banner"
	aria-label="Site header"
	class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
>
	<nav role="navigation" aria-label="Main navigation">
		<div class="px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<!-- Left: Menu + Logo -->
				<div class="flex items-center gap-3">
					<button
						bind:this={menuButtonRef}
						type="button"
						class="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						onclick={() => onMenuToggle?.()}
						aria-label="Open main menu"
						aria-expanded="false"
						aria-controls="mobile-menu"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>

					<a
						href="/"
						class="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
						aria-label="ID Generator home"
					>
						<div
							class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
							role="img"
							aria-label="ID Generator logo"
						>
							<svg class="h-5 w-5 text-white" aria-hidden="true">
								<!-- Logo SVG -->
							</svg>
						</div>
						<span class="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
							ID Generator
						</span>
					</a>
				</div>

				<!-- Right: User controls -->
				{#if user}
					<div class="flex items-center gap-3">
						<!-- Credits display with proper labeling -->
						<div
							class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full"
							role="status"
							aria-label="Account credits"
						>
							<svg class="h-4 w-4 text-primary" aria-hidden="true">
								<!-- Credit icon -->
							</svg>
							<span class="text-sm font-medium text-gray-900 dark:text-white">
								{user.credits ?? 0}
							</span>
							<span class="sr-only">credits remaining</span>
						</div>

						<!-- User dropdown with proper ARIA -->
						<div class="relative">
							<button
								type="button"
								class="relative h-10 w-10 rounded-full bg-primary text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								onclick={toggleDropdown}
								aria-label="User account menu"
								aria-expanded={isDropdownOpen}
								aria-haspopup="true"
								aria-controls="user-menu"
							>
								<span class="sr-only">Open user menu</span>
								<span class="text-sm font-medium">
									{user.email?.substring(0, 2).toUpperCase() || 'U'}
								</span>
							</button>

							{#if isDropdownOpen}
								<div
									bind:this={dropdownRef}
									id="user-menu"
									role="menu"
									aria-orientation="vertical"
									aria-labelledby="user-button"
									class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
									on:keydown={handleDropdownKeydown}
								>
									<!-- Menu items with proper roles -->
									<a
										href="/account"
										role="menuitem"
										class="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
									>
										Account Settings
									</a>

									<button
										type="submit"
										role="menuitem"
										class="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 focus:outline-none"
									>
										Sign Out
									</button>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<a
						href="/auth"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
					>
						Sign In
					</a>
				{/if}
			</div>
		</div>
	</nav>
</header>

<!-- Main content landmark -->
<main id="main-content" role="main" aria-label="Main content">
	<!-- Page content -->
</main>
```

### Screen Reader Announcements

```typescript
// src/lib/utils/announcements.ts
import { announce } from '@svelte-a11y/announcer';

export function announceNavigation(routeName: string) {
	announce(`Navigated to ${routeName}`);
}

export function announceMenuState(isOpen: boolean, menuType: string) {
	const state = isOpen ? 'opened' : 'closed';
	announce(`${menuType} menu ${state}`);
}

export function announceCreditsUpdate(credits: number) {
	announce(`Credits updated. You have ${credits} credits remaining.`);
}

export function announceError(message: string) {
	announce(`Error: ${message}`, 'assertive');
}
```

### Color Contrast Compliance

```css
/* Enhanced contrast ratios */
:root {
	/* Text colors with proper contrast */
	--text-primary: #111827; /* 4.5:1 contrast on white */
	--text-secondary: #4b5563; /* 4.5:1 contrast on white */
	--text-muted: #6b7280; /* 4.5:1 contrast on light backgrounds */

	/* Focus ring with high contrast */
	--focus-ring: 0 0 0 2px #3b82f6;
	--focus-ring-offset: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* Dark mode contrast adjustments */
.dark {
	--text-primary: #f9fafb; /* High contrast on dark */
	--text-secondary: #d1d5db; /* 4.5:1 contrast on dark */
	--text-muted: #9ca3af; /* 4.5:1 contrast on dark backgrounds */
}

/* Focus indicators */
.focus-visible {
	outline: 2px solid var(--primary);
	outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
	:root {
		--text-primary: #000000;
		--text-secondary: #000000;
		--border-color: #000000;
	}

	.dark {
		--text-primary: #ffffff;
		--text-secondary: #ffffff;
		--border-color: #ffffff;
	}
}
```

---

## Step 4 – Implementation Guidance

### Keyboard Navigation Implementation

```svelte
<!-- Enhanced keyboard navigation -->
<script lang="ts">
	// Keyboard navigation handler
	function handleGlobalKeydown(e: KeyboardEvent) {
		// Alt + M: Open main menu
		if (e.altKey && e.key === 'm') {
			e.preventDefault();
			onMenuToggle?.();
			announce('Main menu opened with Alt+M');
		}

		// Alt + U: Focus user menu
		if (e.altKey && e.key === 'u' && user) {
			e.preventDefault();
			userMenuButton?.focus();
			announce('User menu focused with Alt+U');
		}

		// Alt + S: Focus search (when implemented)
		if (e.altKey && e.key === 's') {
			e.preventDefault();
			searchButton?.focus();
			announce('Search focused with Alt+S');
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleGlobalKeydown);
		return () => document.removeEventListener('keydown', handleGlobalKeydown);
	});
</script>
```

### Mobile Menu Accessibility

```svelte
<!-- Enhanced HamburgerMenu.svelte with accessibility -->
<script lang="ts">
	import { createFocusTrap } from 'focus-trap';

	let { isOpen, onClose } = $props();
	let menuRef: HTMLElement;
	let focusTrap: any;

	$effect(() => {
		if (isOpen && menuRef) {
			// Create focus trap for mobile menu
			focusTrap = createFocusTrap(menuRef, {
				escapeDeactivates: true,
				clickOutsideDeactivates: true,
				onDeactivate: () => onClose?.()
			});
			focusTrap.activate();

			// Prevent body scroll
			document.body.style.overflow = 'hidden';

			announce('Navigation menu opened');
		} else {
			focusTrap?.deactivate();
			document.body.style.overflow = '';

			if (!isOpen) {
				announce('Navigation menu closed');
			}
		}
	});
</script>

{#if isOpen}
	<div
		bind:this={menuRef}
		role="dialog"
		aria-modal="true"
		aria-labelledby="menu-title"
		class="fixed inset-0 z-50 lg:hidden"
	>
		<!-- Backdrop -->
		<div class="fixed inset-0 bg-black/50" onclick={onClose} aria-hidden="true"></div>

		<!-- Menu panel -->
		<nav
			role="navigation"
			aria-label="Mobile navigation"
			class="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl overflow-y-auto"
		>
			<h2 id="menu-title" class="sr-only">Navigation Menu</h2>

			<!-- Menu content with proper navigation structure -->
			<ul role="list" class="p-4 space-y-2">
				{#each navItems as item}
					<li>
						<a
							href={item.href}
							class="block px-3 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 focus:outline-none"
							onclick={onClose}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
{/if}
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 2/10)** – Minimal visual changes, focused on semantic markup and focus indicators
2. **UX Changes (Complexity: 4/10)** – Major accessibility improvements for screen readers and keyboard users
3. **Data Handling (Complexity: 1/10)** – No data structure changes, only presentation enhancements
4. **Function Logic (Complexity: 3/10)** – Focus management, keyboard navigation, and screen reader support
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems, only accessibility layer

**Estimated Development Time:** 2-3 hours  
**Accessibility Impact**: Achieves WCAG 2.1 AA compliance, supports screen readers and keyboard navigation  
**Success Criteria:** All header elements keyboard accessible, proper ARIA labels, 4.5:1 contrast ratios, focus management working
