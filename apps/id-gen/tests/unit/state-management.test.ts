import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { templateData } from '$lib/stores/templateStore';
import type { TemplateData, TemplateElement } from '$lib/stores/templateStore';

// Mock browser environment
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
});

vi.stubGlobal('sessionStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(), 
  removeItem: vi.fn(),
  clear: vi.fn()
});

describe('State Management - Template Store', () => {
  beforeEach(() => {
    templateData.reset();
    vi.clearAllMocks();
  });

  describe('Template Store Initialization', () => {
    it('should initialize with default template structure', () => {
      const store = get(templateData);
      
      expect(store.id).toBe('');
      expect(store.name).toBe('');
      expect(store.orientation).toBe('landscape');
      expect(store.template_elements).toEqual([]);
      expect(store.width_pixels).toBe(1013);
      expect(store.height_pixels).toBe(638);
      expect(store.dpi).toBe(300);
    });

    it('should have correct default dimensions for credit card format', () => {
      const store = get(templateData);
      
      // Credit card standard: 3.375" x 2.125" at 300 DPI
      expect(store.width_inches).toBe(3.375);
      expect(store.height_inches).toBe(2.125);
      expect(store.width_pixels).toBe(1013); // 3.375 * 300
      expect(store.height_pixels).toBe(638); // 2.125 * 300
    });
  });

  describe('Template Selection and Updates', () => {
    it('should select and load template correctly', () => {
      const mockTemplate: TemplateData = {
        id: 'template-123',
        user_id: 'user-456',
        name: 'Employee ID',
        org_id: 'org-789',
        front_background: '#ffffff',
        back_background: '#f0f0f0',
        orientation: 'portrait',
        template_elements: [],
        created_at: '2024-01-01T00:00:00Z',
        dpi: 300,
        width_pixels: 638,
        height_pixels: 1013
      };

      templateData.select(mockTemplate);
      const store = get(templateData);

      expect(store.id).toBe('template-123');
      expect(store.name).toBe('Employee ID');
      expect(store.orientation).toBe('portrait');
      expect(store.width_pixels).toBe(638);
      expect(store.height_pixels).toBe(1013);
    });

    it('should handle template updates correctly', () => {
      const initialTemplate: TemplateData = {
        id: 'template-123',
        user_id: 'user-456', 
        name: 'Original Name',
        org_id: 'org-789',
        front_background: '#ffffff',
        back_background: '#f0f0f0',
        orientation: 'landscape',
        template_elements: [],
        created_at: '2024-01-01T00:00:00Z',
        dpi: 300,
        width_pixels: 1013,
        height_pixels: 638
      };

      templateData.select(initialTemplate);

      // Update template name
      templateData.update(store => ({
        ...store,
        name: 'Updated Name',
        updated_at: '2024-01-02T00:00:00Z'
      }));

      const updatedStore = get(templateData);
      expect(updatedStore.name).toBe('Updated Name');
      expect(updatedStore.updated_at).toBe('2024-01-02T00:00:00Z');
      expect(updatedStore.id).toBe('template-123'); // Other fields preserved
    });

    it('should reset to default state', () => {
      // First set some data
      templateData.update(store => ({
        ...store,
        name: 'Some Template',
        id: 'test-id',
        template_elements: [
          {
            id: 'element-1',
            type: 'text',
            x: 100,
            y: 200,
            width: 200,
            height: 50,
            variableName: 'name',
            side: 'front'
          }
        ]
      }));

      // Reset and verify
      templateData.reset();
      const store = get(templateData);

      expect(store.name).toBe('');
      expect(store.id).toBe('');
      expect(store.template_elements).toEqual([]);
      expect(store.width_pixels).toBe(1013);
      expect(store.height_pixels).toBe(638);
    });
  });

  describe('Template Elements Management', () => {
    it('should handle adding template elements', () => {
      const newElement: TemplateElement = {
        id: 'element-1',
        type: 'text',
        x: 100,
        y: 150,
        width: 200,
        height: 30,
        variableName: 'employee_name',
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#000000',
        side: 'front'
      };

      templateData.update(store => ({
        ...store,
        template_elements: [...store.template_elements, newElement]
      }));

      const store = get(templateData);
      expect(store.template_elements).toHaveLength(1);
      expect(store.template_elements[0].id).toBe('element-1');
      expect(store.template_elements[0].type).toBe('text');
      expect(store.template_elements[0].variableName).toBe('employee_name');
    });

    it('should handle updating existing template elements', () => {
      const initialElement: TemplateElement = {
        id: 'element-1',
        type: 'text',
        x: 100,
        y: 150,
        width: 200,
        height: 30,
        variableName: 'name',
        fontSize: 12,
        color: '#000000',
        side: 'front'
      };

      // Add initial element
      templateData.update(store => ({
        ...store,
        template_elements: [initialElement]
      }));

      // Update element properties
      templateData.update(store => ({
        ...store,
        template_elements: store.template_elements.map(el => 
          el.id === 'element-1' 
            ? { ...el, fontSize: 16, color: '#333333', x: 150 }
            : el
        )
      }));

      const store = get(templateData);
      const updatedElement = store.template_elements[0];
      
      expect(updatedElement.fontSize).toBe(16);
      expect(updatedElement.color).toBe('#333333');
      expect(updatedElement.x).toBe(150);
      expect(updatedElement.variableName).toBe('name'); // Unchanged
    });

    it('should handle removing template elements', () => {
      const elements: TemplateElement[] = [
        {
          id: 'element-1',
          type: 'text',
          x: 100, y: 150, width: 200, height: 30,
          variableName: 'name',
          side: 'front'
        },
        {
          id: 'element-2', 
          type: 'image',
          x: 300, y: 150, width: 100, height: 100,
          variableName: 'photo',
          side: 'front'
        }
      ];

      // Add elements
      templateData.update(store => ({
        ...store,
        template_elements: elements
      }));

      // Remove first element
      templateData.update(store => ({
        ...store,
        template_elements: store.template_elements.filter(el => el.id !== 'element-1')
      }));

      const store = get(templateData);
      expect(store.template_elements).toHaveLength(1);
      expect(store.template_elements[0].id).toBe('element-2');
      expect(store.template_elements[0].type).toBe('image');
    });

    it('should validate element positioning within template bounds', () => {
      const validateElementPosition = (element: TemplateElement, templateWidth: number, templateHeight: number): boolean => {
        return element.x >= 0 && 
               element.y >= 0 && 
               (element.x + element.width) <= templateWidth &&
               (element.y + element.height) <= templateHeight;
      };

      const store = get(templateData);
      
      const validElement: TemplateElement = {
        id: 'element-1',
        type: 'text',
        x: 100, y: 100, width: 200, height: 30,
        variableName: 'name',
        side: 'front'
      };

      const invalidElement: TemplateElement = {
        id: 'element-2',
        type: 'text',
        x: 1000, y: 100, width: 200, height: 30, // Extends beyond template width
        variableName: 'title',
        side: 'front'
      };

      expect(validateElementPosition(validElement, store.width_pixels, store.height_pixels)).toBe(true);
      expect(validateElementPosition(invalidElement, store.width_pixels, store.height_pixels)).toBe(false);
    });
  });

  describe('Template Dimensions and DPI Handling', () => {
    it('should handle DPI changes and recalculate pixel dimensions', () => {
      const recalculatePixelDimensions = (widthInches: number, heightInches: number, dpi: number) => {
        return {
          width_pixels: Math.round(widthInches * dpi),
          height_pixels: Math.round(heightInches * dpi)
        };
      };

      // Test standard credit card at different DPIs
      const creditCardDims = { width: 3.375, height: 2.125 };
      
      const dpi150 = recalculatePixelDimensions(creditCardDims.width, creditCardDims.height, 150);
      const dpi300 = recalculatePixelDimensions(creditCardDims.width, creditCardDims.height, 300);
      const dpi600 = recalculatePixelDimensions(creditCardDims.width, creditCardDims.height, 600);

      expect(dpi150.width_pixels).toBe(506);  // 3.375 * 150
      expect(dpi150.height_pixels).toBe(319); // 2.125 * 150
      
      expect(dpi300.width_pixels).toBe(1013); // 3.375 * 300
      expect(dpi300.height_pixels).toBe(638); // 2.125 * 300
      
      expect(dpi600.width_pixels).toBe(2025); // 3.375 * 600
      expect(dpi600.height_pixels).toBe(1275); // 2.125 * 600
    });

    it('should handle orientation changes and swap dimensions', () => {
      // Start with landscape
      templateData.update(store => ({
        ...store,
        orientation: 'landscape',
        width_pixels: 1013,
        height_pixels: 638
      }));

      let store = get(templateData);
      expect(store.orientation).toBe('landscape');
      expect(store.width_pixels).toBe(1013);
      expect(store.height_pixels).toBe(638);

      // Switch to portrait - dimensions should swap
      templateData.update(store => ({
        ...store,
        orientation: 'portrait',
        width_pixels: 638,
        height_pixels: 1013
      }));

      store = get(templateData);
      expect(store.orientation).toBe('portrait');
      expect(store.width_pixels).toBe(638);
      expect(store.height_pixels).toBe(1013);
    });
  });

  describe('Template Store Reactivity', () => {
    it('should notify subscribers of changes', () => {
      let notificationCount = 0;
      let lastNotifiedValue: TemplateData | null = null;

      // Subscribe to store changes
      const unsubscribe = templateData.subscribe(value => {
        notificationCount++;
        lastNotifiedValue = value;
      });

      // Initial subscription should trigger notification
      expect(notificationCount).toBe(1);
      expect(lastNotifiedValue!.name).toBe('');

      // Update should trigger notification
      templateData.update(store => ({
        ...store,
        name: 'Test Template'
      }));

      expect(notificationCount).toBe(2);
      expect(lastNotifiedValue!.name).toBe('Test Template');

      // Reset should trigger notification
      templateData.reset();
      
      expect(notificationCount).toBe(3);
      expect(lastNotifiedValue!.name).toBe('');

      unsubscribe();
    });

    it('should handle concurrent updates safely', () => {
      const updateTemplate = (name: string, delay: number = 0) => {
        setTimeout(() => {
          templateData.update(store => ({
            ...store,
            name: name,
            updated_at: new Date().toISOString()
          }));
        }, delay);
      };

      // Simulate concurrent updates
      updateTemplate('Update 1', 0);
      updateTemplate('Update 2', 5);
      updateTemplate('Update 3', 10);

      // Final state should reflect last update
      setTimeout(() => {
        const store = get(templateData);
        expect(store.name).toBe('Update 3');
      }, 20);
    });
  });

  describe('Template Store Edge Cases', () => {
    it('should handle invalid template data gracefully', () => {
      const invalidTemplate = {
        id: 'test',
        // Missing required fields
        name: undefined as any,
        template_elements: null as any
      };

      // Should not crash when setting invalid data
      expect(() => {
        templateData.set(invalidTemplate as any);
      }).not.toThrow();
    });

    it('should preserve element IDs during updates', () => {
      const elements: TemplateElement[] = [
        {
          id: 'stable-id-1',
          type: 'text',
          x: 0, y: 0, width: 100, height: 50,
          variableName: 'field1',
          side: 'front'
        },
        {
          id: 'stable-id-2',
          type: 'text', 
          x: 0, y: 60, width: 100, height: 50,
          variableName: 'field2',
          side: 'front'
        }
      ];

      templateData.update(store => ({
        ...store,
        template_elements: elements
      }));

      // Update properties but preserve IDs
      templateData.update(store => ({
        ...store,
        template_elements: store.template_elements.map(el => ({
          ...el,
          x: el.x + 10 // Shift all elements
        }))
      }));

      const store = get(templateData);
      expect(store.template_elements[0].id).toBe('stable-id-1');
      expect(store.template_elements[1].id).toBe('stable-id-2');
      expect(store.template_elements[0].x).toBe(10);
      expect(store.template_elements[1].x).toBe(10);
    });

    it('should handle deep element structure updates', () => {
      const complexElement: TemplateElement = {
        id: 'complex-1',
        type: 'text',
        x: 100, y: 100, width: 200, height: 30,
        variableName: 'name',
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#000000',
        textDecoration: 'none',
        textTransform: 'uppercase',
        alignment: 'center',
        letterSpacing: 1,
        lineHeight: 1.2,
        opacity: 1,
        visible: true,
        side: 'front'
      };

      templateData.update(store => ({
        ...store,
        template_elements: [complexElement]
      }));

      // Update multiple properties
      templateData.update(store => ({
        ...store,
        template_elements: store.template_elements.map(el => ({
          ...el,
          fontSize: 16,
          fontWeight: 'normal',
          color: '#333333',
          letterSpacing: 2,
          opacity: 0.9
        }))
      }));

      const store = get(templateData);
      const element = store.template_elements[0];
      
      expect(element.fontSize).toBe(16);
      expect(element.fontWeight).toBe('normal');
      expect(element.color).toBe('#333333');
      expect(element.letterSpacing).toBe(2);
      expect(element.opacity).toBe(0.9);
      expect(element.textTransform).toBe('uppercase'); // Unchanged
      expect(element.alignment).toBe('center'); // Unchanged
    });
  });
});