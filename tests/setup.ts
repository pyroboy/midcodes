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

// Mock Lucide icons
vi.mock('lucide-svelte', () => {
    return {
        Crown: vi.fn().mockReturnValue({
            $$render: () => '<div class="mock-crown"></div>'
        })
    }
})

// Mock UI components
vi.mock('$lib/components/ui/button', () => {
    return {
        Button: vi.fn().mockReturnValue({
            $$render: () => '<button class="mock-button"></button>'
        })
    }
})

vi.mock('$lib/components/ui/label', () => {
    return {
        Label: vi.fn().mockReturnValue({
            $$render: () => '<label class="mock-label"></label>'
        })
    }
})

vi.mock('$lib/components/ui/select', () => {
    return {
        Select: vi.fn().mockReturnValue({
            $$render: () => '<select class="mock-select"></select>'
        }),
        SelectContent: vi.fn().mockReturnValue({
            $$render: () => '<div class="mock-select-content"></div>'
        }),
        SelectItem: vi.fn().mockReturnValue({
            $$render: () => '<div class="mock-select-item"></div>'
        }),
        SelectTrigger: vi.fn().mockReturnValue({
            $$render: () => '<div class="mock-select-trigger"></div>'
        }),
        SelectValue: vi.fn().mockReturnValue({
            $$render: () => '<div class="mock-select-value"></div>'
        })
    }
})

// Mock svelte-french-toast
vi.mock('svelte-french-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}))
