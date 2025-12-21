# Admin Tools Compressed Context (v1.0)

This document provides a compressed, high-density context of the admin layer for the ID Generator application. It is designed to help AI assistants quickly understand and work on the administrative components.

## 核心 (Core Architecture)

- **Auth Framework**: Better Auth with a custom RBAC layer.
- **Data Access**: SvelteKit Remote Functions (AZPOS pattern) + Drizzle ORM (Neon DB).
- **Access Control**: Hierarchy: `super_admin` > `org_admin` > `id_gen_admin` > `id_gen_user`.
- **Role Emulation**: Admins can emulate lower roles for testing; `locals.roleEmulation.originalRole` preserves true identity.

## 路由索引 (Route Index) - `/admin`

| Path | Purpose | Key Sub-pages |
| :--- | :--- | :--- |
| `/admin` | Root Dashboard | Stats, Activity, Navigation |
| `/admin/users` | User Mgmt | List, Add, Update Role, Delete |
| `/admin/roles` | RBAC | Role creation, Permission mapping |
| `/admin/organization`| Tenant Mgmt | Settings, ID prefixes, Org details |
| `/admin/template-assets`| Detection | Wizard for auto-detecting card regions |
| `/admin/template-assets/manage`| Asset Bank | Gallery of backgrounds, assets |
| `/admin/overlay-batch`| Processing | Bulk generation of ID cards |
| `/admin/invoices` | Billing | Invoice history, status |
| `/admin/credits` | Currencies | Allocation, balance tracking |
| `/admin/analytics` | Insights | Usage charts, generation trends |
| `/admin/ai-*` | GenAI Config | Settings/Gen for AI features |

## 数据模式 (Data Patterns)

### Profiles Table (`schema.profiles`)
- `id`: Better Auth user ID (string)
- `role`: enum (`super_admin`, `org_admin`, etc.)
- `orgId`: Multi-tenant key
- `creditsBalance`: Number
- `context`: JSONB (emulation state)

### Remote Functions (`admin.remote.ts`)
- `requireAdminPermissions()`: Core guard for all admin queries/commands.
- `getAdminDashboardData()`: Aggregates counts for Cards, Users, Templates, and Revenue.
- `getUsersData()` / `addUser()` / `updateUserRole()`: User management operations.
- `getRolesData()`: Fetches roles and `availablePermissions` array.

## 关键逻辑 (Critical Logic)

### RBAC Checks (`$lib/utils/adminPermissions.ts`)
- `hasRole(locals, roles[])`: Broad check.
- `checkSuperAdmin(locals)` / `checkAdmin(locals)`: Specific level checks.
- *Tip*: Always check both effective and original roles to handle emulation correctly.

### Storage Paths (`$lib/utils/storagePath.ts`)
- `templates/[id]/background-front.png`
- `assets/[id]/sample.png`
- `cards/[org]/[tpl]/[id]/rendered.png`

### Image Proxy (`/api/image-proxy`)
- Used for Canvas/Three.js assets to avoid CORS issues from R2.
- Helper: `getProxiedUrl(path)` in `$lib/utils/storage.ts`.
