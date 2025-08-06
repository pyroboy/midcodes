# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Run tests**: `npm run test` (runs both integration and unit tests)
- **Run unit tests only**: `npm run test:unit` (Vitest)
- **Run integration tests only**: `npm run test:integration` (Playwright)
- **Type checking**: `npm run check`
- **Linting**: `npm run lint` (Prettier + ESLint)
- **Format code**: `npm run format`
- **Clean build artifacts**: `npm run clean`

## Architecture Overview

This is a **SvelteKit** application for dormitory management built with:

- **Frontend**: Svelte 5 + SvelteKit with TypeScript
- **Backend**: Supabase (PostgreSQL database + Auth)
- **UI Components**: shadcn-svelte with Tailwind CSS
- **Testing**: Vitest (unit) + Playwright (integration)
- **State Management**: Svelte stores + context
- **Authentication**: Supabase Auth with JWT tokens and role-based permissions
- **Currency**: Philippine Peso (PHP) - All monetary values use PHP formatting

### Database & Authentication

- **Supabase Client**: Initialized in `src/lib/supabaseClient.ts`
- **Auth Flow**: Handled in `src/hooks.server.ts` with session management and role-based access control
- **Permissions**: Role-based system managed in `src/lib/services/permissions.ts`
- **Database Types**: Auto-generated types in `src/lib/database.types.ts`

### Route Structure

The application follows SvelteKit's file-based routing with feature-based organization:

- **Authentication**: `/auth/*` routes for login/logout/password reset
- **Property Management**: `/properties` - manage dormitory properties
- **Tenant Management**: `/tenants` - tenant information and registration
- **Lease Management**: `/leases` - lease agreements and billing
- **Utility Billing**: `/utility-billings` - meter readings and utility calculations
- **Financial**: `/payments`, `/transactions`, `/expenses`, `/budgets` - financial management
- **Reports**: `/reports`, `/lease-report` - various reporting features
- **Room Management**: `/rental-unit`, `/floors`, `/meters` - physical space management

### Key Components & Libraries

- **UI Components**: Located in `src/lib/components/ui/` using shadcn-svelte
- **Schemas**: Zod validation schemas in `src/lib/schemas/`
- **Utilities**: Helper functions in `src/lib/utils/`
- **Types**: TypeScript definitions in `src/lib/types/`

### Currency Formatting

All monetary values in the application use **Philippine Peso (PHP)** formatting:

- **Primary Currency Function**: Use `formatCurrency()` from `src/lib/utils/format.ts`
- **Locale**: `en-PH` (English Philippines)
- **Currency Code**: `PHP`
- **Example Output**: `₱1,234.56`

**Usage:**
```typescript
import { formatCurrency } from '$lib/utils/format';

// Format amounts consistently
const displayAmount = formatCurrency(1234.56); // "₱1,234.56"
```

**Important**: Always use the centralized `formatCurrency` function instead of creating inline formatters to maintain consistency across the application.

### State Management

- **Global Stores**: Configuration, organization, property, and settings stores in `src/lib/stores/`
- **Form Handling**: sveltekit-superforms for form validation and submission
- **Data Fetching**: SvelteKit load functions with Supabase queries

### Important Patterns

1. **Route Structure**: Each feature route contains:
   - `+page.server.ts` - Server-side data loading and form actions
   - `+page.svelte` - Main page component
   - Component files for modals/forms/tables
   - `formSchema.ts` - Zod validation schemas
   - `types.ts` - TypeScript interfaces

2. **Authentication**: All routes except `/auth/*` require authentication via `hooks.server.ts`

3. **Database Operations**: Use the Supabase client with proper error handling and type safety

4. **Form Validation**: Use Zod schemas with sveltekit-superforms for consistent validation

## Test Structure

- **Unit Tests**: In `src/lib/__tests__/` and route-specific `__tests__/` directories
- **Integration Tests**: Playwright tests for full user workflows
- **Test Utils**: Environment setup in `src/lib/test-utils/`

## Performance Optimizations

The application includes several performance optimizations for instant route switching:

### Caching Strategy

- **Client-side Data Cache**: `src/lib/services/cache.ts` provides in-memory caching with TTL
- **Cached Supabase Client**: `src/lib/services/cachedSupabase.ts` wraps Supabase queries with caching
- **Service Worker**: Aggressive caching for static assets and offline support
- **Cache TTL Configuration**: Different cache durations for various data types (properties: 10min, leases: 3min, transactions: 2min)

### Route Optimizations

- **Preloading**: Navigation links use `data-sveltekit-preload-data="hover"` for instant loading
- **Smart Prefetching**: `src/lib/utils/prefetch.ts` provides intelligent route prefetching based on user behavior
- **Streaming Layout**: Properties load in background while UI renders immediately
- **Code Splitting**: Vite configured to split large dependencies into separate chunks

### Build Optimizations

- **Vite Configuration**: Optimized with esbuild, manual chunks, and dependency pre-bundling
- **Service Worker**: Cache-first strategy for assets, network-first for API calls
- **Layout Streaming**: Non-blocking property loading with progressive enhancement

### Usage

The caching system automatically handles data invalidation and provides cache debugging. Route switching should be near-instant after the first visit to each route.

## Lazy Loading & Skeleton Pattern

The application implements a high-performance lazy loading pattern for instant navigation, demonstrated in the tenants route.

### Implementation Pattern

**Server-Side (`+page.server.ts`):**
```typescript
export const load: PageServerLoad = async ({ locals, depends }) => {
  // Set up dependencies for invalidation
  depends('app:tenants');

  // Return minimal data for instant navigation
  return {
    // Start with empty arrays for instant rendering
    tenants: [],
    properties: [],
    form: await superValidate(zod(tenantFormSchema)),
    // Flag to indicate lazy loading
    lazy: true,
    // Return promises that resolve with the actual data
    tenantsPromise: loadTenantsData(locals),
    propertiesPromise: loadPropertiesData(locals)
  };
};

// Separate async functions for heavy data loading
async function loadTenantsData(locals: any) {
  const result = await locals.supabase
    .from('tenants')
    .select('*')
    .order('name');
  return result.data || [];
}
```

**Client-Side (`+page.svelte`):**
```typescript
let isLoading = $state(data.lazy === true);
let tenants = $state<TenantResponse[]>(data.tenants);

// Load data lazily on mount
onMount(async () => {
  if (data.lazy && data.tenantsPromise) {
    try {
      const loadedTenants = await data.tenantsPromise;
      tenants = loadedTenants;
      isLoading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      isLoading = false;
    }
  }
});
```

**Skeleton Loading:**
```svelte
{#if isLoading}
  <!-- Skeleton cards that match real content structure -->
  <div class="space-y-2">
    {#each Array(5) as _, i (i)}
      <div class="border border-slate-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1">
            <Skeleton class="w-10 h-10 rounded-full" />
            <div class="space-y-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-48" />
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <!-- Real content -->
{/if}
```

### Benefits

- **Instant Navigation**: Pages render immediately (0ms perceived load time)
- **Progressive Enhancement**: Data streams in while UI is already interactive
- **Better UX**: Skeleton loaders show expected content structure
- **No Flicker**: Smooth transitions from skeleton to real content
- **Maintains Performance**: Heavy database queries don't block navigation

### When to Use This Pattern

Apply this pattern to routes with:
- Heavy database queries (multiple joins, large datasets)
- Complex data processing
- Non-critical initial load data
- High navigation frequency

### Integration with Existing Systems

This pattern works seamlessly with:
- **Hover Preloading**: Links still preload on hover for even faster subsequent visits
- **Caching System**: Cached routes load instantly without skeletons
- **Service Worker**: Static assets remain cached while data loads

## Documentation

Feature-specific documentation is available in:
- Route-level `INSTRUCTIONS.md` files
- `docs/` directory with detailed specifications
- `DORMSCHEMA.md` for database schema information