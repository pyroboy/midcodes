import { vi } from 'vitest';

export default vi.fn().mockImplementation(() => ({
    $$: {
        fragment: {
            c: vi.fn(),
            m: vi.fn(),
            p: vi.fn(),
            d: vi.fn()
        },
        ctx: []
    },
    $set: vi.fn(),
    $on: vi.fn(),
    $destroy: vi.fn()
}));
