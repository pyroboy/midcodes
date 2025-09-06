# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `pnpm dev`
- **Build for production**: `pnpm build`
- **Run tests**: `pnpm test` (runs both integration and unit tests)
- **Run unit tests only**: `pnpm test:unit` (Vitest)
- **Run integration tests only**: `pnpm test:integration` (Playwright)
- **Type checking**: `pnpm check`
- **Linting**: `pnpm lint` (Prettier + ESLint)
- **Format code**: `pnpm format`
- **Clean build artifacts**: `pnpm clean`

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

### Input Components & Form Functionality

The application features sophisticated input handling across different routes:

#### Image Upload with Cropping (`ImageUploadWithCrop.svelte`)
**Location**: `src/lib/components/ui/ImageUploadWithCrop.svelte`
**Used in**: Tenant profiles

**Features**:
- **Deferred Upload Pattern**: Images are cropped and prepared locally, but only uploaded when the parent form is saved
- **Canvas-Based Cropping**: Circular crop area with real-time preview using HTML5 Canvas
- **Touch & Mouse Support**: Full mobile/desktop interaction with pan, zoom, and rotation
- **Performance Optimized**: Large images are automatically scaled during preview for smooth performance
- **Sequential Processing**: Custom form submission ensures image upload completes before form data submission
- **State Management**: Tracks unsaved changes to prevent accidental modal closure
- **Blob URL Management**: Proper cleanup and memory management for image previews

**Usage Pattern**:
```typescript
// Deferred upload - image processes on form save
<ImageUploadWithCrop
  bind:value={imageDisplayValue}
  onCropReady={handleCropReady}  // Called when crop is ready
  onremove={handleRemove}
  cropSize={{ width: 400, height: 400 }}
/>
```

#### Birthday Input (`birthday-input.svelte`)
**Location**: `src/lib/components/ui/birthday-input.svelte`
**Used in**: Tenant registration

**Features**:
- **Three-Field Format**: Separate MM/DD/YYYY inputs for better UX
- **Smart Navigation**: Auto-advance between fields on completion
- **Validation**: Real-time date validation with error display
- **Mobile Optimized**: Numeric input modes and proper keyboard layouts

#### Form Patterns by Route

**Tenant Management (`/tenants`)**:
- **Profile Pictures**: Advanced image cropping with deferred upload
- **Emergency Contacts**: Nested object handling with flat form fields
- **Status Management**: Enum-based status selection with color coding
- **Contact Information**: Optional email/phone with validation
- **Address Fields**: Multi-line address inputs with proper formatting

**Lease Management (`/leases`)**:
- **Tenant Association**: Multi-select tenant assignment with search
- **Rental Unit Selection**: Hierarchical property → unit selection
- **Date Management**: Start/end dates with automatic calculation
- **Billing Integration**: Automatic rent scheduling and security deposit handling

**Property Management (`/properties`)**:
- **Hierarchical Structure**: Property → Floor → Unit relationships
- **Configuration Settings**: Property-specific billing and utility settings
- **Status Management**: Active/inactive property status with cascading effects

**Utility Billing (`/utility-billings`)**:
- **Meter Readings**: Numeric inputs with automatic consumption calculation
- **Bulk Operations**: Multi-unit reading entry with validation
- **Historical Data**: Previous reading display and validation against historical patterns

**Financial Routes (`/payments`, `/transactions`)**:
- **Amount Inputs**: Currency formatting with PHP locale
- **Payment Methods**: Method-specific form fields (reference numbers, etc.)
- **Allocation System**: Payment distribution across multiple billings
- **Receipt Management**: File upload integration for payment receipts

#### Form Validation & Error Handling

**Validation Strategy**:
- **Zod Schemas**: Comprehensive validation with TypeScript integration
- **SuperForms Integration**: Client and server-side validation with `sveltekit-superforms`
- **Real-time Feedback**: Instant validation feedback during user input
- **Error Display**: Contextual error messages with red styling and icons

**Common Patterns**:
```typescript
// Form initialization with validation
const { form, errors, enhance } = superForm(initialForm, {
  validators: zodClient(formSchema),
  validationMethod: 'onsubmit',
  resetForm: true
});

// Error display in components
{#if $errors.fieldName}
  <p class="text-sm text-red-500 flex items-center gap-1">
    <AlertCircle class="w-4 h-4" />
    {$errors.fieldName}
  </p>
{/if}
```

**Custom Validation Rules**:
- **Email Uniqueness**: Server-side duplicate checking for tenant emails
- **Date Relationships**: End dates after start dates, billing periods
- **Business Logic**: Security deposit amounts, payment allocations
- **File Constraints**: Image size limits, file type validation

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

- **Global Stores**: Configuration, organization, property, settings, and feature flags stores in `src/lib/stores/`
- **Form Handling**: sveltekit-superforms for form validation and submission
- **Data Fetching**: SvelteKit load functions with Supabase queries
- **Feature Flags**: Configurable feature toggles managed in `src/lib/stores/featureFlags.ts`

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

## Feature Flags

The application includes a feature flag system for controlling the visibility of features without code changes.

### Implementation

**Store Location**: `src/lib/stores/featureFlags.ts`

The feature flag store provides:
- Persistent storage via localStorage
- TypeScript type safety
- Helper methods for common operations
- Environment variable support (future)

### Current Features

- **Security Deposit Indicator**: Shows a green shield icon on lease cards when all security deposit billings are fully paid
  - **Default**: Enabled
  - **Location**: Lease cards in desktop and mobile layouts
  - **Helper Function**: `isSecurityDepositFullyPaid()` in `src/lib/utils/lease.ts`

### Usage Pattern

```typescript
import { featureFlags } from '$lib/stores/featureFlags';

// In component
let showFeature = $derived($featureFlags.showSecurityDepositIndicator);

// Conditional rendering
{#if showFeature}
  <!-- Feature content -->
{/if}
```

### Management

Feature flags can be toggled programmatically:

```typescript
import { featureFlags } from '$lib/stores/featureFlags';

// Toggle specific feature
featureFlags.toggleSecurityDepositIndicator();

// Set specific value
featureFlags.setSecurityDepositIndicator(true);
```

### Adding New Features

1. Update `FeatureFlags` interface in `featureFlags.ts`
2. Add default value in `getInitialFeatureFlags()`
3. Add helper methods if needed
4. Use the flag in components with conditional rendering

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
	const result = await locals.supabase.from('tenants').select('*').order('name');
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
