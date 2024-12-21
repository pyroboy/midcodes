import { vi } from 'vitest';

export const superForm = vi.fn(() => ({
  form: {
    subscribe: vi.fn((callback) => {
      callback({
        id: undefined,
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
    })
  },
  errors: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  constraints: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  message: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  enhance: vi.fn(),
  delayed: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  timeout: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  submitting: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  tainted: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  formId: 'test-form',
  allErrors: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
  },
  reset: vi.fn(),
  validate: vi.fn(),
  capture: vi.fn(),
  restore: vi.fn(),
  clear: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  setMessage: vi.fn(),
  clearMessage: vi.fn(),
  setTouched: vi.fn(),
  setUntouched: vi.fn(),
  setCustomValidity: vi.fn(),
  clearCustomValidity: vi.fn(),
  setCustomError: vi.fn(),
  clearCustomError: vi.fn(),
  setCustomMessage: vi.fn(),
  clearCustomMessage: vi.fn(),
  setCustomTouched: vi.fn(),
  clearCustomTouched: vi.fn(),
  setCustomUntouched: vi.fn(),
  clearCustomUntouched: vi.fn()
}));
