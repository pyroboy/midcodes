import { vi, expect } from 'vitest';
import { screen } from '@testing-library/svelte';

// Define types for better type safety
export interface MockCard {
  idcard_id: string;
  template_name: string | null;
  fields: Record<string, { value: any; side: 'front' | 'back' }> | null;
  front_image: string | null;
  back_image: string | null;
}

export interface MockProps {
  card: MockCard;
  isSelected: boolean;
  onToggleSelect: ReturnType<typeof vi.fn>;
  onDownload: ReturnType<typeof vi.fn>;
  onDelete: ReturnType<typeof vi.fn>;
  onOpenPreview: ReturnType<typeof vi.fn>;
  downloading: boolean;
  deleting: boolean;
  width?: number;
}

/**
 * Create a mock card with default values and overrides
 */
export const createMockCard = (overrides: Partial<MockCard> = {}): MockCard => ({
  idcard_id: 'test-card-123',
  template_name: 'Test Template',
  fields: {
    'Name': { value: 'Test User', side: 'front' as const },
    'Employee ID': { value: 'EMP001', side: 'front' as const },
    'Department': { value: 'Testing', side: 'back' as const }
  },
  front_image: 'test/front.png',
  back_image: 'test/back.png',
  ...overrides
});

/**
 * Create mock props for component testing
 */
export const createMockProps = (
  cardOverrides: Partial<MockCard> | null | undefined = {}, 
  propOverrides: Partial<Omit<MockProps, 'card'>> = {}
): MockProps => {
  // Handle null/undefined card overrides
  const card = cardOverrides ? createMockCard(cardOverrides) : createMockCard();
  
  return {
    card,
    isSelected: false,
    onToggleSelect: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
    onOpenPreview: vi.fn(),
    downloading: false,
    deleting: false,
    ...propOverrides
  };
};

/**
 * Create a mock card with image data
 */
export const createMockCardWithImage = (overrides: Partial<MockCard> = {}): MockCard => ({
  idcard_id: 'card-with-image-123',
  template_name: 'Image Template',
  front_image: 'org-123/template-456/123456_front.png',
  back_image: 'org-123/template-456/123456_back.png',
  fields: {
    'Name': { value: 'Image User', side: 'front' as const },
    'Department': { value: 'Design', side: 'front' as const }
  },
  ...overrides
});

/**
 * Create a mock card without images
 */
export const createMockCardWithoutImage = (overrides: Partial<MockCard> = {}): MockCard => ({
  idcard_id: 'card-no-image-456',
  template_name: 'No Image Template',
  front_image: null,
  back_image: null,
  fields: {
    'Name': { value: 'No Image User', side: 'front' as const },
    'Status': { value: 'Active', side: 'front' as const }
  },
  ...overrides
});

/**
 * Create a mock card with many fields for testing field limits
 */
export const createMockCardWithManyFields = (overrides: Partial<MockCard> = {}): MockCard => ({
  idcard_id: 'card-many-fields-789',
  template_name: 'Many Fields Template',
  fields: {
    'Name': { value: 'Many Fields User', side: 'front' as const },
    'Employee ID': { value: 'EMP001', side: 'front' as const },
    'Department': { value: 'Engineering', side: 'back' as const },
    'Email': { value: 'test@example.com', side: 'back' as const },
    'Phone': { value: '+1234567890', side: 'front' as const },
    'Position': { value: 'Developer', side: 'front' as const },
    'Start Date': { value: '2023-01-01', side: 'back' as const },
    'Manager': { value: 'Jane Smith', side: 'back' as const }
  },
  front_image: 'test/front.png',
  back_image: 'test/back.png',
  ...overrides
});

/**
 * Create a mock card with empty/null values for testing edge cases
 */
export const createMockCardWithEmptyFields = (overrides: Partial<MockCard> = {}): MockCard => ({
  idcard_id: 'card-empty-fields-000',
  template_name: 'Empty Fields Template',
  fields: {
    'Name': { value: null, side: 'front' as const },
    'Empty Field': { value: '', side: 'front' as const },
    'Undefined Field': { value: undefined, side: 'back' as const },
    'Zero Field': { value: 0, side: 'front' as const },
    'False Field': { value: false, side: 'back' as const }
  },
  front_image: null,
  back_image: null,
  ...overrides
});

/**
 * Create a mock card with long text values for testing overflow
 */
export const createMockCardWithLongText = (overrides: Partial<MockCard> = {}): MockCard => ({
  idcard_id: 'card-long-text-999',
  template_name: 'Very Long Template Name That Should Test Text Overflow Behavior',
  fields: {
    'Name': { value: 'Very Long Name That Should Test Text Wrapping And Overflow Behavior In The Component', side: 'front' as const },
    'Department': { value: 'Department With Very Long Name For Testing Text Handling', side: 'front' as const },
    'Email': { value: 'very.long.email.address@very.long.domain.name.company.com', side: 'back' as const }
  },
  front_image: 'test/very-long-path/to/image/that-should-be-handled-properly.png',
  back_image: 'test/another-very-long-path/to/back-image.png',
  ...overrides
});

/**
 * Assert that a button is disabled with specific text
 */
export const expectButtonToBeDisabled = (buttonText: string) => {
  const button = screen.getByText(buttonText);
  expect(button).toBeDisabled();
};

/**
 * Assert that a button is enabled with specific text
 */
export const expectButtonToBeEnabled = (buttonText: string) => {
  const button = screen.getByText(buttonText);
  expect(button).toBeEnabled();
};

/**
 * Assert that an event handler was called with expected arguments
 */
export const expectEventToHaveBeenCalledWith = (mockFn: any, expectedArgs: any) => {
  expect(mockFn).toHaveBeenCalledWith(expectedArgs);
  expect(mockFn).toHaveBeenCalledTimes(1);
};

/**
 * Assert that an event handler was called exactly once
 */
export const expectEventToHaveBeenCalledOnce = (mockFn: any) => {
  expect(mockFn).toHaveBeenCalledTimes(1);
};

/**
 * Assert that an event handler was not called
 */
export const expectEventNotToHaveBeenCalled = (mockFn: any) => {
  expect(mockFn).not.toHaveBeenCalled();
};

/**
 * Get all field elements from the DOM
 */
export const getFieldElements = () => {
  return screen.getAllByText(/.*:/, { selector: 'strong' });
};

/**
 * Check if an element exists in the DOM
 */
export const elementExists = (text: string) => {
  return screen.queryByText(text) !== null;
};

/**
 * Check if an element does not exist in the DOM
 */
export const elementDoesNotExist = (text: string) => {
  return screen.queryByText(text) === null;
};

/**
 * Get checkbox element by aria-label
 */
export const getCheckbox = (label = 'Select card') => {
  return screen.getByRole('checkbox', { name: label });
};

/**
 * Get button element by text
 */
export const getButton = (text: string) => {
  return screen.getByText(text);
};

/**
 * Get image element by alt text
 */
export const getImage = (altText: string) => {
  return screen.getByRole('img', { name: altText });
};

/**
 * Wait for an element to appear
 */
export const waitForElement = async (text: string) => {
  return await screen.findByText(text);
};

/**
 * Create mock event handlers with default implementations
 */
export const createMockEventHandlers = () => ({
  onToggleSelect: vi.fn(),
  onDownload: vi.fn(),
  onDelete: vi.fn(),
  onOpenPreview: vi.fn()
});

/**
 * Reset all mock functions
 */
export const resetMockFunctions = (handlers: ReturnType<typeof createMockEventHandlers>) => {
  Object.values(handlers).forEach(fn => fn.mockReset());
};

/**
 * Create mock props with loading states
 */
export const createMockPropsWithLoading = (loadingStates = {}) => {
  const baseProps = createMockProps();
  return {
    ...baseProps,
    downloading: false,
    deleting: false,
    ...loadingStates
  };
};

/**
 * Create mock props with selected state
 */
export const createMockPropsSelected = (isSelected = true) => {
  return createMockProps({}, { isSelected });
};

/**
 * Utility to test keyboard interactions
 */
export const keyboardInteractionTest = {
  enter: { key: 'Enter' },
  space: { key: ' ' },
  escape: { key: 'Escape' },
  tab: { key: 'Tab' },
  arrowDown: { key: 'ArrowDown' },
  arrowUp: { key: 'ArrowUp' }
};

/**
 * Create test data for accessibility testing
 */
export const createA11yTestCard = () => ({
  idcard_id: 'a11y-test-card',
  template_name: 'Accessibility Test Template',
  fields: {
    'Name': { value: 'Accessibility Test User', side: 'front' as const },
    'Role': { value: 'Tester', side: 'front' as const }
  },
  front_image: 'a11y/front.png',
  back_image: 'a11y/back.png'
});

/**
 * Validate ARIA attributes on elements
 */
export const validateAriaAttributes = (element: Element, expectedAttributes: Record<string, string>) => {
  Object.entries(expectedAttributes).forEach(([attribute, value]) => {
    expect(element).toHaveAttribute(attribute, value);
  });
};

/**
 * Test performance helper - measure render time
 * Can be used with either callback pattern or async callback pattern
 */
export const measureRenderTime = <T = any>(callback: (() => T) | (() => Promise<T>)): T extends Promise<any> ? Promise<{ result: Awaited<T>, duration: number }> : { result: T, duration: number } => {
  const startTime = performance.now();
  
  const result = callback();
  
  // Handle async operations
  if (result instanceof Promise) {
    return result.then((resolvedResult) => {
      const endTime = performance.now();
      return {
        result: resolvedResult,
        duration: endTime - startTime
      };
    }) as any;
  }
  
  // Handle synchronous operations
  const endTime = performance.now();
  return {
    result,
    duration: endTime - startTime
  } as any;
};

/**
 * Create props for performance testing
 */
export const createPerformanceTestProps = (count = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    card: createMockCard({
      idcard_id: `perf-card-${i}`,
      fields: {
        'Name': { value: `Performance User ${i}`, side: 'front' as const },
        'ID': { value: `PERF${i.toString().padStart(3, '0')}`, side: 'front' as const }
      }
    }),
    isSelected: i % 3 === 0, // Select every third card
    onToggleSelect: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
    onOpenPreview: vi.fn(),
    downloading: i % 7 === 0, // Loading state for every seventh card
    deleting: i % 11 === 0 // Deleting state for every eleventh card
  }));
};

/**
 * Snapshot testing utilities
 */
export const snapshotTestCards = {
  default: createMockCard(),
  withImage: createMockCardWithImage(),
  withoutImage: createMockCardWithoutImage(),
  selected: createMockCard(),
  loading: createMockCard(),
  longText: createMockCardWithLongText(),
  emptyFields: createMockCardWithEmptyFields(),
  manyFields: createMockCardWithManyFields()
};

/**
 * Visual regression test variants
 */
export const visualTestVariants = {
  default: { isSelected: false, downloading: false, deleting: false },
  selected: { isSelected: true, downloading: false, deleting: false },
  downloading: { isSelected: false, downloading: true, deleting: false },
  deleting: { isSelected: false, downloading: false, deleting: true },
  downloadingSelected: { isSelected: true, downloading: true, deleting: false },
  allStates: { isSelected: true, downloading: true, deleting: true }
};

/**
 * Mock Supabase storage URL utility
 */
export const createMockSupabaseUtils = () => ({
  getSupabaseStorageUrl: vi.fn((path: string, bucket: string) => 
    `https://supabase.example.com/storage/v1/object/public/${bucket}/${path}`
  )
});

/**
 * Error boundary testing utilities
 */
export const createErrorTestScenarios = () => ({
  undefinedCard: undefined,
  nullCard: null,
  cardWithMissingFields: { idcard_id: 'missing-fields' },
  cardWithInvalidFields: {
    idcard_id: 'invalid-fields',
    fields: 'not-an-object'
  },
  cardWithCircularReference: (() => {
    const card: any = { idcard_id: 'circular' };
    card.self = card;
    return card;
  })()
});

/**
 * Integration test helpers
 */
export const integrationTestHelpers = {
  waitForAsyncOperation: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  simulateNetworkDelay: async (operation: () => Promise<any>, delay = 500) => {
    const [result] = await Promise.all([
      operation(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]);
    return result;
  },
  
  createBulkCards: (count: number) => {
    return Array.from({ length: count }, (_, i) => 
      createMockCard({
        idcard_id: `bulk-card-${i}`,
        fields: {
          'Name': { value: `Bulk User ${i}`, side: 'front' as const },
          'ID': { value: `BULK${i.toString().padStart(4, '0')}`, side: 'front' as const }
        }
      })
    );
  }
};
