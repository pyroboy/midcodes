import { vi } from 'vitest';

export function createMockComponent() {
  return {
    $$: {
      fragment: { c: vi.fn(), m: vi.fn(), d: vi.fn() },
      ctx: [],
      callbacks: {},
      on_mount: [],
      before_update: [],
      after_update: [],
      on_destroy: []
    },
    $set: vi.fn(),
    $on: vi.fn(),
    $destroy: vi.fn()
  };
}
