# Spec-28-Aug20-HEADER-BREADCRUMB-NAVIGATION

## Technical Specification: Header Breadcrumb Navigation

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (3/10)  
**Scope:** UX Enhancement & Navigation Improvement

---

## Step 1 – Requirement Extraction

### Core Requirements
- **Add breadcrumb navigation** to MobileHeader for better user orientation
- **Show current page context** with dynamic breadcrumb based on route
- **Implement responsive breadcrumbs** that work on mobile and desktop
- **Add navigation shortcuts** for quick access to parent routes
- **Keep mobile-optimized design** with collapsible breadcrumbs if needed
- **Keep bite-sized scope** - focus only on breadcrumb component integration

---

## Step 2 – Context Awareness

### Current Header Layout Analysis
```typescript
// Current MobileHeader.svelte structure:
<header>
  <div class="flex justify-between items-center h-16">
    <div class="flex items-center gap-3">
      <HamburgerButton />
      <Logo />
    </div>
    <div class="flex items-center gap-3">
      <Credits />
      <UserDropdown />
    </div>
  </div>
</header>
```

### Route Structure for Breadcrumbs
```typescript
// App route hierarchy:
/ (Home)
├── /templates (Templates)
│   └── /templates?id=abc (Edit Template)
├── /use-template/[id] (Generate ID)
├── /all-ids (View IDs)
├── /account (Account)
├── /admin (Admin)
│   ├── /admin/users (User Management)
│   └── /admin/credits (Credit Management)
└── /auth (Authentication)
```

---

## Step 3 – Spec Expansion

### Enhanced Header Layout
```typescript
// New header structure with breadcrumbs:
<header>
  <div class="h-16">
    <!-- Top row: Logo + User controls -->
    <div class="flex justify-between items-center h-12">
      <div class="flex items-center gap-3">
        <HamburgerButton />
        <Logo />
      </div>
      <div class="flex items-center gap-3">
        <Credits />
        <UserDropdown />
      </div>
    </div>
    
    <!-- Bottom row: Breadcrumbs (when needed) -->
    <div class="h-4 flex items-center px-4">
      <Breadcrumbs />
    </div>
  </div>
</header>
```

### Breadcrumb Component Design
```svelte
<!-- Breadcrumb.svelte -->
<nav aria-label="Breadcrumb" class="flex items-center space-x-2 text-sm">
  {#each breadcrumbs as crumb, index}
    {#if index < breadcrumbs.length - 1}
      <a 
        href={crumb.href} 
        class="text-gray-500 hover:text-gray-700 transition-colors"
      >
        {crumb.label}
      </a>
      <ChevronRight class="h-3 w-3 text-gray-400" />
    {:else}
      <span class="text-gray-900 font-medium">
        {crumb.label}
      </span>
    {/if}
  {/each}
</nav>
```

### Dynamic Breadcrumb Logic
```typescript
// Breadcrumb generation based on current route
function generateBreadcrumbs(pathname: string, params: any): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' }
  ];
  
  if (pathname.startsWith('/templates')) {
    breadcrumbs.push({ label: 'Templates', href: '/templates' });
    
    if (params.id) {
      breadcrumbs.push({ 
        label: 'Edit Template', 
        href: `/templates?id=${params.id}` 
      });
    }
  } else if (pathname.startsWith('/use-template/')) {
    breadcrumbs.push({ label: 'Templates', href: '/templates' });
    breadcrumbs.push({ 
      label: 'Generate ID', 
      href: pathname 
    });
  } else if (pathname.startsWith('/all-ids')) {
    breadcrumbs.push({ label: 'All IDs', href: '/all-ids' });
  } else if (pathname.startsWith('/admin')) {
    breadcrumbs.push({ label: 'Admin', href: '/admin' });
    
    if (pathname.includes('/users')) {
      breadcrumbs.push({ label: 'User Management', href: '/admin/users' });
    } else if (pathname.includes('/credits')) {
      breadcrumbs.push({ label: 'Credit Management', href: '/admin/credits' });
    }
  }
  
  return breadcrumbs;
}
```

---

## Step 4 – Implementation Guidance

### Breadcrumb Component Creation
```svelte
<!-- src/lib/components/ui/Breadcrumb.svelte -->
<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  
  interface BreadcrumbItem {
    label: string;
    href: string;
  }
  
  let { breadcrumbs = [] }: { breadcrumbs: BreadcrumbItem[] } = $props();
</script>

{#if breadcrumbs.length > 1}
  <nav 
    aria-label="Breadcrumb" 
    class="flex items-center space-x-1 text-xs md:text-sm overflow-x-auto"
  >
    {#each breadcrumbs as crumb, index}
      {#if index < breadcrumbs.length - 1}
        <a 
          href={crumb.href}
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                 transition-colors whitespace-nowrap px-1"
        >
          {crumb.label}
        </a>
        <ChevronRight class="h-3 w-3 text-gray-400 flex-shrink-0" />
      {:else}
        <span class="text-gray-900 dark:text-white font-medium whitespace-nowrap px-1">
          {crumb.label}
        </span>
      {/if}
    {/each}
  </nav>
{/if}
```

### Route-based Breadcrumb Service
```typescript
// src/lib/utils/breadcrumbs.ts
import { page } from '$app/stores';
import { derived } from 'svelte/store';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export const breadcrumbs = derived(
  page,
  ($page) => generateBreadcrumbs($page.url.pathname, $page.params)
);

function generateBreadcrumbs(pathname: string, params: Record<string, string>): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];
  
  // Always start with home for internal pages
  if (pathname !== '/') {
    crumbs.push({ label: 'Home', href: '/' });
  }
  
  // Route-specific breadcrumbs
  if (pathname.startsWith('/templates')) {
    crumbs.push({ label: 'Templates', href: '/templates' });
    
    if (pathname.includes('?id=') || params.id) {
      crumbs.push({ label: 'Edit Template', href: pathname });
    }
  } else if (pathname.startsWith('/use-template/')) {
    crumbs.push({ label: 'Templates', href: '/templates' });
    crumbs.push({ label: 'Generate ID', href: pathname });
  } else if (pathname === '/all-ids') {
    crumbs.push({ label: 'All IDs', href: '/all-ids' });
  } else if (pathname === '/account') {
    crumbs.push({ label: 'My Account', href: '/account' });
  } else if (pathname.startsWith('/admin')) {
    crumbs.push({ label: 'Admin', href: '/admin' });
    
    if (pathname === '/admin/users') {
      crumbs.push({ label: 'User Management', href: '/admin/users' });
    } else if (pathname === '/admin/credits') {
      crumbs.push({ label: 'Credit Management', href: '/admin/credits' });
    }
  }
  
  return crumbs;
}
```

### MobileHeader Integration
```svelte
<!-- Enhanced MobileHeader.svelte -->
<script lang="ts">
  import { breadcrumbs } from '$lib/utils/breadcrumbs';
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
  
  // ... existing imports and logic
</script>

<header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
  <div class="px-4 sm:px-6 lg:px-8">
    <!-- Main header row -->
    <div class="flex justify-between items-center h-16">
      <!-- Left: Hamburger Menu + Logo -->
      <div class="flex items-center gap-3">
        <!-- ... existing hamburger and logo ... -->
      </div>
      
      <!-- Right: Credits + User Account -->
      <div class="flex items-center gap-3">
        <!-- ... existing credits and user dropdown ... -->
      </div>
    </div>
    
    <!-- Breadcrumb row (only show when breadcrumbs exist) -->
    {#if $breadcrumbs.length > 1}
      <div class="pb-2 border-t border-gray-100 dark:border-gray-800 pt-2">
        <Breadcrumb breadcrumbs={$breadcrumbs} />
      </div>
    {/if}
  </div>
</header>
```

### Mobile Optimization
```css
/* Mobile breadcrumb styling */
.breadcrumb-mobile {
  /* Horizontal scroll on very small screens */
  @apply overflow-x-auto scrollbar-hide;
  
  /* Hide breadcrumbs on very small screens if too crowded */
  @screen sm {
    @apply block;
  }
}

/* Smooth scroll for touch devices */
.breadcrumb-mobile {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.breadcrumb-mobile::-webkit-scrollbar {
  display: none;
}
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 3/10)** – New breadcrumb component with responsive design and route-based navigation
2. **UX Changes (Complexity: 4/10)** – Significant navigation improvement helping users understand their location
3. **Data Handling (Complexity: 2/10)** – Route-based breadcrumb generation using page store
4. **Function Logic (Complexity: 3/10)** – Dynamic breadcrumb logic and responsive component integration
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems, only navigation enhancement

**Estimated Development Time:** 2-3 hours  
**UX Impact**: Major improvement in user orientation and navigation  
**Success Criteria:** Breadcrumbs show on all relevant pages, responsive design works on mobile, improves navigation clarity