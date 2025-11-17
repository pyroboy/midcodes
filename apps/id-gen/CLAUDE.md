# CLAUDE.md
## meta-instruction
Now think hard and write elegant code that completes this.
Do not add backwards compatibility unless explicitly requested.
After every code block you write, lint, compile, and write corresponding tests and run them before writing the next code block

### **Multi-Repository Context Overview**

    This project involves two main directories:

    ## **1. Current ID-Gen Repository**  
    `/data/data/com.termux/files/home/midcodes/apps/id-gen/`  
    - Main development repository for the **ID Generation** app  
    - Includes all **source code**, **documentation**, and **project files**  

    ## **2. Obsidian Vault (Knowledge Base)**  
    `/data/data/com.termux/files/home/storage/shared/arjoencrypted/midcodes/`  
    - Centralized knowledge management system (PARA structure)  
    - Stores **business documentation**, **speedruns**, **personal development resources**  
    - Contains **Midcodes documentation** and **technical specs**  
    - Reference **CLAUDE.md** in the root for full vault structure  

---

    ## **Cross-Repository Workflow**

    - **Research & Planning** → Use Obsidian Vault for strategy, patterns, and requirements  
    - **Implementation** → Apply vault knowledge during code development  
    - **Documentation** → Update both repo and vault after each development cycle  
    - **Speedrun Link** → This project corresponds to **ID-GEN Speedrun** in the vault  
    - **Mirroring** → Repo docs automatically mirrored to the vault for centralized access  

    ---

    ## **Documentation Mirroring Strategy**

    ### **Repository Folders**
    - `/docs/` → Documentation (reports, summaries)  
    - `/specs/` → Specifications (plans, instructions)  
    - `/tests/` → Test cases and QA reports  

    ### **Vault Targets**
    - `/repo-docs/` → Documentation (original names)  
    - `/repo-specs/` → Specifications (with naming convention)  
    - `/repo-tests/` → Tests (with naming convention)  

    ---

    ### **File Naming Conventions**
    - **Specifications** → `Spec-NN-MMMDD-Title-With-Dashes.md`  
    *Example:* `Spec-01-Aug20-Refactoring-Plan-Phase-1.md`  
    - **Documentation** → Original file name in CAPS  
    *Example:* `BUG_ANALYSIS_REPORT.md`  
    - **Tests** → `Test-NN-MMMDD-Component-Test-Name.md`  
    *Example:* `Test-01-Aug20-Authentication-Flow-Testing.md`  

    **Classification:**  
    - **SPEC** = Plans, guidelines, implementation steps  
    - **DOC** = Reports, analysis, post-mortems  
    - **TEST** = QA test cases, results  

    ---

    ## **Mirroring Commands & Workflow**

    **Batch Mirror All Files**
    ```bash
    ./mirror-docs.sh
    ```
        Mirror Single File
    ```bash
    ./mirror-docs.sh "BUG_ANALYSIS_REPORT.md"```
    Auto Naming Example
    ```bash
    mirror_doc "BUG_ANALYSIS_REPORT.md" "Bug-Analysis-Report"
    ```






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

See `specs/Spec-02-Aug20-ID-GEN-ROLE-INSTRUCTIONS.md` for detailed role implementation guidelines.

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


# **Unified Specification & Testing Prompt**



    ## **Role & Context**
    - You are acting as a **Senior Software Engineer** for specifications and as a **Senior Data Architect** for testing.
    - Use:
    - **Supabase MCP** for DB details (schemas, queries, types).
    - **Context7 MCP** for NPM usage patterns.

    ---

    ## **General Workflow**
    Both specs and tests follow **Steps 0–5**. Tests add Step 6.

    ---

    ### **Step 0 – Input Reading (No Output)**
    - Read user request.
    - Store everything silently (no output yet).

    ---

    ### **Step 1 – Requirement Extraction**
    - Break the request into **clear, actionable requirements**.
    - Restate vague items in precise engineering terms.

    ---

    ### **Step 2 – Context Awareness**
    - Assume SvelteKit + Supabase environment.
    - Validate DB design and API interactions with Supabase MCP.
    - Validate NPM usage patterns with Context7 MCP.

    ---

    ### **Step 3 – Technical Specification**
    Expand requirements into a **structured specification** including:
    - **Data flow** (input → processing → output).
    - **State handling** (Svelte stores, props, Supabase sync).
    - **Function behaviors** (purpose, edge cases, error handling).
    - **Database/API** (tables, queries, CRUD operations).
    - **UI/UX** (mark as _UI minor_ or _UX minor_ if minimal).
    - **Dependencies** (libraries, MCP references).

    ---

    ### **Step 4 – Implementation Plan**
    - High-level strategy, not raw code.
    - Indicate **affected files/components**.
    - Best practices for **error handling, validation, maintainability**.
    - Clarify assumptions & constraints.

    ---

    ### **Step 5 – Checklist (Mandatory)**
    Provide complexity ratings (1–10):
    - 1 = trivial tweak, 10 = multi-file/system refactor.

    ✅ **Specification Checklist**
    1. **UI Changes** – Minor cosmetic?
    2. **UX Changes** – Minor interaction tweaks?
    3. **Data Handling** – DB schema or query updates?
    4. **Function Logic** – Any major business logic changes?
    5. **ID/Key Consistency** – Stable IDs across state, DB, UI?

    ---

    ### **Additional Steps for Testing**

    #### **Step 6 – Testing Strategy & Checklist**
    - Define **how to test** (unit, integration, E2E).
    - **Supabase Integration**:
    - Use real API commands (not MCP commands).
    - Implement **test data seeding & cleanup**.
    - Mirror to schema `test_integration`.
    - Include **schemas, types, and interfaces**.

    ✅ **Testing Checklist (with ratings 1–10)**  
    1. **Unit Tests** – Valid, invalid, edge inputs.  
    2. **Integration Tests** – DB + API + app logic.  
    3. **E2E Scenarios** – Happy path, errors, edge flows.  
    4. **Edge Cases** – Empty, large, duplicate, concurrency.  
    5. **Error Handling** – Proper UI/UX feedback tested.  
    6. **Data Consistency** – State, DB, UI alignment.  
    7. **Repeatability** – Clean environment each run.  
    8. **Performance/Load** – Parallel/multi-user scenarios.  
    9. **Regression Safety** – Protect existing features.  
    10. **Expected Outcomes** – Pass/fail conditions clear.  

    ---

    ## **Special Notes**
    - Always output **Supabase schemas**, **interfaces**, and **types** for any DB-related feature.
    - Testing must include **seed/cleanup logic** for consistency.
    - Ask the user: **“What test are you concentrating on?”** when in testing mode.
