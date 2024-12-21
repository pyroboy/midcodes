import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { readable } from 'svelte/store';

// Mock SvelteKit modules
vi.mock('$app/stores', () => ({
    page: readable({
        data: {
            user: { role: 'staff' }
        }
    }),
    navigating: readable(null),
    updated: readable(false)
}));

vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
    invalidate: vi.fn(),
    invalidateAll: vi.fn()
}));

vi.mock('$app/forms', () => ({
    enhance: vi.fn()
}));

// Mock environment variables
vi.mock('$env/dynamic/private', () => ({
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
}));

// Mock custom components
vi.mock('$lib/components/RoomForm.svelte', () => ({
    default: vi.fn()
}));

// Mock utilities
vi.mock('$lib/utils/roleChecks', () => ({
    checkAccess: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock custom event handling
class CustomEvent<T = any> extends Event {
    detail: T;
    constructor(type: string, options?: CustomEventInit<T>) {
        super(type, options);
        this.detail = options?.detail as T;
    }
}

global.CustomEvent = CustomEvent as any;

// Mock event listener
Element.prototype.addEventListener = function(
    event: string, 
    handler: (event: Event) => void
): void {
    const listeners = (this as any)._listeners || ((this as any)._listeners = {});
    const handlersForEvent = listeners[event] || (listeners[event] = []);
    handlersForEvent.push(handler);
};

// Mock event dispatch
Element.prototype.dispatchEvent = function(event: Event): boolean {
    const listeners = (this as any)._listeners;
    if (!listeners || !listeners[event.type]) return true;
    
    listeners[event.type].forEach((handler: (event: Event) => void) => handler(event));
    return !event.defaultPrevented;
};
