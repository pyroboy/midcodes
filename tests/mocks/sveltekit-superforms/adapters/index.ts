import { vi } from 'vitest';

export const zodClient = vi.fn(() => ({
  validate: vi.fn(() => ({
    data: {},
    errors: null
  }))
}));
