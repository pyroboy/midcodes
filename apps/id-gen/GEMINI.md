# GEMINI.md - Project Context & Instructions

## Project Overview
**id-gen** is a comprehensive ID card generation application built with SvelteKit. It allows users to create, customize, and generate ID cards using templates, AI-powered asset decomposition, and 3D previews.

## Technology Stack
*   **Framework:** SvelteKit 2.x (Full-stack)
*   **Language:** TypeScript
*   **Database:** Neon (PostgreSQL) with Drizzle ORM
*   **Authentication:** Better Auth (Replaces Supabase Auth)
*   **Storage:** Cloudflare R2 (via AWS S3 SDK)
*   **Styling:** TailwindCSS 4.x
*   **UI Components:** shadcn-svelte, bits-ui
*   **3D Graphics:** Threlte (Three.js wrapper)
*   **Form Validation:** sveltekit-superforms + Zod
*   **Deployment:** Cloudflare Pages / Vercel (Node.js 20.x runtime)
*   **AI:** Fal.ai (Qwen-Image-Layered) for image decomposition

## Development Workflow

### Key Commands
*   `pnpm run dev`: Start development server (127.0.0.1:5173).
*   `pnpm run build`: Build for production.
*   `pnpm run check`: Run TypeScript type checking (Critical before changes).
*   `pnpm run lint`: Run Prettier and ESLint.
*   `pnpm run test`: Run all tests (Integration + Unit).
*   `pnpm run test:unit`: Run Vitest unit tests.
*   `pnpm run test:integration`: Run Playwright E2E tests.

### Database Operations
*   Schema Source: `src/lib/server/schema.ts`
*   Migrations: `drizzle/`
*   Generate Migration: `drizzle-kit generate` (Use `npx` or `pnpm exec`)
*   Push Schema: `drizzle-kit push` or `drizzle-kit migrate` (Check `package.json` for specific scripts or use standard drizzle commands).

## Architecture Highlights

### Authentication & Permissions
*   **Better Auth:** Integrated in `src/hooks.server.ts` and `src/lib/server/auth.ts`.
*   **Lazy Initialization:** DB and Auth are lazily initialized to support Cloudflare Workers.
*   **RBAC:** Roles (`super_admin`, `org_admin`, `id_gen_admin`, `id_gen_user`).
*   **Scope:** Data is organization-scoped via `org_id`.

### Data Management
*   **Database:** Access via `src/lib/server/db.ts` (`getDb()`).
*   **Schemas:** All validation schemas reside in `src/lib/schemas/`. This is the **Single Source of Truth**.
*   **Templates:** Dimensions stored in pixels + DPI. Elements (text, image, qr, etc.) stored in `templateElements` (JSONB).

### Asset Storage (Cloudflare R2)
*   **Paths:** Defined in `src/lib/utils/storagePath.ts`.
*   **Proxy:** Images often routed through `/api/image-proxy` to handle CORS for Canvas/Three.js.
*   **Conventions:** `getStorageUrl` for direct `<img>` tags, `getProxiedUrl` for Canvas/3D.

### AI Decomposition
*   Uses `fal.ai` to decompose images into layers.
*   Code location: `src/lib/server/fal-layers.ts`, `src/lib/remote/decompose.remote.ts`.

## Directory Structure
*   `src/lib/server/`: Server-side logic (DB, Auth, S3, Env).
*   `src/lib/schemas/`: Zod schemas (Validation, Types).
*   `src/lib/stores/`: Svelte stores (Auth, Template state).
*   `src/routes/(shell)`: Main application UI routes.
*   `src/routes/api`: API endpoints (Image proxy, etc.).
*   `tests/`: Unit and Integration tests.

## Coding Conventions
1.  **Strict Typing:** Ensure all code passes `pnpm run check`.
2.  **Schema-First:** Modify schemas in `src/lib/schemas/` before UI or DB logic.
3.  **Lazy Loading:** Respect the lazy initialization pattern for DB and Auth.
4.  **Testing:** Add unit tests for logic and integration tests for flows.
5.  **Environment:** Use `$env/static/public` and `$env/static/private`.

## Essential Files to Reference
*   `CLAUDE.md`: Detailed developer guide and context.
*   `package.json`: Dependencies and scripts.
*   `src/lib/server/schema.ts`: Database schema definition.
*   `src/hooks.server.ts`: Request handling and auth flow.
