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
- **Better Auth** - Authentication (replaces Supabase Auth)
- **Drizzle ORM + Neon** - Database via `@neondatabase/serverless` (type-safe via `src/lib/server/schema.ts`)
- **Cloudflare R2** - Asset storage via AWS S3 SDK
- **TailwindCSS 4.x** - Styling with `@tailwindcss/vite`
- **Threlte** - 3D graphics (Three.js wrapper for Svelte)
- **shadcn-svelte** + **bits-ui** - UI component library
- **sveltekit-superforms** + **Zod 4** - Form validation
- **Vercel/Cloudflare** - Deployment (Node.js 20.x runtime)

## Architecture Overview

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

- `src/lib/stores/auth.ts` - Auth state (user, session, profile, roleEmulation)
- `src/lib/stores/templateStore.ts` - Template data with TemplateElement interface
- `src/lib/stores/darkMode.ts` - Theme persistence

### Key Data Patterns

- **Templates**: Dimensions stored as pixels + DPI (not physical units)
- **Template Elements**: Discriminated union by `type` field (`text`, `image`, `qr`, `photo`, `signature`, `selection`)
- **Database Operations**: Use Drizzle ORM via `db` from `$lib/server/db`
- **Storage Operations**: Use R2 helpers from `$lib/server/s3` (`uploadToR2`, `getPublicUrl`)

### Asset Storage (Cloudflare R2)

Storage paths defined in `src/lib/utils/storagePath.ts`:

```
templates/[templateId]/template-front.png           # Full-res template background
templates/[templateId]/template-front-preview.png   # Preview variant
cards/[orgId]/[templateId]/[cardId]/front.png       # Rendered ID card
cards/[orgId]/[templateId]/[cardId]/raw/photo.png   # Uploaded user assets
```

Key functions:

- `getTemplateAssetPath(templateId, variant, side)` - Template backgrounds
- `getCardAssetPath(orgId, templateId, cardId, variant, side)` - Rendered cards
- `getCardRawAssetPath(orgId, templateId, cardId, variableName)` - User uploads

### Schemas (Single Source of Truth)

All validation schemas in `src/lib/schemas/`:

- `template-element.schema.ts` - Element type definitions
- `template-creation.schema.ts` - Template creation/presets
- `template-update.schema.ts` - Partial updates, bulk ops
- `display-conversion.schema.ts` - Unit conversions

## Key File Locations

- `src/hooks.server.ts` - Auth initialization, route guards, security headers
- `src/lib/server/auth.ts` - Better Auth configuration with Drizzle adapter
- `src/lib/server/db.ts` - Neon/Drizzle database connection
- `src/lib/server/schema.ts` - Drizzle table definitions (source of truth for DB types)
- `src/lib/server/s3.ts` - Cloudflare R2 storage client
- `src/lib/server/env.ts` - Environment variable validation
- `src/lib/services/permissions.ts` - Permission checking with cache
- `tests/setup.ts` - Test environment setup (includes File API mock for jsdom)

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

## Database Schema (Neon + Drizzle)

Schema defined in `src/lib/server/schema.ts`. Key tables:

### Core Tables

- **`profiles`** - User data linked to Better Auth `user.id` (TEXT PK, not UUID)
  - `role`: user_role enum, `creditsBalance`, `context` (JSONB for role emulation)
- **`templates`** - ID card templates with `templateElements` JSONB
- **`idcards`** - Generated cards with `originalAssets` JSONB for raw uploads
- **`organizations`** - Multi-tenant scope for all data
- **`rolePermissions`** - RBAC mapping (role → permission)

### Better Auth Tables

- **`user`**, **`session`**, **`account`**, **`verification`** - Managed by Better Auth

### Enums (Drizzle pgEnum)

```typescript
userRoleEnum: 'super_admin' | 'org_admin' | 'id_gen_admin' | 'id_gen_user' | 'user'
appPermissionEnum: 'templates.create' | 'templates.read' | 'idcards.create' | ...
```

### R2 Storage Buckets

- Single bucket configured via `R2_BUCKET_NAME` env var (default: `id-gen-assets`)
- Public domain: `R2_PUBLIC_DOMAIN` (e.g., `assets.kanaya.app`)

---

## Image Loading Best Practices

### URL Types and Handling

There are three types of image URLs in this codebase:

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

### Database Storage Format

Templates store **full URLs** in `frontBackground`/`backBackground`:

```
https://assets.kanaya.app/templates/{templateId}/template-front.png
```

### Common Patterns

```svelte
<!-- For regular <img> display -->
<img src={getStorageUrl(path, 'templates')} />

<!-- For IdCanvas/3D textures (handles null + CORS) -->
backgroundUrl={template.front_background
	? template.front_background.startsWith('http')
		? template.front_background
		: getStorageUrl(template.front_background, 'templates')
	: ''}
```

### Troubleshooting

| Issue                         | Cause                            | Fix                              |
| ----------------------------- | -------------------------------- | -------------------------------- |
| CORS error on canvas          | Direct R2 URL without proxy      | Use `getProxiedUrl`              |
| 500 from proxy                | URL not from `assets.kanaya.app` | Check URL format                 |
| Gray 3D texture               | Texture failed to load           | Check browser console for errors |
| Local image 404 through proxy | Local path processed as R2 path  | Ensure `/` paths bypass proxy    |

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
	url: string; // Hosted PNG URL
	width: number;
	height: number;
	zIndex: number; // 0 = bottom layer
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

### Known Conformity Gaps

| Issue                       | Description                                                                  | Mitigation                                                |
| --------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| **URL Drift**               | Asset `imageUrl` can become stale when template `frontBackground` is updated | Use "Sync" button in manage page to re-pull from template |
| **Direct Supabase Calls**   | Manage page uses Supabase client for delete/toggle instead of server actions | Should migrate to server actions for consistency          |
| **Element Stats Staleness** | `stats.elementCount` from initial load doesn't update after decompose        | Page reload required to see updated counts                |

### URL Priority (Manage Page)

The manage page prefers live template URLs over stored asset URLs:

```typescript
// In +page.server.ts load function
image_url: stats?.urls?.front || asset.imageUrl,
back_image_url: stats?.urls?.back || asset.backImageUrl,
```

### Sync Operation

The "Sync" button (`regenerateAsset` action) pulls current data from linked template:

```typescript
await db.update(templateAssets).set({
	imageUrl: template.frontBackground,
	backImageUrl: template.backBackground,
	widthPixels: template.widthPixels,
	heightPixels: template.heightPixels,
	orientation: template.orientation
});
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
