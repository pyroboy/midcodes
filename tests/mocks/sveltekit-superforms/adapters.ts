import { vi } from 'vitest';

export const zodClient = vi.fn((schema) => ({
  schema,
  validate: vi.fn(),
  transform: vi.fn()
}));
