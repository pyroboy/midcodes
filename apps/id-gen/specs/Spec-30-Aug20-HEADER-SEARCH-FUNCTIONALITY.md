# Spec-30-Aug20-HEADER-SEARCH-FUNCTIONALITY

## Technical Specification: Header Search Functionality

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Medium (4/10)  
**Scope:** Navigation Enhancement & Quick Access

---

## Step 1 – Requirement Extraction

### Core Requirements
- **Add search functionality** to header for quick access to templates and IDs
- **Implement command palette style** search with keyboard shortcuts (Cmd/Ctrl+K)
- **Enable quick navigation** to templates, generated IDs, and common actions
- **Add search suggestions** based on user's recent activity and templates
- **Support mobile and desktop** with responsive search interface
- **Keep bite-sized scope** - focus only on header search component integration

---

## Step 2 – Context Awareness

### Current Header Space Analysis
```typescript
// Current MobileHeader layout:
<div class="flex justify-between items-center h-16">
  <div class="flex items-center gap-3">
    <HamburgerButton />  // ~44px
    <Logo />             // ~120px on desktop, ~32px on mobile
  </div>
  <div class="flex items-center gap-3">
    <Credits />          // ~80px
    <UserDropdown />     // ~44px
  </div>
</div>

// Available space for search: ~200px on mobile, ~400px on desktop
```

### Search Scope & Data Sources
```typescript
// Searchable content:
1. Templates - user's templates by name and description
2. Generated IDs - recent ID cards by name or ID number
3. Navigation - pages and routes
4. Actions - "Create Template", "Generate ID", etc.
```

---

## Step 3 – Spec Expansion

### Search Component Architecture
```typescript
// Search component types:
interface SearchItem {
  id: string;
  type: 'template' | 'id-card' | 'navigation' | 'action';
  title: string;
  subtitle?: string;
  href?: string;
  action?: () => void;
  icon: ComponentType;
  keywords: string[];
}

interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchItem[];
  selectedIndex: number;
  isLoading: boolean;
}
```

### Enhanced Header Layout with Search
```svelte
<!-- Updated header layout -->
<div class="flex justify-between items-center h-16">
  <!-- Left: Hamburger + Logo (compact on mobile) -->
  <div class="flex items-center gap-2">
    <HamburgerButton />
    <Logo compact={true} />  <!-- Compact logo on all screens -->
  </div>
  
  <!-- Center: Search (hidden on small mobile) -->
  <div class="flex-1 max-w-md mx-4 hidden sm:block">
    <SearchTrigger />
  </div>
  
  <!-- Right: Search icon (mobile) + Credits + User -->
  <div class="flex items-center gap-2">
    <SearchButton class="sm:hidden" />  <!-- Mobile search button -->
    <Credits />
    <UserDropdown />
  </div>
</div>
```

### Command Palette Search Component
```svelte
<!-- SearchCommand.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Template, CreditCard, Navigation, Zap } from '@lucide/svelte';
  
  let { isOpen = false, onClose } = $props();
  
  let query = $state('');
  let results = $state([]);
  let selectedIndex = $state(0);
  let isLoading = $state(false);
  
  // Search data sources
  let searchData = $state({
    templates: [],
    idCards: [],
    navigation: [
      { title: 'Templates', href: '/templates', icon: Template },
      { title: 'All IDs', href: '/all-ids', icon: CreditCard },
      { title: 'My Account', href: '/account', icon: User },
      { title: 'Admin Panel', href: '/admin', icon: Settings },
    ],
    actions: [
      { title: 'Create New Template', action: () => goto('/templates'), icon: Plus },
      { title: 'Generate ID', action: () => goto('/templates'), icon: Zap },
    ]
  });
  
  // Keyboard shortcuts
  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      
      if (isOpen) {
        switch (e.key) {
          case 'Escape':
            closeSearch();
            break;
          case 'ArrowDown':
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            break;
          case 'Enter':
            e.preventDefault();
            selectResult(results[selectedIndex]);
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
  
  // Search logic
  async function performSearch(searchQuery: string) {
    if (!searchQuery.trim()) {
      results = getRecentItems();
      return;
    }
    
    isLoading = true;
    try {
      const searchResults = await Promise.all([
        searchTemplates(searchQuery),
        searchIdCards(searchQuery),
        searchNavigation(searchQuery),
        searchActions(searchQuery)
      ]);
      
      results = searchResults.flat().slice(0, 8); // Limit to 8 results
      selectedIndex = 0;
    } catch (error) {
      console.error('Search error:', error);
      results = [];
    } finally {
      isLoading = false;
    }
  }
  
  function selectResult(item: SearchItem) {
    if (item.href) {
      goto(item.href);
    } else if (item.action) {
      item.action();
    }
    closeSearch();
  }
</script>

<!-- Search Modal -->
{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/50" onclick={closeSearch}>
    <div class="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg mx-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <!-- Search Input -->
        <div class="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <Search class="h-5 w-5 text-gray-400 mr-3" />
          <input
            bind:value={query}
            on:input={() => performSearch(query)}
            placeholder="Search templates, IDs, or actions..."
            class="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
            autofocus
          />
          <kbd class="hidden sm:inline-flex h-5 px-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500">
            ESC
          </kbd>
        </div>
        
        <!-- Search Results -->
        <div class="max-h-80 overflow-y-auto">
          {#if isLoading}
            <div class="p-4 text-center text-gray-500">
              Searching...
            </div>
          {:else if results.length === 0}
            <div class="p-4 text-center text-gray-500">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          {:else}
            {#each results as item, index}
              <button
                class="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                       {index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''}"
                onclick={() => selectResult(item)}
              >
                <svelte:component this={item.icon} class="h-5 w-5 text-gray-400 mr-3" />
                <div class="flex-1 text-left">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </div>
                  {#if item.subtitle}
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {item.subtitle}
                    </div>
                  {/if}
                </div>
                <div class="text-xs text-gray-400 uppercase tracking-wider">
                  {item.type}
                </div>
              </button>
            {/each}
          {/if}
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1">
              <kbd class="px-1 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              to select
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
              to navigate
            </span>
          </div>
          <span class="flex items-center gap-1">
            <kbd class="px-1 bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd>
            to search
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
```

### Search Trigger Components
```svelte
<!-- SearchTrigger.svelte - Desktop version -->
<button
  onclick={openSearch}
  class="flex items-center w-full px-3 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 
         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
>
  <Search class="h-4 w-4 mr-2" />
  <span>Search templates, IDs...</span>
  <kbd class="ml-auto px-1 bg-white dark:bg-gray-700 rounded text-xs">
    ⌘K
  </kbd>
</button>

<!-- SearchButton.svelte - Mobile version -->
<Button
  variant="ghost"
  size="icon"
  onclick={openSearch}
  aria-label="Search"
  class="sm:hidden"
>
  <Search class="h-5 w-5" />
</Button>
```

---

## Step 4 – Implementation Guidance

### Search Data Integration
```typescript
// src/lib/utils/search.ts
import { page } from '$app/stores';
import { supabase } from '$lib/supabase';

export async function searchTemplates(query: string): Promise<SearchItem[]> {
  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, description')
    .ilike('name', `%${query}%`)
    .limit(3);
    
  return templates?.map(template => ({
    id: template.id,
    type: 'template',
    title: template.name,
    subtitle: template.description,
    href: `/templates?id=${template.id}`,
    icon: Template,
    keywords: [template.name, template.description || '']
  })) || [];
}

export async function searchIdCards(query: string): Promise<SearchItem[]> {
  const { data: idCards } = await supabase
    .from('idcards')
    .select('id, card_data')
    .limit(3);
    
  // Search in card_data JSON for names/IDs
  return idCards?.filter(card => {
    const cardData = card.card_data;
    const searchableText = Object.values(cardData).join(' ').toLowerCase();
    return searchableText.includes(query.toLowerCase());
  }).map(card => ({
    id: card.id,
    type: 'id-card',
    title: getCardDisplayName(card.card_data),
    subtitle: 'Generated ID Card',
    href: `/all-ids?highlight=${card.id}`,
    icon: CreditCard,
    keywords: Object.values(card.card_data)
  })) || [];
}

export function searchNavigation(query: string): SearchItem[] {
  const navItems = [
    { title: 'Templates', href: '/templates', icon: Template },
    { title: 'All IDs', href: '/all-ids', icon: CreditCard },
    { title: 'My Account', href: '/account', icon: User },
    { title: 'Admin Panel', href: '/admin', icon: Settings },
  ];
  
  return navItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  ).map(item => ({
    ...item,
    id: item.href,
    type: 'navigation',
    keywords: [item.title]
  }));
}
```

### Mobile-Optimized Search
```svelte
<!-- Mobile search modal with different layout -->
{#if isOpen}
  <div class="sm:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900">
    <!-- Mobile header -->
    <div class="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
      <button onclick={closeSearch} class="mr-4">
        <ArrowLeft class="h-6 w-6" />
      </button>
      <input
        bind:value={query}
        placeholder="Search..."
        class="flex-1 text-lg bg-transparent border-none outline-none"
        autofocus
      />
    </div>
    
    <!-- Mobile results -->
    <div class="p-4">
      <!-- Search results optimized for touch -->
    </div>
  </div>
{/if}
```

### Performance Optimizations
```typescript
// Debounced search to avoid excessive API calls
import { debounce } from 'lodash-es';

const debouncedSearch = debounce(async (query: string) => {
  await performSearch(query);
}, 300);

// Cache recent searches
const searchCache = new Map<string, SearchItem[]>();

function getCachedResults(query: string): SearchItem[] | null {
  return searchCache.get(query.toLowerCase()) || null;
}

function cacheResults(query: string, results: SearchItem[]): void {
  searchCache.set(query.toLowerCase(), results);
  
  // Limit cache size
  if (searchCache.size > 50) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
}
```

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 4/10)** – New search modal, trigger buttons, and mobile-optimized interface
2. **UX Changes (Complexity: 5/10)** – Major navigation improvement with quick access to all content and actions
3. **Data Handling (Complexity: 4/10)** – Search across templates, ID cards, and navigation with API integration
4. **Function Logic (Complexity: 4/10)** – Complex search logic, keyboard shortcuts, caching, and debouncing
5. **ID/Key Consistency (Complexity: 1/10)** – No impact on ID/key systems, only search and navigation

**Estimated Development Time:** 4-6 hours  
**UX Impact**: Major improvement in content discoverability and navigation speed  
**Success Criteria:** Command palette works with Cmd/Ctrl+K, searches all content types, responsive design, keyboard navigation