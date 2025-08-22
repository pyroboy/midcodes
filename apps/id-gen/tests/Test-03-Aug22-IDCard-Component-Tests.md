# Test-03-Aug22-IDCard-Component-Tests

## Component Tests for ID Card UI Components

### Overview
Comprehensive component tests for Svelte ID card components using Testing Library and Vitest, focusing on user interactions, prop handling, event dispatching, and accessibility.

### Components Under Test

#### 1. IDCard.svelte
- **Purpose**: Detailed card view with field display and action buttons
- **Key Features**: 
  - Checkbox selection
  - Field data display with template name
  - Download/Delete actions
  - Preview click handling
  - Loading states

#### 2. SimpleIDCard.svelte
- **Purpose**: Visual card preview with image display
- **Key Features**:
  - Image rendering from Supabase storage
  - Checkbox selection
  - Responsive width control
  - Fallback placeholder for missing images

### Test Implementation

```typescript
// tests/component/IDCard.component.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import IDCard from '$lib/components/IDCard.svelte';

// Mock data
const mockCard = {
  idcard_id: 'card-123',
  template_name: 'Employee ID Template',
  fields: {
    'Name': { value: 'John Doe', side: 'front' as const },
    'Employee ID': { value: 'EMP001', side: 'front' as const },
    'Department': { value: 'Engineering', side: 'back' as const },
    'Email': { value: 'john.doe@company.com', side: 'back' as const },
    'Phone': { value: '+1234567890', side: 'front' as const }
  }
};

describe('IDCard Component', () => {
  let mockProps: any;

  beforeEach(() => {
    mockProps = {
      card: mockCard,
      isSelected: false,
      onToggleSelect: vi.fn(),
      onDownload: vi.fn(),
      onDelete: vi.fn(),
      onOpenPreview: vi.fn(),
      downloading: false,
      deleting: false
    };
  });

  describe('Rendering', () => {
    it('should render card with correct title', () => {
      render(IDCard, { props: mockProps });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Template: Employee ID Template')).toBeInTheDocument();
    });

    it('should render field data correctly', () => {
      render(IDCard, { props: mockProps });
      
      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Employee ID:')).toBeInTheDocument();
      expect(screen.getByText('EMP001')).toBeInTheDocument();
    });

    it('should limit field display to 4 items', () => {
      render(IDCard, { props: mockProps });
      
      // Should only show first 4 fields
      const fieldElements = screen.getAllByText(/.*:/, { selector: 'strong' });
      expect(fieldElements).toHaveLength(4);
    });

    it('should show untitled for cards without name field', () => {
      const cardWithoutName = {
        ...mockCard,
        fields: {
          'Employee ID': { value: 'EMP001', side: 'front' as const }
        }
      };

      render(IDCard, { props: { ...mockProps, card: cardWithoutName } });
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });

    it('should handle empty field values gracefully', () => {
      const cardWithEmptyFields = {
        ...mockCard,
        fields: {
          'Name': { value: null, side: 'front' as const },
          'Empty Field': { value: '', side: 'front' as const }
        }
      };

      render(IDCard, { props: { ...mockProps, card: cardWithEmptyFields } });
      
      // Should still render the field labels
      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Empty Field:')).toBeInTheDocument();
    });
  });

  describe('Selection Functionality', () => {
    it('should render checkbox with correct initial state', () => {
      render(IDCard, { props: mockProps });
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select card' });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render checked checkbox when selected', () => {
      render(IDCard, { props: { ...mockProps, isSelected: true } });
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select card' });
      expect(checkbox).toBeChecked();
    });

    it('should call onToggleSelect when checkbox is clicked', async () => {
      render(IDCard, { props: mockProps });
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select card' });
      await fireEvent.click(checkbox);
      
      expect(mockProps.onToggleSelect).toHaveBeenCalledWith(mockCard);
      expect(mockProps.onToggleSelect).toHaveBeenCalledTimes(1);
    });

    it('should prevent checkbox click from propagating to card click', async () => {
      render(IDCard, { props: mockProps });
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select card' });
      await fireEvent.click(checkbox);
      
      // onOpenPreview should not be called when checkbox is clicked
      expect(mockProps.onOpenPreview).not.toHaveBeenCalled();
      expect(mockProps.onToggleSelect).toHaveBeenCalled();
    });
  });

  describe('Action Buttons', () => {
    it('should render download and delete buttons', () => {
      render(IDCard, { props: mockProps });
      
      expect(screen.getByText('Download')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onDownload when download button is clicked', async () => {
      render(IDCard, { props: mockProps });
      
      const downloadBtn = screen.getByText('Download');
      await fireEvent.click(downloadBtn);
      
      expect(mockProps.onDownload).toHaveBeenCalledWith(mockCard);
      expect(mockProps.onDownload).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when delete button is clicked', async () => {
      render(IDCard, { props: mockProps });
      
      const deleteBtn = screen.getByText('Delete');
      await fireEvent.click(deleteBtn);
      
      expect(mockProps.onDelete).toHaveBeenCalledWith(mockCard);
      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    });

    it('should prevent button clicks from propagating to card click', async () => {
      render(IDCard, { props: mockProps });
      
      const downloadBtn = screen.getByText('Download');
      const deleteBtn = screen.getByText('Delete');
      
      await fireEvent.click(downloadBtn);
      await fireEvent.click(deleteBtn);
      
      // onOpenPreview should not be called when buttons are clicked
      expect(mockProps.onOpenPreview).not.toHaveBeenCalled();
    });

    it('should show loading state for download', () => {
      render(IDCard, { props: { ...mockProps, downloading: true } });
      
      const downloadBtn = screen.getByText('Downloading...');
      expect(downloadBtn).toBeDisabled();
    });

    it('should show loading state for delete', () => {
      render(IDCard, { props: { ...mockProps, deleting: true } });
      
      const deleteBtn = screen.getByText('Deleting...');
      expect(deleteBtn).toBeDisabled();
    });
  });

  describe('Preview Functionality', () => {
    it('should call onOpenPreview when card is clicked', async () => {
      render(IDCard, { props: mockProps });
      
      const cardElement = screen.getByRole('button');
      await fireEvent.click(cardElement);
      
      expect(mockProps.onOpenPreview).toHaveBeenCalledWith(
        expect.any(MouseEvent),
        mockCard
      );
    });

    it('should handle keyboard activation (Enter key)', async () => {
      render(IDCard, { props: mockProps });
      
      const cardElement = screen.getByRole('button');
      await fireEvent.keyDown(cardElement, { key: 'Enter' });
      
      expect(mockProps.onOpenPreview).toHaveBeenCalled();
    });

    it('should handle keyboard activation (Space key)', async () => {
      render(IDCard, { props: mockProps });
      
      const cardElement = screen.getByRole('button');
      await fireEvent.keyDown(cardElement, { key: ' ' });
      
      expect(mockProps.onOpenPreview).toHaveBeenCalled();
    });

    it('should ignore other keyboard keys', async () => {
      render(IDCard, { props: mockProps });
      
      const cardElement = screen.getByRole('button');
      await fireEvent.keyDown(cardElement, { key: 'Escape' });
      
      expect(mockProps.onOpenPreview).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(IDCard, { props: mockProps });
      
      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('tabindex', '0');
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', 'Select card');
    });

    it('should be keyboard navigable', () => {
      render(IDCard, { props: mockProps });
      
      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('tabindex', '0');
    });
  });
});
```

```typescript
// tests/component/SimpleIDCard.component.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import SimpleIDCard from '$lib/components/SimpleIDCard.svelte';

// Mock the Supabase utility
vi.mock('$lib/utils/supabase', () => ({
  getSupabaseStorageUrl: vi.fn((path: string, bucket: string) => 
    `https://supabase.example.com/storage/v1/object/public/${bucket}/${path}`
  )
}));

const mockCardWithImage = {
  idcard_id: 'card-123',
  template_name: 'Employee ID Template',
  front_image: 'org-123/template-456/123456_front.png',
  back_image: 'org-123/template-456/123456_back.png',
  fields: {
    'Name': { value: 'John Doe', side: 'front' as const }
  }
};

const mockCardWithoutImage = {
  idcard_id: 'card-456',
  template_name: 'Student ID Template',
  front_image: null,
  back_image: null,
  fields: {
    'Name': { value: 'Jane Smith', side: 'front' as const }
  }
};

describe('SimpleIDCard Component', () => {
  let mockProps: any;

  beforeEach(() => {
    mockProps = {
      card: mockCardWithImage,
      isSelected: false,
      onToggleSelect: vi.fn(),
      onDownload: vi.fn(),
      onDelete: vi.fn(),
      onOpenPreview: vi.fn(),
      downloading: false,
      deleting: false,
      width: 300
    };
  });

  describe('Image Rendering', () => {
    it('should render image when front_image is available', () => {
      render(SimpleIDCard, { props: mockProps });
      
      const image = screen.getByRole('img', { name: 'Card preview' });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 
        'https://supabase.example.com/storage/v1/object/public/rendered-id-cards/org-123/template-456/123456_front.png'
      );
    });

    it('should render placeholder when no front_image', () => {
      render(SimpleIDCard, { 
        props: { ...mockProps, card: mockCardWithoutImage } 
      });
      
      const placeholder = screen.getByRole('img', { hidden: true }); // SVG has implicit img role
      expect(placeholder).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'Card preview' })).not.toBeInTheDocument();
    });

    it('should maintain aspect ratio', () => {
      render(SimpleIDCard, { props: mockProps });
      
      const imageContainer = screen.getByRole('img', { name: 'Card preview' }).parentElement;
      expect(imageContainer).toHaveStyle('aspect-ratio: 1013/638');
    });
  });

  describe('Width Control', () => {
    it('should apply custom width', () => {
      render(SimpleIDCard, { props: { ...mockProps, width: 400 } });
      
      const container = screen.getByRole('button');
      expect(container).toHaveStyle('width: 400px');
    });

    it('should use default width when not specified', () => {
      const { width, ...propsWithoutWidth } = mockProps;
      render(SimpleIDCard, { props: propsWithoutWidth });
      
      const container = screen.getByRole('button');
      expect(container).toHaveStyle('width: 300px');
    });
  });

  describe('Selection Functionality', () => {
    it('should handle selection toggle', async () => {
      render(SimpleIDCard, { props: mockProps });
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select card' });
      await fireEvent.click(checkbox);
      
      expect(mockProps.onToggleSelect).toHaveBeenCalledWith(mockCardWithImage);
    });

    it('should show selected state', () => {
      render(SimpleIDCard, { props: { ...mockProps, isSelected: true } });
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select card' });
      expect(checkbox).toBeChecked();
    });
  });

  describe('Action Buttons', () => {
    it('should render download and delete buttons', () => {
      render(SimpleIDCard, { props: mockProps });
      
      expect(screen.getByText('Download')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should handle button actions', async () => {
      render(SimpleIDCard, { props: mockProps });
      
      await fireEvent.click(screen.getByText('Download'));
      expect(mockProps.onDownload).toHaveBeenCalledWith(mockCardWithImage);
      
      await fireEvent.click(screen.getByText('Delete'));
      expect(mockProps.onDelete).toHaveBeenCalledWith(mockCardWithImage);
    });

    it('should show loading states', () => {
      render(SimpleIDCard, { 
        props: { ...mockProps, downloading: true, deleting: true } 
      });
      
      expect(screen.getByText('Downloading...')).toBeDisabled();
      expect(screen.getByText('Deleting...')).toBeDisabled();
    });
  });

  describe('Preview Functionality', () => {
    it('should handle click to preview', async () => {
      render(SimpleIDCard, { props: mockProps });
      
      const card = screen.getByRole('button');
      await fireEvent.click(card);
      
      expect(mockProps.onOpenPreview).toHaveBeenCalledWith(
        expect.any(MouseEvent),
        mockCardWithImage
      );
    });

    it('should handle keyboard navigation', async () => {
      render(SimpleIDCard, { props: mockProps });
      
      const card = screen.getByRole('button');
      await fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockProps.onOpenPreview).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing image gracefully', () => {
      const cardWithUndefinedImage = {
        ...mockCardWithImage,
        front_image: undefined
      };

      render(SimpleIDCard, { 
        props: { ...mockProps, card: cardWithUndefinedImage } 
      });
      
      // Should render placeholder, not crash
      expect(screen.queryByRole('img', { name: 'Card preview' })).not.toBeInTheDocument();
    });

    it('should handle missing fields gracefully', () => {
      const cardWithoutFields = {
        ...mockCardWithImage,
        fields: undefined
      };

      expect(() => {
        render(SimpleIDCard, { 
          props: { ...mockProps, card: cardWithoutFields } 
        });
      }).not.toThrow();
    });
  });
});
```

### Visual Regression Tests

```typescript
// tests/component/IDCard.visual.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import IDCard from '$lib/components/IDCard.svelte';
import SimpleIDCard from '$lib/components/SimpleIDCard.svelte';

expect.extend({ toMatchImageSnapshot });

describe('ID Card Visual Tests', () => {
  const mockCard = {
    idcard_id: 'test-card',
    template_name: 'Test Template',
    fields: {
      'Name': { value: 'Test User', side: 'front' as const },
      'ID': { value: '12345', side: 'front' as const }
    }
  };

  const mockProps = {
    card: mockCard,
    isSelected: false,
    onToggleSelect: () => {},
    onDownload: () => {},
    onDelete: () => {},
    onOpenPreview: () => {},
    downloading: false,
    deleting: false
  };

  it('should match IDCard snapshot', () => {
    const { container } = render(IDCard, { props: mockProps });
    expect(container.firstChild).toMatchImageSnapshot();
  });

  it('should match IDCard selected state snapshot', () => {
    const { container } = render(IDCard, { 
      props: { ...mockProps, isSelected: true } 
    });
    expect(container.firstChild).toMatchImageSnapshot();
  });

  it('should match IDCard loading state snapshot', () => {
    const { container } = render(IDCard, { 
      props: { ...mockProps, downloading: true, deleting: true } 
    });
    expect(container.firstChild).toMatchImageSnapshot();
  });

  it('should match SimpleIDCard snapshot', () => {
    const simpleProps = {
      ...mockProps,
      card: {
        ...mockCard,
        front_image: 'test/image.png'
      }
    };
    
    const { container } = render(SimpleIDCard, { props: simpleProps });
    expect(container.firstChild).toMatchImageSnapshot();
  });

  it('should match SimpleIDCard without image snapshot', () => {
    const simpleProps = {
      ...mockProps,
      card: {
        ...mockCard,
        front_image: null
      }
    };
    
    const { container } = render(SimpleIDCard, { props: simpleProps });
    expect(container.firstChild).toMatchImageSnapshot();
  });
});
```

### Performance Tests

```typescript
// tests/component/IDCard.performance.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import IDCard from '$lib/components/IDCard.svelte';

describe('ID Card Performance Tests', () => {
  it('should render large number of cards efficiently', () => {
    const cards = Array.from({ length: 100 }, (_, i) => ({
      idcard_id: `card-${i}`,
      template_name: `Template ${i}`,
      fields: {
        'Name': { value: `User ${i}`, side: 'front' as const },
        'ID': { value: `ID${i}`, side: 'front' as const }
      }
    }));

    const startTime = performance.now();

    cards.forEach(card => {
      render(IDCard, {
        props: {
          card,
          isSelected: false,
          onToggleSelect: () => {},
          onDownload: () => {},
          onDelete: () => {},
          onOpenPreview: () => {},
          downloading: false,
          deleting: false
        }
      });
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render 100 cards in under 1 second
    expect(renderTime).toBeLessThan(1000);
  });

  it('should handle frequent prop updates efficiently', async () => {
    const mockCard = {
      idcard_id: 'perf-test',
      template_name: 'Performance Test',
      fields: {
        'Name': { value: 'Test User', side: 'front' as const }
      }
    };

    const { component } = render(IDCard, {
      props: {
        card: mockCard,
        isSelected: false,
        onToggleSelect: () => {},
        onDownload: () => {},
        onDelete: () => {},
        onOpenPreview: () => {},
        downloading: false,
        deleting: false
      }
    });

    const startTime = performance.now();

    // Simulate rapid state changes
    for (let i = 0; i < 1000; i++) {
      component.$set({
        isSelected: i % 2 === 0,
        downloading: i % 3 === 0,
        deleting: i % 5 === 0
      });
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Should handle 1000 updates in under 500ms
    expect(updateTime).toBeLessThan(500);
  });
});
```

### Test Utilities

```typescript
// tests/utils/cardTestUtils.ts
export const createMockCard = (overrides = {}) => ({
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

export const createMockProps = (cardOverrides = {}, propOverrides = {}) => ({
  card: createMockCard(cardOverrides),
  isSelected: false,
  onToggleSelect: vi.fn(),
  onDownload: vi.fn(),
  onDelete: vi.fn(),
  onOpenPreview: vi.fn(),
  downloading: false,
  deleting: false,
  ...propOverrides
});

export const expectButtonToBeDisabled = (buttonText: string) => {
  const button = screen.getByText(buttonText);
  expect(button).toBeDisabled();
};

export const expectEventToHaveBeenCalledWith = (mockFn: any, expectedArgs: any) => {
  expect(mockFn).toHaveBeenCalledWith(expectedArgs);
  expect(mockFn).toHaveBeenCalledTimes(1);
};
```

### Test Execution Commands

```bash
# Run all component tests
npm run test:component

# Run specific component tests
npm run test:component IDCard
npm run test:component SimpleIDCard

# Run with coverage
npm run test:component:coverage

# Run visual regression tests
npm run test:component:visual

# Run performance tests
npm run test:component:performance

# Run in watch mode
npm run test:component:watch
```

### Component Test Quality Metrics

- **Coverage Target**: 95%+ line and branch coverage
- **Performance**: Component rendering under 100ms per component
- **Accessibility**: All WCAG AA requirements met
- **Visual Consistency**: No unexpected visual regressions
- **Event Handling**: All user interactions properly tested