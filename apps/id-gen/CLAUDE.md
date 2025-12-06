# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm run dev              # Start dev server at 127.0.0.1:5173
pnpm run build            # Production build
pnpm run preview          # Preview production build

# Testing
pnpm run test             # Run all tests (integration + unit)
pnpm run test:unit        # Run Vitest unit tests
pnpm run test:integration # Run Playwright E2E tests
pnpm vitest run tests/unit/fileValidation.test.ts  # Run single test file

# Code Quality
pnpm run check            # TypeScript type checking
pnpm run check:watch      # Type checking in watch mode
pnpm run lint             # Prettier + ESLint check
pnpm run format           # Auto-format with Prettier

# Supabase Edge Functions
pnpm run serve:edge       # Serve edge functions locally
pnpm run deploy:edge      # Deploy edge functions

# Maintenance
pnpm run clean            # Clear .svelte-kit, build, and cache
```

## Technology Stack

- **SvelteKit 2.x** with TypeScript - Full-stack framework
- **Supabase** - Database, auth, storage (type-safe via generated `database.types.ts`)
- **TailwindCSS 4.x** - Styling with `@tailwindcss/vite`
- **Threlte** - 3D graphics (Three.js wrapper for Svelte)
- **shadcn-svelte** + **bits-ui** - UI component library
- **sveltekit-superforms** + **Zod 4** - Form validation
- **Vercel** - Deployment (Node.js 20.x runtime)

## Architecture Overview

### Authentication Flow

1. `src/hooks.server.ts` initializes Supabase client and handles auth guard
2. Session/user/permissions populated in `event.locals` via `safeGetSession()`
3. `src/routes/+layout.server.ts` passes auth data to all routes
4. JWT decoded for role-based permissions via `getUserPermissions()`

### Role-Based Access Control

Hierarchy: `super_admin` > `org_admin` > `id_gen_admin` > `id_gen_user`

- All data is organization-scoped via `org_id`
- Permissions fetched from `role_permissions` table and cached (5min TTL)
- Route protection in `+page.server.ts` files (check `session` in locals)

### State Management

- `src/lib/stores/auth.ts` - Auth state (user, session, profile, roleEmulation)
- `src/lib/stores/templateStore.ts` - Template data with TemplateElement interface
- `src/lib/stores/darkMode.ts` - Theme persistence

### Key Data Patterns

- **Templates**: Dimensions stored as pixels + DPI (not physical units)
- **Template Elements**: Discriminated union by `type` field (`text`, `image`, `qr`, `photo`, `signature`, `selection`)
- **Database Operations**: Use type-safe Supabase client from `event.locals.supabase`

### Schemas (Single Source of Truth)

All validation schemas in `src/lib/schemas/`:

- `template-element.schema.ts` - Element type definitions
- `template-creation.schema.ts` - Template creation/presets
- `template-update.schema.ts` - Partial updates, bulk ops
- `display-conversion.schema.ts` - Unit conversions

## Key File Locations

- `src/hooks.server.ts` - Auth initialization, route guards, security headers
- `src/routes/+layout.server.ts` - Root data loading
- `src/lib/types/database.types.ts` - Generated Supabase types
- `src/lib/services/permissions.ts` - Permission checking with cache
- `tests/setup.ts` - Test environment setup

## Testing Patterns

- **Unit tests**: Vitest + Testing Library in `src/**/*.test.ts` or `tests/**/*.test.ts`
- **Integration tests**: Playwright in `tests/integration/`
- **API mocking**: MSW for Supabase mocking
- **Test setup**: `tests/setup.ts` (includes File API mock for jsdom)

## Development Notes

- Server binds to `127.0.0.1:5173` for Windows compatibility
- Uses session storage for auth (not localStorage)
- Environment variables via `$env/static/public` and `$env/static/private`
- 3D libraries optimized in `vite.config.ts` (exclude ws/events, include three/threlte)

## Database Schema (Supabase)

### Core ID-Gen Tables

#### `templates`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID | Creator reference |
| `org_id` | UUID (FK→organizations) | Organization scope |
| `name` | TEXT | Template name (required) |
| `front_background` | TEXT | Front image URL |
| `back_background` | TEXT | Back image URL |
| `orientation` | TEXT | 'landscape' or 'portrait' |
| `template_elements` | JSONB | Array of TemplateElement |
| `width_pixels` | INTEGER | Width in pixels |
| `height_pixels` | INTEGER | Height in pixels |
| `dpi` | INTEGER | Resolution (default: 300) |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `idcards`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `template_id` | UUID (FK→templates) | Source template |
| `org_id` | UUID (FK→organizations) | Organization scope |
| `front_image` | TEXT | Rendered front image path |
| `back_image` | TEXT | Rendered back image path |
| `data` | JSONB | Form field data |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References auth.users |
| `org_id` | UUID (FK→organizations) | Organization scope |
| `email` | TEXT | User email |
| `role` | user_role | User role enum |
| `credits_balance` | INTEGER | Available credits |
| `card_generation_count` | INTEGER | Total cards generated |
| `template_count` | INTEGER | Templates created |
| `unlimited_templates` | BOOLEAN | Feature flag |
| `remove_watermarks` | BOOLEAN | Feature flag |
| `context` | JSONB | User context data |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `organizations`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `name` | TEXT | Organization name (required) |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `org_settings`
| Column | Type | Description |
|--------|------|-------------|
| `org_id` | UUID (PK, FK→organizations) | One-to-one |
| `payments_enabled` | BOOLEAN | Payment feature toggle |
| `payments_bypass` | BOOLEAN | Bypass payment checks |
| `updated_by` | UUID (FK→profiles) | Last updater |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `credit_transactions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK→profiles) | User reference |
| `org_id` | UUID (FK→organizations) | Organization scope |
| `transaction_type` | TEXT | 'purchase', 'deduct', 'refund' |
| `amount` | INTEGER | Credit amount |
| `credits_before` | INTEGER | Balance before |
| `credits_after` | INTEGER | Balance after |
| `description` | TEXT | Transaction description |
| `reference_id` | TEXT | External reference |
| `metadata` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `payment_records`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID | User reference |
| `session_id` | TEXT | Checkout session |
| `provider_payment_id` | TEXT | Provider reference |
| `kind` | TEXT | 'credit' or 'feature' |
| `sku_id` | TEXT | Product identifier |
| `amount_php` | NUMERIC | Amount in PHP |
| `currency` | TEXT | Currency code |
| `status` | TEXT | 'pending', 'paid', 'failed', 'expired', 'refunded' |
| `method` | TEXT | 'gcash', 'paymaya', 'card', 'online_banking' |
| `method_allowed` | TEXT[] | Allowed payment methods |
| `paid_at` | TIMESTAMPTZ | Payment completion time |
| `idempotency_key` | TEXT | Unique key for dedup |
| `metadata` | JSONB | Additional data |
| `raw_event` | JSONB | Provider webhook payload |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `role_permissions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-generated |
| `role` | app_role | Role enum |
| `permission` | app_permission | Permission enum |

### Enums

```typescript
// User roles hierarchy
type user_role = 'super_admin' | 'org_admin' | 'id_gen_admin' | 'id_gen_user' | 'user' | ...;

// ID-Gen specific permissions
type app_permission = 
  | 'templates.create' | 'templates.read' | 'templates.update' | 'templates.delete'
  | 'idcards.create' | 'idcards.read' | 'idcards.update' | 'idcards.delete'
  | 'organizations.create' | 'organizations.read' | 'organizations.update' | 'organizations.delete'
  | 'profiles.read' | 'profiles.update';
```

### Storage Buckets

- `template-backgrounds` - Template front/back images
- `rendered-id-cards` - Generated ID card images
- `user-uploads` - User-uploaded photos/signatures

---

## Meta-Instructions

After writing code blocks, run lint, type check, and tests before continuing:

```bash
pnpm run check && pnpm run lint && pnpm run test:unit
```
