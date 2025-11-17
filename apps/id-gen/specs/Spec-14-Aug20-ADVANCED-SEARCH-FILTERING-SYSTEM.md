# Advanced Search & Filtering System

## Overview
This specification addresses the basic and limited search functionality throughout the application and proposes a comprehensive search and filtering system with intelligent suggestions, saved filters, global search capabilities, and powerful filtering options to dramatically improve content discoverability and user productivity.

## Classification
**Type**: SPECIFICATION (Implementation Plan)
**Category**: Search & Content Discovery Enhancement
**Created**: August 20, 2025
**Spec Number**: 14
**Priority**: Medium-High
**Estimated Effort**: 4-5 days

## Current Search & Filtering Issues Identified

### 1. **Basic Text-Only Search**
- Simple text input with no advanced search operators
- No search within specific fields (name vs description vs content)
- Search only works on visible/loaded data, not comprehensive database search
- No search result highlighting or relevance scoring
- No search suggestions or autocomplete functionality

### 2. **Limited Filtering Options**
- Templates have no category, date, or usage-based filtering
- ID cards lack filtering by template, creation date, or field values
- No bulk filtering operations or filter combinations
- No saved filters or search presets for common queries
- Missing visual indicators for applied filters

### 3. **Poor Search UX**
- No search result pagination or infinite scroll
- No search result counts or statistics
- Search happens on every keystroke without debouncing
- No search history or recent searches
- No empty state guidance for refining searches

### 4. **Missing Advanced Features**
- No global search across templates, cards, and users (for admins)
- No fuzzy search for handling typos and partial matches
- No semantic search or AI-powered content matching
- No search within template field values or metadata
- No export of search results or filtered data

### 5. **Performance Issues**
- Client-side filtering doesn't scale with large datasets
- No search indexing or optimization for fast queries
- No caching of search results or filter states
- Search operations block UI without loading indicators
- No background pre-loading of common search results

## Advanced Search & Filtering Solutions

### Phase 1: Intelligent Search Engine

#### 1.1 Smart Search Component
```svelte
<!-- Advanced search interface with multiple modes -->
<script lang="ts">
  import { Search, Filter, X, Clock, Bookmark } from 'lucide-svelte';
  import { SearchEngine } from '$lib/services/search-engine';
  import { debounce } from '$lib/utils/debounce';
  
  let searchEngine = new SearchEngine();
  let searchQuery = $state('');
  let searchMode = $state<'simple' | 'advanced' | 'visual'>('simple');
  let searchResults = $state([]);
  let searchSuggestions = $state([]);
  let isSearching = $state(false);
  let searchHistory = $state([]);
  let savedFilters = $state([]);
  
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      searchResults = [];
      return;
    }
    
    isSearching = true;
    try {
      const results = await searchEngine.search({
        query,
        filters: activeFilters,
        scope: searchScope,
        limit: 50
      });
      
      searchResults = results.items;
      searchSuggestions = results.suggestions;
      
      // Add to search history
      addToSearchHistory(query);
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      isSearching = false;
    }
  }, 300);
  
  $effect(() => {
    debouncedSearch(searchQuery);
  });
</script>

<div class="search-container">
  <!-- Search Input with Smart Features -->
  <div class="search-input-wrapper">
    <div class="search-input-container">
      <Search class="search-icon" />
      
      <input
        type="text"
        bind:value={searchQuery}
        placeholder={getSearchPlaceholder(searchScope)}
        class="search-input"
        aria-label="Search"
        autocomplete="off"
      />
      
      {#if searchQuery}
        <button class="clear-search" onclick={() => searchQuery = ''}>
          <X class="w-4 h-4" />
        </button>
      {/if}
      
      <div class="search-actions">
        <button 
          class="search-mode-toggle"
          onclick={() => searchMode = searchMode === 'simple' ? 'advanced' : 'simple'}
          title="Toggle advanced search"
        >
          <Filter class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Search Suggestions Dropdown -->
    {#if searchSuggestions.length > 0 && searchQuery}
      <div class="search-suggestions">
        {#each searchSuggestions as suggestion}
          <button 
            class="suggestion-item"
            onclick={() => searchQuery = suggestion.query}
          >
            <Search class="w-4 h-4" />
            <span class="suggestion-text">{suggestion.query}</span>
            <span class="suggestion-type">{suggestion.type}</span>
          </button>
        {/each}
      </div>
    {/if}
    
    <!-- Search History (when input is focused but empty) -->
    {#if searchHistory.length > 0 && !searchQuery && inputFocused}
      <div class="search-history">
        <div class="history-header">
          <Clock class="w-4 h-4" />
          <span>Recent Searches</span>
        </div>
        {#each searchHistory.slice(0, 5) as historyItem}
          <button 
            class="history-item"
            onclick={() => searchQuery = historyItem.query}
          >
            <span>{historyItem.query}</span>
            <span class="history-date">{formatRelativeTime(historyItem.timestamp)}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Advanced Search Mode -->
  {#if searchMode === 'advanced'}
    <div class="advanced-search-panel">
      <AdvancedSearchFilters bind:filters={activeFilters} />
    </div>
  {/if}
  
  <!-- Active Filters Display -->
  {#if activeFilters.length > 0}
    <div class="active-filters">
      {#each activeFilters as filter}
        <div class="filter-chip">
          <span class="filter-label">{filter.label}</span>
          <button onclick={() => removeFilter(filter.id)}>
            <X class="w-3 h-3" />
          </button>
        </div>
      {/each}
      
      <button class="clear-all-filters" onclick={clearAllFilters}>
        Clear All
      </button>
    </div>
  {/if}
  
  <!-- Search Results Summary -->
  {#if searchResults.length > 0}
    <div class="search-summary">
      <span class="result-count">
        {searchResults.length} results found
      </span>
      
      {#if searchQuery}
        <span class="search-time">
          in {searchTime}ms
        </span>
      {/if}
      
      <div class="search-actions-secondary">
        <button onclick={saveCurrentSearch} class="save-search-btn">
          <Bookmark class="w-4 h-4" />
          Save Search
        </button>
        
        <button onclick={exportSearchResults} class="export-results-btn">
          Export Results
        </button>
      </div>
    </div>
  {/if}
</div>
```

#### 1.2 Search Engine Service
```typescript
interface SearchOptions {
  query: string;
  filters: SearchFilter[];
  scope: 'templates' | 'cards' | 'users' | 'all';
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'name' | 'usage';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'template' | 'card' | 'user';
  title: string;
  subtitle?: string;
  thumbnail?: string;
  relevanceScore: number;
  highlights: SearchHighlight[];
  metadata: Record<string, any>;
  url: string;
}

interface SearchHighlight {
  field: string;
  value: string;
  matchedText: string;
}

class SearchEngine {
  private searchIndex: SearchIndex;
  private fuzzySearch: FuzzySearch;
  private searchCache: Map<string, SearchResult[]>;
  
  constructor() {
    this.searchIndex = new SearchIndex();
    this.fuzzySearch = new FuzzySearch();
    this.searchCache = new Map();
  }
  
  async search(options: SearchOptions): Promise<{
    items: SearchResult[];
    suggestions: SearchSuggestion[];
    totalCount: number;
    searchTime: number;
  }> {
    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = this.getCacheKey(options);
    if (this.searchCache.has(cacheKey)) {
      return {
        items: this.searchCache.get(cacheKey)!,
        suggestions: [],
        totalCount: this.searchCache.get(cacheKey)!.length,
        searchTime: performance.now() - startTime
      };
    }
    
    let results: SearchResult[] = [];
    
    // Multi-mode search strategy
    if (this.isSimpleQuery(options.query)) {
      results = await this.performSimpleSearch(options);
    } else if (this.hasAdvancedOperators(options.query)) {
      results = await this.performAdvancedSearch(options);
    } else {
      results = await this.performFuzzySearch(options);
    }
    
    // Apply filters
    if (options.filters.length > 0) {
      results = this.applyFilters(results, options.filters);
    }
    
    // Sort results
    results = this.sortResults(results, options.sortBy, options.sortOrder);
    
    // Apply pagination
    const paginatedResults = this.paginateResults(results, options.limit, options.offset);
    
    // Generate search suggestions
    const suggestions = await this.generateSuggestions(options.query, results);
    
    // Cache results
    this.searchCache.set(cacheKey, paginatedResults);
    
    return {
      items: paginatedResults,
      suggestions,
      totalCount: results.length,
      searchTime: performance.now() - startTime
    };
  }
  
  private async performSimpleSearch(options: SearchOptions): Promise<SearchResult[]> {
    const query = options.query.toLowerCase();
    
    // Search based on scope
    switch (options.scope) {
      case 'templates':
        return this.searchTemplates(query);
      case 'cards':
        return this.searchCards(query);
      case 'users':
        return this.searchUsers(query);
      case 'all':
        const [templates, cards, users] = await Promise.all([
          this.searchTemplates(query),
          this.searchCards(query),
          this.searchUsers(query)
        ]);
        return [...templates, ...cards, ...users];
    }
  }
  
  private async searchTemplates(query: string): Promise<SearchResult[]> {
    // Search in template names, descriptions, and field names
    const templates = await this.fetchTemplates();
    
    return templates
      .map(template => {
        const relevanceScore = this.calculateRelevance(query, [
          { field: 'name', value: template.name, weight: 3 },
          { field: 'description', value: template.description || '', weight: 2 },
          { field: 'fields', value: this.extractFieldNames(template.elements), weight: 1 }
        ]);
        
        if (relevanceScore === 0) return null;
        
        return {
          id: template.id,
          type: 'template' as const,
          title: template.name,
          subtitle: template.description,
          thumbnail: template.thumbnailUrl,
          relevanceScore,
          highlights: this.generateHighlights(query, template),
          metadata: {
            createdAt: template.created_at,
            elementCount: template.template_elements?.length || 0,
            usage: template.usage_count || 0
          },
          url: `/templates?id=${template.id}`
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  generateSuggestions(query: string, results: SearchResult[]): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    // Typo corrections
    if (results.length === 0) {
      const corrected = this.fuzzySearch.correct(query);
      if (corrected !== query) {
        suggestions.push({
          type: 'correction',
          query: corrected,
          reason: `Did you mean "${corrected}"?`
        });
      }
    }
    
    // Related searches
    const relatedTerms = this.getRelatedSearchTerms(query);
    relatedTerms.forEach(term => {
      suggestions.push({
        type: 'related',
        query: term,
        reason: 'Related search'
      });
    });
    
    // Popular searches
    if (query.length < 3) {
      const popular = this.getPopularSearches();
      popular.forEach(term => {
        suggestions.push({
          type: 'popular',
          query: term,
          reason: 'Popular search'
        });
      });
    }
    
    return suggestions;
  }
}
```

### Phase 2: Advanced Filtering System

#### 2.1 Dynamic Filter Builder
```svelte
<!-- Visual filter builder component -->
<script lang="ts">
  import type { FilterDefinition, FilterValue } from '$lib/types/filters';
  
  interface Props {
    filters: FilterValue[];
    availableFilters: FilterDefinition[];
    onFiltersChange: (filters: FilterValue[]) => void;
  }
  
  let { filters = $bindable([]), availableFilters, onFiltersChange }: Props = $props();
  
  function addFilter(filterDef: FilterDefinition) {
    const newFilter: FilterValue = {
      id: crypto.randomUUID(),
      field: filterDef.field,
      operator: filterDef.operators[0],
      value: filterDef.defaultValue,
      label: `${filterDef.label} ${filterDef.operators[0]} ${filterDef.defaultValue}`
    };
    
    filters = [...filters, newFilter];
  }
  
  function updateFilter(filterId: string, updates: Partial<FilterValue>) {
    filters = filters.map(filter => 
      filter.id === filterId 
        ? { ...filter, ...updates, label: generateFilterLabel(filter, updates) }
        : filter
    );
  }
  
  function removeFilter(filterId: string) {
    filters = filters.filter(filter => filter.id !== filterId);
  }
</script>

<div class="filter-builder">
  <!-- Filter Categories -->
  <div class="filter-categories">
    {#each Object.entries(groupFiltersByCategory(availableFilters)) as [category, categoryFilters]}
      <div class="filter-category">
        <h3 class="category-title">{category}</h3>
        
        <div class="category-filters">
          {#each categoryFilters as filterDef}
            <button 
              class="filter-option"
              onclick={() => addFilter(filterDef)}
              disabled={filters.some(f => f.field === filterDef.field)}
            >
              <span class="filter-icon">{filterDef.icon}</span>
              <span class="filter-name">{filterDef.label}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Active Filters -->
  <div class="active-filters-builder">
    {#each filters as filter}
      <div class="filter-builder-item">
        <select 
          bind:value={filter.field}
          onchange={() => updateFilter(filter.id, { field: filter.field })}
        >
          {#each availableFilters as filterDef}
            <option value={filterDef.field}>{filterDef.label}</option>
          {/each}
        </select>
        
        <select 
          bind:value={filter.operator}
          onchange={() => updateFilter(filter.id, { operator: filter.operator })}
        >
          {#each getFilterDefinition(filter.field).operators as operator}
            <option value={operator}>{operator}</option>
          {/each}
        </select>
        
        <FilterValueInput 
          filterDefinition={getFilterDefinition(filter.field)}
          bind:value={filter.value}
          onchange={(value) => updateFilter(filter.id, { value })}
        />
        
        <button 
          class="remove-filter"
          onclick={() => removeFilter(filter.id)}
          aria-label="Remove filter"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    {/each}
    
    <!-- Filter Combinations -->
    {#if filters.length > 1}
      <div class="filter-logic">
        <label>
          <input type="radio" bind:group={filterLogic} value="AND" />
          Match ALL filters
        </label>
        <label>
          <input type="radio" bind:group={filterLogic} value="OR" />
          Match ANY filter
        </label>
      </div>
    {/if}
  </div>
  
  <!-- Saved Filters -->
  <div class="saved-filters">
    <h3>Saved Filters</h3>
    
    <div class="saved-filter-list">
      {#each savedFilters as savedFilter}
        <button 
          class="saved-filter-item"
          onclick={() => applySavedFilter(savedFilter)}
        >
          <span class="saved-filter-name">{savedFilter.name}</span>
          <span class="saved-filter-count">{savedFilter.filterCount} filters</span>
        </button>
      {/each}
    </div>
    
    {#if filters.length > 0}
      <button 
        class="save-current-filter"
        onclick={showSaveFilterDialog}
      >
        Save Current Filter
      </button>
    {/if}
  </div>
</div>
```

#### 2.2 Filter Definitions & Types
```typescript
interface FilterDefinition {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';
  category: 'general' | 'dates' | 'content' | 'usage' | 'advanced';
  operators: FilterOperator[];
  options?: FilterOption[];
  defaultValue: any;
  icon: string;
  description?: string;
}

type FilterOperator = 'equals' | 'contains' | 'starts_with' | 'ends_with' | 
                     'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' |
                     'is_empty' | 'is_not_empty' | 'before' | 'after' | 'within';

const TEMPLATE_FILTERS: FilterDefinition[] = [
  // General filters
  {
    field: 'name',
    label: 'Template Name',
    type: 'text',
    category: 'general',
    operators: ['contains', 'equals', 'starts_with', 'ends_with'],
    defaultValue: '',
    icon: '📝',
    description: 'Search by template name'
  },
  {
    field: 'description',
    label: 'Description',
    type: 'text',
    category: 'general',
    operators: ['contains', 'equals', 'is_empty', 'is_not_empty'],
    defaultValue: '',
    icon: '📄'
  },
  {
    field: 'category',
    label: 'Category',
    type: 'select',
    category: 'general',
    operators: ['equals', 'in', 'not_in'],
    options: [
      { value: 'employee', label: 'Employee ID' },
      { value: 'student', label: 'Student Card' },
      { value: 'visitor', label: 'Visitor Badge' },
      { value: 'custom', label: 'Custom' }
    ],
    defaultValue: '',
    icon: '🏷️'
  },
  
  // Date filters
  {
    field: 'created_at',
    label: 'Created Date',
    type: 'date',
    category: 'dates',
    operators: ['before', 'after', 'between', 'within'],
    defaultValue: null,
    icon: '📅'
  },
  {
    field: 'updated_at',
    label: 'Last Modified',
    type: 'date',
    category: 'dates',
    operators: ['before', 'after', 'between', 'within'],
    defaultValue: null,
    icon: '🔄'
  },
  
  // Content filters
  {
    field: 'element_count',
    label: 'Number of Fields',
    type: 'number',
    category: 'content',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
    defaultValue: 0,
    icon: '🔢'
  },
  {
    field: 'has_photo',
    label: 'Has Photo Field',
    type: 'boolean',
    category: 'content',
    operators: ['equals'],
    defaultValue: false,
    icon: '📸'
  },
  {
    field: 'field_names',
    label: 'Contains Field',
    type: 'multiselect',
    category: 'content',
    operators: ['contains', 'in'],
    options: [], // Populated dynamically from existing fields
    defaultValue: [],
    icon: '🏷️'
  },
  
  // Usage filters
  {
    field: 'usage_count',
    label: 'Times Used',
    type: 'number',
    category: 'usage',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
    defaultValue: 0,
    icon: '📊'
  },
  {
    field: 'last_used',
    label: 'Last Used',
    type: 'date',
    category: 'usage',
    operators: ['before', 'after', 'within'],
    defaultValue: null,
    icon: '⏰'
  }
];
```

### Phase 3: Global Search System

#### 3.1 Universal Search Interface
```svelte
<!-- Global search accessible via keyboard shortcut -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { GlobalSearchService } from '$lib/services/global-search';
  
  let isOpen = $state(false);
  let searchQuery = $state('');
  let searchResults = $state([]);
  let selectedIndex = $state(0);
  
  const globalSearch = new GlobalSearchService();
  
  // Keyboard shortcut: Cmd/Ctrl + K
  onMount(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen = true;
      }
      
      if (e.key === 'Escape') {
        isOpen = false;
        searchQuery = '';
      }
    }
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
  
  $effect(async () => {
    if (searchQuery.trim().length > 2) {
      searchResults = await globalSearch.search({
        query: searchQuery,
        scopes: ['templates', 'cards', 'users', 'settings'],
        limit: 10
      });
    } else {
      searchResults = globalSearch.getQuickActions();
    }
  });
</script>

{#if isOpen}
  <!-- Global search modal -->
  <div class="global-search-overlay" onclick={() => isOpen = false}>
    <div class="global-search-modal" onclick|stopPropagation>
      <div class="search-header">
        <Search class="search-icon" />
        <input 
          type="text"
          bind:value={searchQuery}
          placeholder="Search templates, cards, users, or type a command..."
          class="global-search-input"
          autofocus
        />
        <kbd class="keyboard-hint">ESC</kbd>
      </div>
      
      <div class="search-results">
        {#if searchResults.length === 0 && searchQuery.trim()}
          <div class="no-results">
            <p>No results found for "{searchQuery}"</p>
            <p class="no-results-hint">Try searching for templates, ID cards, or users</p>
          </div>
        {:else}
          {#each searchResults as result, index}
            <a 
              href={result.url}
              class="search-result-item {index === selectedIndex ? 'selected' : ''}"
              onclick={() => isOpen = false}
            >
              <div class="result-icon">
                {result.icon}
              </div>
              
              <div class="result-content">
                <div class="result-title">
                  {@html result.highlightedTitle}
                </div>
                {#if result.subtitle}
                  <div class="result-subtitle">
                    {@html result.highlightedSubtitle}
                  </div>
                {/if}
              </div>
              
              <div class="result-meta">
                <span class="result-type">{result.type}</span>
                {#if result.shortcut}
                  <kbd class="result-shortcut">{result.shortcut}</kbd>
                {/if}
              </div>
            </a>
          {/each}
        {/if}
      </div>
      
      <div class="search-footer">
        <div class="search-tips">
          <span>💡 Tips:</span>
          <span>Use "template:" to search templates only</span>
          <span>Use "user:" to search users</span>
          <span>Use "/" for commands</span>
        </div>
      </div>
    </div>
  </div>
{/if}
```

#### 3.2 Search Commands & Actions
```typescript
interface SearchCommand {
  command: string;
  description: string;
  action: () => void | Promise<void>;
  shortcut?: string;
  icon: string;
  category: 'navigation' | 'creation' | 'management' | 'settings';
}

const SEARCH_COMMANDS: SearchCommand[] = [
  // Navigation commands
  {
    command: '/dashboard',
    description: 'Go to Dashboard',
    action: () => navigate('/'),
    shortcut: 'Ctrl+H',
    icon: '🏠',
    category: 'navigation'
  },
  {
    command: '/templates',
    description: 'Browse Templates',
    action: () => navigate('/templates'),
    shortcut: 'Ctrl+T',
    icon: '📋',
    category: 'navigation'
  },
  {
    command: '/cards',
    description: 'View My ID Cards',
    action: () => navigate('/all-ids'),
    shortcut: 'Ctrl+I',
    icon: '🆔',
    category: 'navigation'
  },
  
  // Creation commands
  {
    command: '/new template',
    description: 'Create New Template',
    action: () => openNewTemplateDialog(),
    shortcut: 'Ctrl+N',
    icon: '➕',
    category: 'creation'
  },
  {
    command: '/new card',
    description: 'Generate New ID Card',
    action: () => navigate('/templates'),
    shortcut: 'Ctrl+G',
    icon: '🆕',
    category: 'creation'
  },
  
  // Management commands
  {
    command: '/export',
    description: 'Export Data',
    action: () => showExportDialog(),
    icon: '📤',
    category: 'management'
  },
  {
    command: '/import',
    description: 'Import Templates',
    action: () => showImportDialog(),
    icon: '📥',
    category: 'management'
  },
  
  // Settings commands
  {
    command: '/settings',
    description: 'Open Settings',
    action: () => navigate('/settings'),
    icon: '⚙️',
    category: 'settings'
  },
  {
    command: '/profile',
    description: 'Edit Profile',
    action: () => navigate('/profile'),
    icon: '👤',
    category: 'settings'
  }
];
```

### Phase 4: Search Analytics & Optimization

#### 4.1 Search Analytics Service
```typescript
class SearchAnalytics {
  private searchLog: SearchEvent[] = [];
  private popularSearches = new Map<string, number>();
  private searchConversions = new Map<string, number>();
  
  logSearch(event: SearchEvent) {
    this.searchLog.push(event);
    
    // Track popular searches
    const count = this.popularSearches.get(event.query) || 0;
    this.popularSearches.set(event.query, count + 1);
    
    // Track search to action conversion
    if (event.resultClicked) {
      const conversions = this.searchConversions.get(event.query) || 0;
      this.searchConversions.set(event.query, conversions + 1);
    }
    
    // Send to analytics service
    this.sendAnalytics(event);
  }
  
  getSearchInsights(): SearchInsights {
    return {
      topSearches: this.getTopSearches(10),
      noResultQueries: this.getNoResultQueries(),
      averageResultsPerQuery: this.getAverageResultsPerQuery(),
      searchConversionRate: this.getOverallConversionRate(),
      searchPatterns: this.getSearchPatterns()
    };
  }
  
  getSearchSuggestions(query: string): string[] {
    // Use analytics data to suggest better searches
    const suggestions = Array.from(this.popularSearches.entries())
      .filter(([search]) => search.toLowerCase().includes(query.toLowerCase()))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([search]) => search);
      
    return suggestions;
  }
}

interface SearchEvent {
  query: string;
  resultCount: number;
  searchTime: number;
  userId?: string;
  timestamp: Date;
  filters: FilterValue[];
  resultClicked: boolean;
  clickedResult?: {
    id: string;
    type: string;
    position: number;
  };
}
```

## Technical Implementation Plan

### Step 1: Search Engine Foundation (1.5 days)
1. **Build SearchEngine service** with fuzzy matching and relevance scoring
2. **Create search indexing system** for fast full-text search
3. **Implement search caching** and optimization strategies
4. **Add search result highlighting** and snippet generation

### Step 2: Advanced Filtering System (1.5 days)
1. **Design filter definition system** with type-safe filter builders
2. **Create FilterBuilder component** with visual filter construction
3. **Implement saved filters** with user preferences storage
4. **Add bulk filtering operations** and filter combinations

### Step 3: Global Search Interface (1 day)
1. **Build universal search modal** with keyboard shortcuts
2. **Implement command system** for quick actions
3. **Add search suggestions** and auto-complete functionality
4. **Create search history** and recent searches

### Step 4: Search Analytics & Optimization (1 day)
1. **Implement search event tracking** and analytics
2. **Build search insights dashboard** for administrators
3. **Add search performance monitoring** and optimization
4. **Create search suggestion improvements** based on usage data

## Success Metrics

### User Experience Metrics
- **Search Success Rate**: 85% of searches result in user finding what they need
- **Search Speed**: Average search response time < 200ms
- **Filter Usage**: 60% of users utilize advanced filtering features
- **Global Search Adoption**: 40% of navigation happens through global search

### Technical Metrics
- **Search Index Performance**: Search index updates within 5 seconds
- **Cache Hit Rate**: 70% of searches served from cache
- **Search Accuracy**: 90% relevance score for top 5 search results
- **System Load**: Search operations add < 10% to server load

### Business Metrics
- **Content Discovery**: 50% increase in template and feature usage
- **User Productivity**: 35% reduction in time to find content
- **User Engagement**: 25% increase in session duration due to better search
- **Support Reduction**: 40% fewer "how to find" support requests

## Implementation Priority

### Must-Have (MVP)
- ✅ Enhanced text search with fuzzy matching and highlighting
- ✅ Basic filtering system with common filter types
- ✅ Search suggestions and autocomplete
- ✅ Search result pagination and performance optimization

### Should-Have (V1.1)
- ✅ Global search interface with keyboard shortcuts
- ✅ Advanced filter builder with saved filters
- ✅ Search analytics and usage tracking
- ✅ Command system for quick actions

### Nice-to-Have (Future)
- ⭐ AI-powered semantic search and content recommendations
- ⭐ Voice search capabilities
- ⭐ Search API for third-party integrations
- ⭐ Advanced search operators and query language

## Dependencies
- **Full-Text Search**: Database full-text search capabilities or external search service
- **Caching**: Redis or similar for search result caching
- **Analytics**: Event tracking system for search analytics
- **UI Components**: Advanced input components for filter builders
- **Keyboard Handling**: Global keyboard shortcut management

## Risk Assessment

### Technical Risks
- **Performance**: Large datasets may impact search performance
- **Complexity**: Advanced filtering system may become too complex
- **Index Maintenance**: Search indexes may become out of sync

### Mitigation Strategies
- **Performance Testing**: Load testing with realistic data volumes
- **Progressive Enhancement**: Start with basic features and add complexity gradually
- **Index Monitoring**: Automated index health checks and rebuilding
- **User Testing**: Validate search UX with real users and usage patterns

## Notes
This specification transforms basic text search into a comprehensive content discovery system that anticipates user needs, provides intelligent suggestions, and dramatically improves the efficiency of finding and managing templates, cards, and other content.

The implementation should focus on performance and usability, ensuring that advanced features enhance rather than complicate the search experience for different user types and skill levels.