import { vi } from 'vitest';

export const superForm = () => ({
  form: {
    subscribe: (fn: (value: any) => void) => {
      fn({
        name: '',
        number: 0,
        type: 'SINGLE',
        property_id: 0,
        floor_id: 0,
        room_status: 'VACANT',
        capacity: 1,
        base_rate: 0,
        amenities: []
      });
      return { unsubscribe: vi.fn() };
    },
    set: vi.fn()
  },
  errors: {
    subscribe: (fn: (value: Record<string, string>) => void) => {
      fn({});
      return { unsubscribe: vi.fn() };
    }
  },
  enhance: vi.fn(),
  submitting: {
    subscribe: (fn: (value: boolean) => void) => {
      fn(false);
      return { unsubscribe: vi.fn() };
    }
  }
});
