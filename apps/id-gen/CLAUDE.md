# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start development server on localhost:5173
- `npm run dev -- --open` - Start dev server and open in browser

### Building and Testing

- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run type checking in watch mode
- `npm run test` - Run all tests (integration + unit)
- `npm run test:integration` - Run Playwright integration tests
- `npm run test:unit` - Run Vitest unit tests

### Code Quality

- `npm run lint` - Check code formatting and linting (Prettier + ESLint)
- `npm run format` - Auto-format code with Prettier

### Supabase Edge Functions

- `npm run serve:edge` - Serve edge functions locally with env vars
- `npm run deploy:edge` - Deploy role-emulation edge function

### Cleanup

- `npm run clean` - Remove build artifacts and cache

## Architecture

### Core Technology Stack

- **SvelteKit 2.x** with TypeScript - Full-stack framework
- **Vercel** deployment with Node.js 20.x runtime
- **Supabase** - Database, auth, and storage backend
- **TailwindCSS 4.x** - Utility-first styling
- **Threlte** (@threlte/core, @threlte/extras) - 3D graphics with Three.js
- **shadcn-svelte** - UI component library

### Project Structure

- `src/lib/` - Shared utilities and stores
  - `components/` - Reusable Svelte components including shadcn-svelte UI
  - `stores/` - Svelte stores for state management (auth, darkMode, templateStore)
  - `types/` - TypeScript type definitions including generated Supabase types
  - `utils/` - Helper functions for card geometry and ID card operations
- `src/routes/` - SvelteKit file-based routing
  - `templates/` - Template management pages (admin only)
  - `use-template/` - ID generation from templates
  - `all-ids/` - View generated ID cards
  - `auth/` - Authentication pages
  - `api/` - API endpoints

### Database Integration

- Uses Supabase with type-safe generated TypeScript types (`database.types.ts`)
- Row Level Security (RLS) policies enforce role-based access control
- Main tables: `templates`, `idcards`, `organizations`, `profiles`
- Organization-scoped data access patterns

### Role-Based Access Control

Role hierarchy: `super_admin` > `org_admin` > `id_gen_admin` > `id_gen_user`

**Template Management**: Only admin roles (`super_admin`, `org_admin`, `id_gen_admin`) can create/edit templates
**ID Generation**: All roles can generate IDs from available templates
**Data Scope**: All operations are organization-scoped via `org_id`

See `src/routes/ID_GEN_ROLE_INSTRUCTIONS.md` for detailed role implementation guidelines.

### 3D Rendering

Uses Threlte wrapper around Three.js for 3D ID card visualization and rendering. Components handle camera positioning, lighting, and card geometry calculations.

### State Management

- `templateStore.ts` - Template data and elements with complex TemplateElement interface
- `auth.ts` - User session and role management
- `darkMode.ts` - Theme state persistence

### Key Development Patterns

- Server-side route protection with `requireAuth()` in `+page.server.ts` files
- Type-safe Supabase operations with generated database types
- Component composition with shadcn-svelte UI primitives
- File upload/storage through Supabase Storage with organization-scoped paths

### Testing Strategy

- **Integration tests**: Playwright for end-to-end scenarios
- **Unit tests**: Vitest with Testing Library for component testing
- **Mocking**: MSW for API mocking in tests

### Development Notes

- Server binds to `127.0.0.1:5173` specifically for Windows compatibility
- Vite optimizes deps for 3D libraries and UI components
- Uses session storage for auth persistence (not localStorage)
- Environment variables through SvelteKit's `$env` modules
