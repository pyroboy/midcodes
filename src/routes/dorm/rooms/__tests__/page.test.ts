import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from '../+page.svelte';
import type { PageData } from '../$types';
import { checkAccess } from '$lib/utils/roleChecks';

// 1. Mock essential functionality first
vi.mock('$app/stores', () => ({
  page: {
    subscribe: (fn: (value: any) => void) => {
      fn({ data: { user: { role: 'staff' } } });
      return { unsubscribe: vi.fn() };
    }
  }
}));

vi.mock('sveltekit-superforms/client', () => ({
  superForm: () => ({
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
  })
}));

vi.mock('$app/forms', () => ({
  enhance: vi.fn()
}));

vi.mock('$lib/utils/roleChecks', () => ({
  checkAccess: vi.fn(() => true)
}));

// 2. Mock UI components
vi.mock('$lib/components/ui/button/button.svelte', () => ({
  default: vi.fn(() => ({
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
  }))
}));

vi.mock('$lib/components/ui/card', () => ({
  Root: vi.fn(() => ({
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
  })),
  Header: vi.fn(() => ({
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
  })),
  Title: vi.fn(() => ({
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
  })),
  Content: vi.fn(() => ({
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
  }))
}));

vi.mock('$lib/components/ui/badge', () => ({
  Badge: vi.fn(() => ({
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
  }))
}));

vi.mock('$lib/components/ui/input/input.svelte', () => ({
  default: vi.fn(() => ({
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
  }))
}));

vi.mock('$lib/components/ui/label/label.svelte', () => ({
  default: vi.fn(() => ({
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
  }))
}));

vi.mock('$lib/components/ui/select', () => ({
  Root: vi.fn(() => ({
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
  })),
  Trigger: vi.fn(() => ({
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
  })),
  Value: vi.fn(() => ({
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
  })),
  Content: vi.fn(() => ({
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
  })),
  Item: vi.fn(() => ({
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
  }))
}));

// 3. Mock form schema
vi.mock('./formSchema', () => ({
  roomSchema: {
    parse: vi.fn(),
    safeParse: vi.fn()
  },
  locationStatusEnum: {
    options: ['VACANT', 'OCCUPIED', 'RESERVED']
  }
}));

// 4. Mock RoomForm component last since it depends on other mocks
vi.mock('../RoomForm.svelte', () => ({
  default: vi.fn(() => ({
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
  }))
}));

describe('+page.svelte', () => {
  const mockData: PageData = {
    rooms: [
      {
        id: 1,
        number: 101,
        property_id: 1,
        floor_id: 1,
        name: 'Room 101',
        type: 'SINGLE',
        room_status: 'VACANT' as const,
        capacity: 1,
        base_rate: 5000,
        amenities: ['WiFi', 'AC'],
        property: {
          name: 'Test Property'
        },
        floor: {
          floor_number: 1,
          wing: 'A'
        }
      }
    ],
    properties: [
      { id: 1, name: 'Test Property' }
    ],
    floors: [
      { id: 1, property_id: 1, floor_number: 1, wing: 'A' }
    ],
    form: {},
    user: { role: 'staff' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should render without crashing', () => {
    const { container } = render(Page, { props: { data: mockData } });
    expect(container).toBeTruthy();
  });

  // New test scenario
  it('should show/hide add room button based on user role', () => {
    // First test with staff role
    const { container: staffContainer } = render(Page, { props: { data: mockData } });
    expect(staffContainer.textContent).toContain('Add Room');

    // Then test with non-staff role
    const nonStaffData = {
      ...mockData,
      user: { role: 'guest' }
    };
    vi.mocked(checkAccess).mockImplementation(() => false);
    
    const { container: nonStaffContainer } = render(Page, { props: { data: nonStaffData } });
    expect(nonStaffContainer.textContent).not.toContain('Add Room');
  });
});