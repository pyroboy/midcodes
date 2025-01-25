import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./apps/travel/vite.config.js",
  "./apps/dorm/vite.config.ts",
  "./apps/dokmutya/vite.config.ts",
  "./apps/web/vitest.config.ts",
  "./apps/schooldocs/vite.config.ts"
])
