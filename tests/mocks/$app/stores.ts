import { vi } from 'vitest';

export const page = {
  subscribe: vi.fn((fn: (value: any) => void) => {
    fn({ data: { user: { role: 'staff' } } });
    return { unsubscribe: vi.fn() };
  })
};
