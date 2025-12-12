# ID-Gen Architecture Reference

## Core Technology Stack

- **SvelteKit 2.x** with TypeScript - Full-stack framework
- **Vercel** deployment with Node.js 20.x runtime
- **Supabase** - Database, auth, and storage backend
- **TailwindCSS 4.x** - Utility-first styling
- **Threlte** (@threlte/core, @threlte/extras) - 3D graphics with Three.js
- **shadcn-svelte** - UI component library

## Project Structure

- `src/lib/` - Shared utilities and stores
  - `components/` - Reusable Svelte components including shadcn-svelte UI
    - `ui/` - shadcn-svelte component library (buttons, cards, dialogs, etc.)
    - `empty-states/` - Empty state components for various scenarios
  - `stores/` - Svelte stores for state management
    - `auth.svelte.ts` & `auth.ts` - Authentication state management
    - `theme.ts` & `darkMode.ts` - Theme and dark mode state
    - `templateStore.ts` - Template data management
    - `viewMode.ts` - UI view mode toggles
  - `types/` - TypeScript type definitions
    - `database.types.ts` - Generated Supabase database types
    - `auth.ts` - Authentication type definitions
    - Various schema and interface definitions
  - `utils/` - Helper functions and utilities
    - Card geometry and ID card operations
    - Image processing and cropping utilities
    - Performance monitoring and logging
    - Coordinate system and background utilities
  - `schemas/` - Zod validation schemas for the codebase
  - `config/` - Configuration files (fonts, environment, PayMongo)
  - `server/` - Server-side utilities (Supabase, payments, crypto)
  - `services/` - Business logic services (payments, permissions)
  - `remote/` - Remote API interaction modules
- `src/routes/` - SvelteKit file-based routing
  - `templates/` - Template management pages (admin only)
  - `use-template/[id]/` - ID generation from specific templates
  - `all-ids/` - View and manage generated ID cards
  - `auth/` - Authentication pages (login, signup, password reset)
  - `account/` - User account management
  - `admin/` - Admin dashboard and user management
  - `profile/` - User profile management
  - `credits/` - Credit system and billing
  - `pricing/` - Pricing and subscription pages
  - `features/` - Feature showcase pages
  - `api/` - API endpoints for server operations
  - `webhooks/` - Webhook handlers (PayMongo integration)
- `tests/` - Testing infrastructure
  - `unit/` - Unit tests for components and utilities
  - `integration/` - Integration tests with Supabase
  - `edge-cases/` - Edge case testing scenarios
- `docs/` - Project documentation and analysis reports
- `specs/` - Technical specifications and implementation plans
- `static/` - Static assets (favicons, default images)

## Database Integration

- Uses Supabase with type-safe generated TypeScript types (`database.types.ts`)
- Row Level Security (RLS) policies enforce role-based access control
- Main tables: `templates`, `idcards`, `organizations`, `profiles`
- Organization-scoped data access patterns

## Role-Based Access Control

Role hierarchy: `super_admin` > `org_admin` > `id_gen_admin` > `id_gen_user`

- **Template Management**: Only admin roles (`super_admin`, `org_admin`, `id_gen_admin`) can create/edit templates
- **ID Generation**: All roles can generate IDs from available templates
- **Data Scope**: All operations are organization-scoped via `org_id`

See `specs/Spec-02-Aug20-ID-GEN-ROLE-INSTRUCTIONS.md` for detailed role implementation guidelines.

## 3D Rendering

Uses Threlte wrapper around Three.js for 3D ID card visualization and rendering. Components handle camera positioning, lighting, and card geometry calculations.

## State Management

- `templateStore.ts` - Template data and elements with complex TemplateElement interface
- `auth.ts` - User session and role management
- `darkMode.ts` - Theme state persistence

## Key Development Patterns

- Server-side route protection with `requireAuth()` in `+page.server.ts` files
- Type-safe Supabase operations with generated database types
- Component composition with shadcn-svelte UI primitives
- File upload/storage through Supabase Storage with organization-scoped paths

## Testing Strategy

- **Integration tests**: Playwright for end-to-end scenarios
- **Unit tests**: Vitest with Testing Library for component testing
- **Mocking**: MSW for API mocking in tests

## Development Notes

- Server binds to `127.0.0.1:5173` specifically for Windows compatibility
- Vite optimizes deps for 3D libraries and UI components
- Uses session storage for auth persistence (not localStorage)
- Environment variables through SvelteKit's `$env` modules
