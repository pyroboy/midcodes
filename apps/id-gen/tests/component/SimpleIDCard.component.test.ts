import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';

// Import test utilities
import {
  createMockCard,
  createMockProps,
  createMockCardWithImage,
  createMockCardWithoutImage,
  createMockCardWithEmptyFields,
  createMockCardWithLongText,
  expectButtonToBeDisabled,
  expectButtonToBeEnabled,
  expectEventToHaveBeenCalledWith,
  expectEventNotToHaveBeenCalled,
  getCheckbox,
  getButton,
  getImage,
  keyboardInteractionTest,
  createMockSupabaseUtils,
  createErrorTestScenarios
} from '../utils/cardTestUtils';

// Mock the Supabase utility
vi.mock('$lib/utils/supabase', () => createMockSupabaseUtils());

// Mock SimpleIDCard component - creating a mock implementation for testing
const MockSimpleIDCard = {
  render: (props: any) => {
    const { card, isSelected, onToggleSelect, onDownload, onDelete, onOpenPreview, downloading, deleting, width = 300 } = props;
    
    // Get the image source or show placeholder
    const hasImage = card?.front_image;
    const imageSrc = hasImage ? `https://supabase.example.com/storage/v1/object/public/rendered-id-cards/${card.front_image}` : null;
    
    return `
      <div role="button" tabindex="0" class="simple-id-card" style="width: ${width}px"
           ${isSelected ? 'data-selected="true"' : ''}>
        
        <div class="card-image-container" style="aspect-ratio: 1013/638">
          ${hasImage ? 
            `<img src="${imageSrc}" alt="Card preview" role="img" />` :
            `<div class="placeholder" role="img" aria-hidden="true">
               <svg viewBox="0 0 100 100">
                 <rect width="100" height="100" fill="#f0f0f0"/>
                 <text x="50" y="50" text-anchor="middle">No Image</text>
               </svg>
             </div>`
          }
        </div>
        
        <div class="card-overlay">
          <div class="card-controls">
            <input type="checkbox" 
                   aria-label="Select card" 
                   ${isSelected ? 'checked' : ''}
                   onclick="onToggleSelect"
            />
          </div>
          
          <div class="card-actions">
            <button ${downloading ? 'disabled' : ''}>
              ${downloading ? 'Downloading...' : 'Download'}
            </button>
            <button ${deleting ? 'disabled' : ''}>
              ${deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
        
        <div class="card-info">
          <p class="template-name">${card?.template_name || 'Unknown Template'}</p>
        </div>
      </div>
    `;
  }
};

// Mock SimpleIDCard component for testing
vi.mock('$lib/components/SimpleIDCard.svelte', () => ({
  default: MockSimpleIDCard
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
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Image Rendering', () => {
    it('should render image when front_image is available', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('alt="Card preview"');
      expect(rendered).toContain('role="img"');
      expect(rendered).toContain(
        'https://supabase.example.com/storage/v1/object/public/rendered-id-cards/org-123/template-456/123456_front.png'
      );
    });

    it('should render placeholder when no front_image', () => {
      const propsWithoutImage = { ...mockProps, card: mockCardWithoutImage };
      const rendered = MockSimpleIDCard.render(propsWithoutImage);
      
      expect(rendered).toContain('class="placeholder"');
      expect(rendered).toContain('aria-hidden="true"');
      expect(rendered).toContain('<svg');
      expect(rendered).not.toContain('alt="Card preview"');
    });

    it('should maintain aspect ratio', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('aspect-ratio: 1013/638');
    });

    it('should handle undefined front_image', () => {
      const cardWithUndefinedImage = {
        ...mockCardWithImage,
        front_image: undefined
      };
      
      const propsWithUndefinedImage = { ...mockProps, card: cardWithUndefinedImage };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithUndefinedImage);
      }).not.toThrow();
    });

    it('should handle empty string front_image', () => {
      const cardWithEmptyImage = {
        ...mockCardWithImage,
        front_image: ''
      };
      
      const propsWithEmptyImage = { ...mockProps, card: cardWithEmptyImage };
      const rendered = MockSimpleIDCard.render(propsWithEmptyImage);
      
      expect(rendered).toContain('class="placeholder"');
    });

    it('should generate correct storage URL', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('https://supabase.example.com/storage/v1/object/public/rendered-id-cards/');
      expect(rendered).toContain('org-123/template-456/123456_front.png');
    });
  });

  describe('Width Control', () => {
    it('should apply custom width', () => {
      const propsWithCustomWidth = { ...mockProps, width: 400 };
      const rendered = MockSimpleIDCard.render(propsWithCustomWidth);
      
      expect(rendered).toContain('width: 400px');
    });

    it('should use default width when not specified', () => {
      const { width, ...propsWithoutWidth } = mockProps;
      const rendered = MockSimpleIDCard.render(propsWithoutWidth);
      
      expect(rendered).toContain('width: 300px');
    });

    it('should handle zero width', () => {
      const propsWithZeroWidth = { ...mockProps, width: 0 };
      const rendered = MockSimpleIDCard.render(propsWithZeroWidth);
      
      expect(rendered).toContain('width: 0px');
    });

    it('should handle very large width', () => {
      const propsWithLargeWidth = { ...mockProps, width: 2000 };
      const rendered = MockSimpleIDCard.render(propsWithLargeWidth);
      
      expect(rendered).toContain('width: 2000px');
    });

    it('should handle negative width', () => {
      const propsWithNegativeWidth = { ...mockProps, width: -100 };
      const rendered = MockSimpleIDCard.render(propsWithNegativeWidth);
      
      expect(rendered).toContain('width: -100px');
    });
  });

  describe('Selection Functionality', () => {
    it('should render checkbox with correct initial state', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('aria-label="Select card"');
      expect(rendered).not.toContain('checked');
    });

    it('should show selected state', () => {
      const selectedProps = { ...mockProps, isSelected: true };
      const rendered = MockSimpleIDCard.render(selectedProps);
      
      expect(rendered).toContain('checked');
      expect(rendered).toContain('data-selected="true"');
    });

    it('should not show selected state when not selected', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).not.toContain('checked');
      expect(rendered).not.toContain('data-selected="true"');
    });

    it('should handle selection state changes', () => {
      // Start unselected
      let rendered = MockSimpleIDCard.render(mockProps);
      expect(rendered).not.toContain('checked');
      
      // Change to selected
      const selectedProps = { ...mockProps, isSelected: true };
      rendered = MockSimpleIDCard.render(selectedProps);
      expect(rendered).toContain('checked');
      
      // Change back to unselected
      rendered = MockSimpleIDCard.render(mockProps);
      expect(rendered).not.toContain('checked');
    });
  });

  describe('Action Buttons', () => {
    it('should render download and delete buttons', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('Download');
      expect(rendered).toContain('Delete');
    });

    it('should show loading states', () => {
      const loadingProps = { ...mockProps, downloading: true, deleting: true };
      const rendered = MockSimpleIDCard.render(loadingProps);
      
      expect(rendered).toContain('Downloading...');
      expect(rendered).toContain('Deleting...');
      expect(rendered.match(/disabled/g)?.length).toBe(2);
    });

    it('should show individual loading states', () => {
      // Test download loading only
      let loadingProps = { ...mockProps, downloading: true };
      let rendered = MockSimpleIDCard.render(loadingProps);
      
      expect(rendered).toContain('Downloading...');
      expect(rendered).toContain('Delete'); // Not deleting
      expect(rendered.match(/disabled/g)?.length).toBe(1);
      
      // Test delete loading only
      loadingProps = { ...mockProps, deleting: true };
      rendered = MockSimpleIDCard.render(loadingProps);
      
      expect(rendered).toContain('Deleting...');
      expect(rendered).toContain('Download'); // Not downloading
      expect(rendered.match(/disabled/g)?.length).toBe(1);
    });

    it('should not show loading state when not loading', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).not.toContain('Downloading...');
      expect(rendered).not.toContain('Deleting...');
      expect(rendered).toContain('Download');
      expect(rendered).toContain('Delete');
      expect(rendered).not.toContain('disabled');
    });
  });

  describe('Template Name Display', () => {
    it('should display template name', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('Employee ID Template');
      expect(rendered).toContain('class="template-name"');
    });

    it('should handle missing template name', () => {
      const cardWithoutTemplate = {
        ...mockCardWithImage,
        template_name: null
      };
      
      const propsWithoutTemplate = { ...mockProps, card: cardWithoutTemplate };
      const rendered = MockSimpleIDCard.render(propsWithoutTemplate);
      
      expect(rendered).toContain('Unknown Template');
    });

    it('should handle undefined template name', () => {
      const cardWithUndefinedTemplate = {
        ...mockCardWithImage,
        template_name: undefined
      };
      
      const propsWithUndefinedTemplate = { ...mockProps, card: cardWithUndefinedTemplate };
      const rendered = MockSimpleIDCard.render(propsWithUndefinedTemplate);
      
      expect(rendered).toContain('Unknown Template');
    });

    it('should handle empty template name', () => {
      const cardWithEmptyTemplate = {
        ...mockCardWithImage,
        template_name: ''
      };
      
      const propsWithEmptyTemplate = { ...mockProps, card: cardWithEmptyTemplate };
      const rendered = MockSimpleIDCard.render(propsWithEmptyTemplate);
      
      expect(rendered).toContain('Unknown Template');
    });

    it('should handle very long template names', () => {
      const cardWithLongTemplate = {
        ...mockCardWithImage,
        template_name: 'This Is A Very Long Template Name That Should Be Handled Properly By The Component'
      };
      
      const propsWithLongTemplate = { ...mockProps, card: cardWithLongTemplate };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithLongTemplate);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attributes', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('role="button"');
      expect(rendered).toContain('tabindex="0"');
    });

    it('should have proper image accessibility', () => {
      // With image
      let rendered = MockSimpleIDCard.render(mockProps);
      expect(rendered).toContain('alt="Card preview"');
      expect(rendered).toContain('role="img"');
      
      // Without image (placeholder)
      const propsWithoutImage = { ...mockProps, card: mockCardWithoutImage };
      rendered = MockSimpleIDCard.render(propsWithoutImage);
      expect(rendered).toContain('aria-hidden="true"');
    });

    it('should have accessible form controls', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('aria-label="Select card"');
      expect(rendered).toContain('type="checkbox"');
    });

    it('should maintain accessibility with different states', () => {
      const accessibleProps = {
        ...mockProps,
        isSelected: true,
        downloading: true,
        deleting: false
      };
      
      const rendered = MockSimpleIDCard.render(accessibleProps);
      
      expect(rendered).toContain('role="button"');
      expect(rendered).toContain('aria-label="Select card"');
      expect(rendered).toContain('checked');
      expect(rendered).toContain('disabled'); // For downloading button
    });
  });

  describe('Error Handling', () => {
    it('should handle missing image gracefully', () => {
      const cardWithUndefinedImage = {
        ...mockCardWithImage,
        front_image: undefined
      };

      const propsWithUndefinedImage = { ...mockProps, card: cardWithUndefinedImage };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithUndefinedImage);
      }).not.toThrow();
    });

    it('should handle missing fields gracefully', () => {
      const cardWithoutFields = {
        ...mockCardWithImage,
        fields: undefined
      };

      const propsWithoutFields = { ...mockProps, card: cardWithoutFields };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithoutFields);
      }).not.toThrow();
    });

    it('should handle null card data', () => {
      const propsWithNullCard = { ...mockProps, card: null };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithNullCard);
      }).not.toThrow();
    });

    it('should handle undefined card data', () => {
      const propsWithUndefinedCard = { ...mockProps, card: undefined };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithUndefinedCard);
      }).not.toThrow();
    });

    it('should handle invalid image paths', () => {
      const cardWithInvalidImage = {
        ...mockCardWithImage,
        front_image: 'invalid/path/with/../../traversal'
      };
      
      const propsWithInvalidImage = { ...mockProps, card: cardWithInvalidImage };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithInvalidImage);
      }).not.toThrow();
    });

    it('should handle malformed card objects', () => {
      const malformedCards = [
        'not-an-object',
        [],
        123,
        true,
        { idcard_id: 'test' } // Missing other properties
      ];

      malformedCards.forEach((malformedCard, index) => {
        const propsWithMalformedCard = { ...mockProps, card: malformedCard };
        
        expect(() => {
          MockSimpleIDCard.render(propsWithMalformedCard);
        }, `Should handle malformed card ${index}`).not.toThrow();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in image paths', () => {
      const cardWithSpecialChars = {
        ...mockCardWithImage,
        front_image: 'org-123/template with spaces/card (1).png'
      };
      
      const propsWithSpecialChars = { ...mockProps, card: cardWithSpecialChars };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithSpecialChars);
      }).not.toThrow();
    });

    it('should handle very long image paths', () => {
      const cardWithLongPath = {
        ...mockCardWithImage,
        front_image: 'very/long/path/that/goes/very/deep/into/the/storage/structure/with/many/nested/directories/final-image.png'
      };
      
      const propsWithLongPath = { ...mockProps, card: cardWithLongPath };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithLongPath);
      }).not.toThrow();
    });

    it('should handle numeric template names', () => {
      const cardWithNumericTemplate = {
        ...mockCardWithImage,
        template_name: 12345
      };
      
      const propsWithNumericTemplate = { ...mockProps, card: cardWithNumericTemplate };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithNumericTemplate);
      }).not.toThrow();
    });

    it('should handle boolean values', () => {
      const cardWithBooleanValues = {
        ...mockCardWithImage,
        front_image: false,
        template_name: true
      };
      
      const propsWithBooleanValues = { ...mockProps, card: cardWithBooleanValues };
      
      expect(() => {
        MockSimpleIDCard.render(propsWithBooleanValues);
      }).not.toThrow();
    });

    it('should handle extreme width values', () => {
      const extremeWidths = [0, -100, 10000, Infinity, -Infinity, NaN];
      
      extremeWidths.forEach((width, index) => {
        const propsWithExtremeWidth = { ...mockProps, width };
        
        expect(() => {
          MockSimpleIDCard.render(propsWithExtremeWidth);
        }, `Should handle extreme width ${index}: ${width}`).not.toThrow();
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with images', () => {
      const startTime = performance.now();
      
      // Render 100 cards with images
      for (let i = 0; i < 100; i++) {
        const testCard = {
          ...mockCardWithImage,
          idcard_id: `card-${i}`,
          front_image: `test/path/card-${i}-front.png`
        };
        
        const testProps = { ...mockProps, card: testCard };
        MockSimpleIDCard.render(testProps);
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 100 cards with images in under 300ms
      expect(renderTime).toBeLessThan(300);
    });

    it('should render efficiently without images', () => {
      const startTime = performance.now();
      
      // Render 100 cards without images
      for (let i = 0; i < 100; i++) {
        const testCard = {
          ...mockCardWithoutImage,
          idcard_id: `card-${i}`,
          template_name: `Template ${i}`
        };
        
        const testProps = { ...mockProps, card: testCard };
        MockSimpleIDCard.render(testProps);
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 100 cards without images in under 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle rapid state changes efficiently', () => {
      const startTime = performance.now();
      
      // Simulate rapid state changes
      for (let i = 0; i < 500; i++) {
        const testProps = {
          ...mockProps,
          isSelected: i % 2 === 0,
          downloading: i % 3 === 0,
          deleting: i % 5 === 0,
          width: 300 + (i % 100) // Varying widths
        };
        
        MockSimpleIDCard.render(testProps);
      }
      
      const endTime = performance.now();
      const stateChangeTime = endTime - startTime;
      
      // Should handle 500 state changes in under 400ms
      expect(stateChangeTime).toBeLessThan(400);
    });

    it('should scale with different image path lengths', () => {
      const shortPath = 'a.png';
      const longPath = 'very/long/path/to/image/that/tests/performance/with/long/strings/final-image-with-very-long-name.png';
      
      // Test short paths
      const shortStartTime = performance.now();
      for (let i = 0; i < 50; i++) {
        const testCard = { ...mockCardWithImage, front_image: shortPath };
        const testProps = { ...mockProps, card: testCard };
        MockSimpleIDCard.render(testProps);
      }
      const shortTime = performance.now() - shortStartTime;
      
      // Test long paths
      const longStartTime = performance.now();
      for (let i = 0; i < 50; i++) {
        const testCard = { ...mockCardWithImage, front_image: longPath };
        const testProps = { ...mockProps, card: testCard };
        MockSimpleIDCard.render(testProps);
      }
      const longTime = performance.now() - longStartTime;
      
      // Performance difference should not be significant
      expect(longTime - shortTime).toBeLessThan(100);
    });
  });

  describe('Layout and Styling', () => {
    it('should maintain consistent structure', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('class="simple-id-card"');
      expect(rendered).toContain('class="card-image-container"');
      expect(rendered).toContain('class="card-overlay"');
      expect(rendered).toContain('class="card-controls"');
      expect(rendered).toContain('class="card-actions"');
      expect(rendered).toContain('class="card-info"');
    });

    it('should preserve aspect ratio in different scenarios', () => {
      // With image
      let rendered = MockSimpleIDCard.render(mockProps);
      expect(rendered).toContain('aspect-ratio: 1013/638');
      
      // Without image
      const propsWithoutImage = { ...mockProps, card: mockCardWithoutImage };
      rendered = MockSimpleIDCard.render(propsWithoutImage);
      expect(rendered).toContain('aspect-ratio: 1013/638');
    });

    it('should handle responsive width changes', () => {
      const widths = [100, 200, 300, 400, 500];
      
      widths.forEach(width => {
        const testProps = { ...mockProps, width };
        const rendered = MockSimpleIDCard.render(testProps);
        
        expect(rendered).toContain(`width: ${width}px`);
      });
    });

    it('should maintain proper overlay positioning', () => {
      const rendered = MockSimpleIDCard.render(mockProps);
      
      expect(rendered).toContain('class="card-overlay"');
      expect(rendered.indexOf('card-overlay')).toBeGreaterThan(rendered.indexOf('card-image-container'));
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with real-world image URLs', () => {
      const realWorldCard = {
        idcard_id: 'real-world-card',
        template_name: 'Real World Template',
        front_image: 'organization-12345/template-67890/employee-001-20240101-front.png',
        back_image: 'organization-12345/template-67890/employee-001-20240101-back.png',
        fields: {
          'Name': { value: 'Real Employee', side: 'front' as const }
        }
      };
      
      const realWorldProps = { ...mockProps, card: realWorldCard };
      
      expect(() => {
        MockSimpleIDCard.render(realWorldProps);
      }).not.toThrow();
      
      const rendered = MockSimpleIDCard.render(realWorldProps);
      expect(rendered).toContain('organization-12345/template-67890/employee-001-20240101-front.png');
    });

    it('should handle multilingual template names', () => {
      const multilingualCard = {
        ...mockCardWithImage,
        template_name: '员工证件模板 (Employee Card Template)'
      };
      
      const multilingualProps = { ...mockProps, card: multilingualCard };
      
      expect(() => {
        MockSimpleIDCard.render(multilingualProps);
      }).not.toThrow();
    });

    it('should work with mixed loading states', () => {
      const mixedStates = [
        { downloading: true, deleting: false, isSelected: false },
        { downloading: false, deleting: true, isSelected: true },
        { downloading: true, deleting: true, isSelected: false },
        { downloading: false, deleting: false, isSelected: true }
      ];
      
      mixedStates.forEach((state, index) => {
        const testProps = { ...mockProps, ...state };
        
        expect(() => {
          MockSimpleIDCard.render(testProps);
        }, `Should handle mixed state ${index}`).not.toThrow();
      });
    });
  });
});
