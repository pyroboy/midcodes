import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { readable } from 'svelte/store'

// Mock SvelteKit's navigation functions
vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
    invalidate: vi.fn(),
}))

// Mock SvelteKit's environment variables
vi.mock('$app/environment', () => ({
    browser: true,
    dev: true,
    building: false,
}))

// Mock SvelteKit's stores
vi.mock('$app/stores', () => ({
    page: readable({}),
    navigating: readable(null),
    updated: readable(false),
}))
