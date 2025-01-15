import { vi } from 'vitest';
import { createMockComponent } from './utils';

// App mocks
export const appStoresMock = {
  page: {
    subscribe: (fn: (value: any) => void) => {
      fn({ data: { user: { role: 'staff' } } });
      return { unsubscribe: vi.fn() };
    }
  }
};

export const appFormsMock = {
  enhance: vi.fn()
};

export const roleChecksMock = {
  checkAccess: vi.fn(() => true)
};

// UI Component mocks
export const buttonMock = {
  default: vi.fn((props) => ({
    $$: {
      fragment: {
        c: vi.fn(),
        m: (target: any, anchor: any) => {
          const button = document.createElement('button');
          button.textContent = props.$$slots.default?.[0]?.text || '';
          target.insertBefore(button, anchor);
        },
        d: vi.fn()
      },
      ctx: []
    },
    $set: vi.fn(),
    $destroy: vi.fn()
  }))
};

export const cardMock = {
  Root: vi.fn(() => createMockComponent()),
  Header: vi.fn(() => createMockComponent()),
  Title: vi.fn(() => createMockComponent()),
  Content: vi.fn(() => createMockComponent())
};

export const badgeMock = {
  Badge: vi.fn(() => createMockComponent())
};

export const inputMock = {
  default: vi.fn(() => createMockComponent())
};

export const labelMock = {
  default: vi.fn(() => createMockComponent())
};

export const selectMock = {
  Root: vi.fn(() => createMockComponent()),
  Trigger: vi.fn(() => createMockComponent()),
  Value: vi.fn(() => createMockComponent()),
  Content: vi.fn(() => createMockComponent()),
  Item: vi.fn(() => createMockComponent())
};

export const rental_unitFormMock = {
  default: vi.fn(() => createMockComponent())
};

// Superforms mock
export const superformsClientMock = {
  superForm: () => ({
    form: {
      subscribe: (fn: (value: any) => void) => {
        fn({
          name: '',
          number: 0,
          type: 'SINGLE',
          property_id: 0,
          floor_id: 0,
          rental_unit_status: 'VACANT',
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
  })
};
