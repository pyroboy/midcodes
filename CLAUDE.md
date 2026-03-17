# CLAUDE.md

This file provides guidance to Claude Code when working in this monorepo.

## Monorepo Structure

- **Package manager**: pnpm 9.12.1 with workspaces (`apps/*`, `packages/*`)
- **Build system**: Turbo
- **Node**: >=20

## Commands (run from root)

- `pnpm install` — install all workspace dependencies
- `pnpm -F <app> dev` — run dev server for a specific app
- `pnpm -F <app> build` — build a specific app
- `pnpm -F <app> check` — type-check a specific app

## Apps

| App | Stack | Description |
|-----|-------|-------------|
| `WTFPOS` | SvelteKit 2 + Svelte 5 runes, Tailwind v3 | POS for WTF! Samgyupsal restaurant (active) |
| `dorm` | SvelteKit + Supabase + shadcn-svelte | Dormitory management |
| `marchoffaith` | SvelteKit 5 | Church website |
| `kanaya` | SvelteKit 2 + Neon + Drizzle + Better Auth | Kanaya Identity Solutions (ID card generation) |
| `dorm-docs` | SvelteKit | Dorm documentation site |

## Conventions

- **Svelte 5 runes**: Use `$state()`, `$derived()`, `$effect()` — not legacy stores
- **Store files**: Must use `.svelte.ts` extension for runes reactivity
- **No top-level await** in client modules (Safari WebKit bug #242740)
- **Currency**: Philippine Peso (PHP) — use `formatPeso()` or `formatCurrency()` helpers
- **Server logic**: SvelteKit `.server.ts` pattern (frontend-first approach)
