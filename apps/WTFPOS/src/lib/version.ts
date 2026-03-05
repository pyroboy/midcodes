// ─── App Version Tracking ────────────────────────────────────────────────────
// Bump APP_VERSION on every meaningful release.
// BUILD_DATE is auto-injected by Vite at build time (see vite.config.ts).
//
// UPDATE PROTOCOL — When is it safe to push updates?
//
//   SAFE (anytime, even mid-service):
//     • Typo fixes, color tweaks, label changes
//     • Bug fixes that don't touch RxDB schemas
//     • New UI features that read existing data
//
//   CAUTION (do during slow hours 2–4 PM, or between shifts):
//     • New store logic that changes how data is written
//     • Adding new RxDB collections (no migration needed, but test first)
//
//   DANGER (only after service ends, 10 PM+):
//     • RxDB schema version bumps (triggers per-device migration)
//     • Removing or renaming fields in schemas
//     • Changing primary keys or collection names
//
//   NEVER:
//     • Force-clearing IndexedDB remotely
//     • Deploying untested schema migrations during operating hours
//
// ROLLOUT ORDER:
//   1. Deploy new build to server
//   2. Update ONE tablet (canary) → verify 15 min
//   3. Update remaining tablets at the same branch
//   4. Move to next branch
//   5. Owner phones last (lowest risk)
// ─────────────────────────────────────────────────────────────────────────────

export const APP_VERSION = '0.1.0';

/** Injected at build time by Vite's `define` config. Falls back to 'dev' in dev mode. */
export const BUILD_DATE: string = __BUILD_DATE__;

/** Injected at build time. Falls back to 'development' in dev mode. */
export const BUILD_MODE: string = __BUILD_MODE__;

// Global declarations so TypeScript doesn't complain about the Vite injections
declare global {
	const __BUILD_DATE__: string;
	const __BUILD_MODE__: string;
}
