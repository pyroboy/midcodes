# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**id-gen** is a comprehensive ID card generation application built with SvelteKit 2.x. It enables users to create, customize, and generate ID cards using templates, AI-powered asset decomposition, 3D previews, and fast QR-based encoding.

### Core Features

- **Template Management**: Create, edit, and manage ID card templates with drag-and-drop element positioning
- **AI Decomposition**: Separate template images into RGBA layers using fal.ai's Qwen-Image-Layered model
- **3D Preview**: Real-time card previews using Threlte (Three.js wrapper for Svelte)
- **Fast Encoding**: Quick ID generation via template-based encoding with QR codes
- **Multi-tenant Architecture**: Organization-scoped data with RBAC (Role-Based Access Control)
- **Payment System**: Credits-based billing with invoice generation

---

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
pnpm run check            # TypeScript type checking (CRITICAL before changes)
pnpm run check:watch      # Type checking in watch mode
pnpm run lint             # Prettier + ESLint check
pnpm run format           # Auto-format with Prettier

# Supabase Edge Functions
pnpm run serve:edge       # Serve edge functions locally
pnpm run deploy:edge      # Deploy edge functions

# Maintenance
pnpm run clean            # Clear .svelte-kit, build, and cache
```

---

## Technology Stack

| Category           | Technology                                         |
| ------------------ | -------------------------------------------------- |
| **Framework**      | SvelteKit 2.x (Full-stack) + TypeScript            |
| **Database**       | Neon (PostgreSQL) + Drizzle ORM                    |
| **Authentication** | Better Auth (replaces Supabase Auth)               |
| **Storage**        | Cloudflare R2 (via AWS S3 SDK)                     |
| **Styling**        | TailwindCSS 4.x with `@tailwindcss/vite`           |
| **UI Components**  | shadcn-svelte + bits-ui                            |
| **3D Graphics**    | Threlte (@threlte/core, @threlte/extras) + Three.js |
| **Forms**          | sveltekit-superforms + Zod 4                       |
| **AI Services**    | fal.ai (Qwen-Image-Layered), Runware               |
| **Deployment**     | Vercel / Cloudflare Pages (Node.js 20.x)           |

---

## Architecture Overview

### Project Structure

```
src/
├── app.css, app.d.ts, app.html    # App entry files
├── hooks.server.ts                 # Auth, security headers, route guards
├── lib/
│   ├── server/                     # Server-only code
│   │   ├── auth.ts                 # Better Auth configuration
│   │   ├── db.ts                   # Neon/Drizzle connection (lazy init)
│   │   ├── schema.ts               # Drizzle table definitions (DB source of truth)
│   │   ├── s3.ts                   # Cloudflare R2 client
│   │   ├── env.ts                  # Environment validation
│   │   ├── fal-layers.ts           # AI decomposition via fal.ai
│   │   ├── runware.ts              # Runware AI integration
│   │   └── payments/               # Payment processing
│   ├── schemas/                    # Zod validation schemas (SINGLE SOURCE OF TRUTH)
│   │   ├── template-element.schema.ts
│   │   ├── template-creation.schema.ts
│   │   ├── billing.schema.ts
│   │   ├── organization.schema.ts
│   │   └── ...
│   ├── stores/                     # Svelte stores
│   │   ├── auth.ts, auth.svelte.ts # Auth state
│   │   ├── templateStore.ts        # Template data
│   │   └── darkMode.ts, theme.ts   # Theme persistence
│   ├── remote/                     # Server commands (Remote Functions)
│   │   ├── templates.remote.ts
│   │   ├── decompose.remote.ts
│   │   ├── billing.remote.ts
│   │   ├── invoices.remote.ts
│   │   └── ...
│   ├── components/                 # UI components
│   │   ├── ui/                     # shadcn-svelte components
│   │   ├── marketing/              # Homepage/marketing 3D components
│   │   ├── card3d/                 # 3D card preview
│   │   └── template-assets/        # Asset management
│   ├── marketing/                  # Marketing page utilities
│   │   ├── animation/              # Animation helpers
│   │   ├── scroll/                 # Scroll-driven animations
│   │   └── textures/               # 3D textures
│   ├── utils/                      # Utility functions
│   └── types/                      # TypeScript types
└── routes/
    ├── (shell)/                    # Main app shell (authenticated routes)
    │   ├── +layout.svelte          # Main layout with nav
    │   ├── admin/                  # Admin panel
    │   │   ├── template-assets/    # Asset catalog management
    │   │   ├── docs/               # Internal documentation
    │   │   ├── invoices/           # Invoice management
    │   │   ├── credits/            # Credit management
    │   │   └── ...
    │   ├── templates/              # Template editor
    │   ├── use-template/           # ID card encoding flow
    │   ├── all-ids/                # Generated IDs view
    │   ├── billing/                # Billing page
    │   ├── dashboard/              # User dashboard
    │   └── auth/                   # Auth pages
    ├── api/                        # API endpoints
    │   └── image-proxy/            # CORS proxy for R2 images
    └── id/                         # Public QR landing pages
```

### Authentication Flow (Better Auth)

1. `src/hooks.server.ts` uses Better Auth via lazy-initialized `auth` proxy
2. Session retrieved via `auth.api.getSession({ headers })` - populates `event.locals`
3. Profile fetched from Neon/Drizzle `profiles` table (linked by `user.id`)
4. Role emulation state stored in profile's `context` JSONB field
5. Permissions fetched via `getUserPermissions()` with 5-minute cache TTL

### Lazy Initialization Pattern

Database and auth are lazily initialized to support Cloudflare Workers:

- `src/lib/server/db.ts` - `getDb()` returns Drizzle instance, `db` is a Proxy
- `src/lib/server/auth.ts` - `getAuth()` returns Better Auth instance, `auth` is a Proxy
- Environment validation runs on first request via `initializeEnv()`

### Role-Based Access Control

Hierarchy: `super_admin` > `org_admin` > `id_gen_admin` > `id_gen_user`

- All data is organization-scoped via `org_id`
- Permissions fetched from `role_permissions` table and cached (5min TTL)
- Route protection in `+page.server.ts` files (check `session` in locals)

### State Management

| Store                   | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `auth.ts / auth.svelte.ts` | Auth state (user, session, profile, roleEmulation) |
| `templateStore.ts`      | Template data with TemplateElement interface |
| `darkMode.ts / theme.ts` | Theme persistence                        |
| `featureFlags.ts`       | Feature flag management                  |
| `dataCache.ts`          | Data caching utilities                   |
| `encodeInput.ts`        | Encoding flow state                      |

---

## Database Schema (Neon + Drizzle)

Schema defined in `src/lib/server/schema.ts`. Key tables:

### Core Tables

| Table              | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `profiles`         | User data linked to Better Auth `user.id` (TEXT PK) |
| `organizations`    | Multi-tenant scope for all data                   |
| `templates`        | ID card templates with `templateElements` JSONB   |
| `templateAssets`   | Asset catalog entries (linked to templates)       |
| `templateSizePresets` | Standard size presets (CR80, A4, etc.)         |
| `idcards`          | Generated cards with `originalAssets` JSONB       |
| `rolePermissions`  | RBAC mapping (role → permission)                  |

### Billing Tables

| Table            | Purpose                   |
| ---------------- | ------------------------- |
| `paymentRecords` | Payment transaction logs  |
| `invoices`       | Invoice records           |
| `invoiceItems`   | Line items on invoices    |

### Better Auth Tables

- `user`, `session`, `account`, `verification` - Managed by Better Auth

### Enums (Drizzle pgEnum)

```typescript
userRoleEnum: 'super_admin' | 'org_admin' | 'id_gen_admin' | 'id_gen_user' | 'user'
appPermissionEnum: 'templates.create' | 'templates.read' | 'idcards.create' | ...
```

---

## Asset Storage (Cloudflare R2)

Storage paths defined in `src/lib/utils/storagePath.ts`:

```
templates/[templateId]/template-front.png           # Full-res template background
templates/[templateId]/template-front-preview.png   # Preview variant
cards/[orgId]/[templateId]/[cardId]/front.png       # Rendered ID card
cards/[orgId]/[templateId]/[cardId]/raw/photo.png   # Uploaded user assets
```

### Key Functions

- `getTemplateAssetPath(templateId, variant, side)` - Template backgrounds
- `getCardAssetPath(orgId, templateId, cardId, variant, side)` - Rendered cards
- `getCardRawAssetPath(orgId, templateId, cardId, variableName)` - User uploads

### R2 Configuration

- Single bucket configured via `R2_BUCKET_NAME` env var (default: `id-gen-assets`)
- Public domain: `R2_PUBLIC_DOMAIN` (e.g., `assets.kanaya.app`)

---

## Image Loading Best Practices

### URL Types and Handling

| Type           | Example                                           | Handling                                |
| -------------- | ------------------------------------------------- | --------------------------------------- |
| Local paths    | `/placeholder.png`                                | Return as-is, no processing             |
| Full R2 URLs   | `https://assets.kanaya.app/templates/abc/img.png` | Route through proxy                     |
| Relative paths | `templates/abc/img.png`                           | Resolve via `getStorageUrl`, then proxy |

### Key Functions (`src/lib/utils/storage.ts`)

```typescript
// Converts path to full URL (adds domain)
getStorageUrl(path, bucket?) → string

// Handles CORS - routes R2 URLs through proxy
getProxiedUrl(pathOrUrl, bucket?) → string | null
```

### When to Use Each Function

- **`getStorageUrl`**: For `<img>` tags and direct display (no CORS issues)
- **`getProxiedUrl`**: For Canvas/Three.js texture loading (requires CORS)

### CORS and the Image Proxy

Canvas operations (`drawImage`, Three.js textures) require CORS headers. The proxy at `/api/image-proxy` bypasses this:

```
Browser → /api/image-proxy?url=... (same-origin, no CORS)
Server  → fetches from R2 (server-to-server, no CORS needed)
Server  → returns image to browser
```

**Security**: Proxy only allows `assets.kanaya.app` domain (see `src/routes/api/image-proxy/+server.ts`)

---

## AI Layer Decomposition (Qwen-Image-Layered via fal.ai)

The Decompose feature uses fal.ai's Qwen-Image-Layered model to separate template images into RGBA layers for element extraction.

### Route & Files

| Path                                           | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| `/admin/template-assets/decompose?assetId=xxx` | Decompose UI page         |
| `src/lib/server/fal-layers.ts`                 | fal.ai API integration    |
| `src/lib/schemas/decompose.schema.ts`          | Layer & selection schemas |
| `src/lib/remote/decompose.remote.ts`           | Server commands           |

### API Configuration

```bash
# Add to .env (optional - mock mode if missing)
FAL_KEY=your_fal_api_key
```

### Key Types

```typescript
// Layer from fal.ai (full-size transparent PNG)
interface FalLayer {
	url: string;      // Hosted PNG URL
	width: number;
	height: number;
	zIndex: number;   // 0 = bottom layer
}

// User selection for element conversion
interface LayerSelection {
	layerId: string;
	included: boolean;
	elementType: 'image' | 'text' | 'photo' | 'qr' | 'signature';
	variableName: string;
	bounds: { x; y; width; height };
	layerImageUrl?: string;
}
```

### Workflow

1. Navigate to `/admin/template-assets/manage`
2. Click "Decompose" button (purple) on any asset
3. Click "Decompose Front/Back" to run AI analysis
4. Tag each layer with element type and variable name
5. Click "Save to Template" to convert layers to `templateElements`
6. Redirects to `/templates?id=xxx` for editing

---

## Remote Functions (Server Commands)

Located in `src/lib/remote/`, these provide server-side operations:

| File                       | Purpose                           |
| -------------------------- | --------------------------------- |
| `templates.remote.ts`      | Template CRUD operations          |
| `templates.update.remote.ts` | Template update operations      |
| `decompose.remote.ts`      | AI layer decomposition            |
| `billing.remote.ts`        | Payment and checkout              |
| `invoices.remote.ts`       | Invoice generation                |
| `admin.remote.ts`          | Admin panel operations            |
| `analytics.remote.ts`      | Dashboard analytics               |
| `enhance.remote.ts`        | AI image enhancement              |
| `payments.remote.ts`       | Payment processing                |

---

## 3D Graphics (Threlte)

### Key Components

| Component                  | Purpose                           |
| -------------------------- | --------------------------------- |
| `HeroCard3D.svelte`        | Homepage 3D card animation        |
| `PhoneMesh.svelte`         | Phone model for marketing         |
| `DigitalCard3D.svelte`     | Interactive card preview          |
| `TemplateCard3D.svelte`    | Template preview with flip        |
| `ModalCard3DPreview.svelte`| Modal with 3D card view           |
| `IDCarousel3D.svelte`      | 3D carousel of ID cards           |

### Marketing Animations

Located in `src/lib/marketing/`:

- `animation/` - Animation utilities and easing
- `scroll/` - Scroll-driven animations (hero, architecture sections)
- `textures/` - 3D texture management

---

## Schemas (Single Source of Truth)

All validation schemas in `src/lib/schemas/`:

| Schema File                    | Purpose                      |
| ------------------------------ | ---------------------------- |
| `template-element.schema.ts`   | Element type definitions     |
| `template-creation.schema.ts`  | Template creation/presets    |
| `template-update.schema.ts`    | Partial updates, bulk ops    |
| `billing.schema.ts`            | Billing and credits          |
| `organization.schema.ts`       | Organization settings        |
| `idcard.schema.ts`             | ID card data                 |
| `decompose.schema.ts`          | AI decomposition             |
| `display-conversion.schema.ts` | Unit conversions             |

---

## Key File Locations

| File                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `src/hooks.server.ts`          | Auth initialization, route guards, security headers |
| `src/lib/server/auth.ts`       | Better Auth configuration with Drizzle adapter |
| `src/lib/server/db.ts`         | Neon/Drizzle database connection             |
| `src/lib/server/schema.ts`     | Drizzle table definitions (DB source of truth) |
| `src/lib/server/s3.ts`         | Cloudflare R2 storage client                 |
| `src/lib/server/env.ts`        | Environment variable validation              |
| `src/lib/services/permissions.ts` | Permission checking with cache            |
| `tests/setup.ts`               | Test environment setup (File API mock)       |

---

## Testing Patterns

- **Unit tests**: Vitest + Testing Library in `src/**/*.test.ts` or `tests/**/*.test.ts`
- **Integration tests**: Playwright in `tests/integration/`
- **API mocking**: MSW for Supabase mocking
- **Test setup**: `tests/setup.ts` (includes File API mock for jsdom)

---

## Development Notes

- Server binds to `127.0.0.1:5173` for Windows compatibility
- Uses session storage for auth (not localStorage)
- Environment variables via `$env/static/public` and `$env/static/private`
- 3D libraries optimized in `vite.config.ts` (exclude ws/events, include three/threlte)

---

## Template Data Conformity (Assets ↔ Templates)

### Data Relationship

```
templateAssets (catalog entry)
    ├── templateId → templates.id (FK)
    ├── imageUrl, backImageUrl (stored URLs - can drift)
    └── widthPixels, heightPixels, orientation

templates (actual template data)
    ├── frontBackground, backBackground (canonical URLs)
    ├── templateElements (JSONB array)
    └── widthPixels, heightPixels, dpi, orientation
```

### Best Practices

1. **Always edit via template** - Don't update asset URLs directly
2. **Use Sync after template edits** - Ensures asset catalog stays current
3. **Prefer template URLs** - When displaying, use joined template data if available
4. **Decompose creates elements** - Not new images; layers become `templateElements`

---

## Meta-Instructions

After writing code blocks, run type check before continuing:

```bash
pnpm run check
```
