import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { TestDataFactory, AssertionHelpers, ValidationHelpers } from '../utils/test-helpers';
import { supabase } from '$lib/supabaseClient';

describe('Template & Element Positioning - Edge Cases', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Element Positioning Boundary Cases', () => {
    it('should handle elements at exact template boundaries', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      // Element exactly at boundaries (should be valid)
      const boundaryElements = [
        // Top-left corner
        TestDataFactory.createElement({
          id: 'top-left',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          variableName: 'top_left_field'
        }),
        // Bottom-right corner (exactly fits)
        TestDataFactory.createElement({
          id: 'bottom-right',
          x: 913, // 1013 - 100
          y: 588, // 638 - 50  
          width: 100,
          height: 50,
          variableName: 'bottom_right_field'
        }),
        // Exactly on right edge
        TestDataFactory.createElement({
          id: 'right-edge',
          x: 1013 - 1, // Exactly at right edge
          y: 300,
          width: 1, // Minimal width
          height: 1, // Minimal height
          variableName: 'edge_field'
        }),
        // Zero-width element (edge case)
        TestDataFactory.createElement({
          id: 'zero-width',
          x: 500,
          y: 300,
          width: 0,
          height: 50,
          variableName: 'zero_width_field'
        })
      ];

      template.template_elements = boundaryElements;

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      expect(error).toBeNull();
      expect(createdTemplate.template_elements).toHaveLength(4);

      // Validate each element is within bounds
      createdTemplate.template_elements.forEach((element: any) => {
        if (element.width > 0 && element.height > 0) {
          AssertionHelpers.expectElementInBounds(
            element, 
            template.width_pixels, 
            template.height_pixels
          );
        }
      });
    });

    it('should handle overlapping elements', async () => {
      const { profile: user, organization: org } = testData;

      const overlappingElements = [
        TestDataFactory.createElement({
          id: 'element-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          variableName: 'field_1'
        }),
        // Completely overlapping
        TestDataFactory.createElement({
          id: 'element-2',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          variableName: 'field_2'
        }),
        // Partially overlapping
        TestDataFactory.createElement({
          id: 'element-3',
          x: 150,
          y: 150,
          width: 200,
          height: 100,
          variableName: 'field_3'
        }),
        // Same position, different size
        TestDataFactory.createElement({
          id: 'element-4',
          x: 100,
          y: 100,
          width: 300,
          height: 150,
          variableName: 'field_4'
        })
      ];

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        template_elements: overlappingElements
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      expect(error).toBeNull();

      // Check for overlapping elements
      const detectOverlap = (el1: any, el2: any): boolean => {
        return !(el1.x + el1.width <= el2.x || 
                el2.x + el2.width <= el1.x ||
                el1.y + el1.height <= el2.y ||
                el2.y + el2.height <= el1.y);
      };

      const elements = createdTemplate.template_elements;
      let overlapsFound = 0;
      
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          if (detectOverlap(elements[i], elements[j])) {
            overlapsFound++;
          }
        }
      }

      // System should allow overlaps but track them
      expect(overlapsFound).toBeGreaterThan(0);
    });

    it('should handle elements extending beyond template boundaries', async () => {
      const { profile: user, organization: org } = testData;

      const outOfBoundsElements = [
        // Extends beyond right edge
        TestDataFactory.createElement({
          id: 'extends-right',
          x: 950,
          y: 100,
          width: 200, // Extends 137px beyond 1013px width
          height: 50,
          variableName: 'extends_right'
        }),
        // Extends beyond bottom edge
        TestDataFactory.createElement({
          id: 'extends-bottom',
          x: 100,
          y: 600,
          width: 100,
          height: 100, // Extends 62px beyond 638px height
          variableName: 'extends_bottom'
        }),
        // Negative position
        TestDataFactory.createElement({
          id: 'negative-position',
          x: -50,
          y: -25,
          width: 100,
          height: 50,
          variableName: 'negative_pos'
        }),
        // Extremely large element
        TestDataFactory.createElement({
          id: 'huge-element',
          x: 0,
          y: 0,
          width: 10000,
          height: 10000,
          variableName: 'huge_field'
        })
      ];

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        template_elements: outOfBoundsElements
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      // System should either:
      // 1. Accept out-of-bounds elements (for flexibility), OR
      // 2. Reject them with validation errors
      
      if (error) {
        expect(error.message).toContain('bounds'); // Validation rejection
      } else {
        // If accepted, verify data integrity
        expect(createdTemplate.template_elements).toHaveLength(4);
        
        // Check if any elements are problematic
        const problematicElements = createdTemplate.template_elements.filter((el: any) => 
          el.x < 0 || el.y < 0 || 
          el.x + el.width > template.width_pixels ||
          el.y + el.height > template.height_pixels
        );

        console.log(`Found ${problematicElements.length} out-of-bounds elements`);
      }
    });

    it('should handle elements with extreme dimensions', async () => {
      const { profile: user, organization: org } = testData;

      const extremeElements = [
        // Extremely wide element
        TestDataFactory.createElement({
          id: 'ultra-wide',
          x: 100,
          y: 100,
          width: 50000,
          height: 1,
          variableName: 'ultra_wide'
        }),
        // Extremely tall element
        TestDataFactory.createElement({
          id: 'ultra-tall',
          x: 100,
          y: 100,
          width: 1,
          height: 50000,
          variableName: 'ultra_tall'
        }),
        // Negative dimensions
        TestDataFactory.createElement({
          id: 'negative-dims',
          x: 100,
          y: 100,
          width: -100,
          height: -50,
          variableName: 'negative_dims'
        }),
        // Float precision dimensions
        TestDataFactory.createElement({
          id: 'float-dims',
          x: 100.123456789,
          y: 100.987654321,
          width: 200.555555,
          height: 50.111111,
          variableName: 'float_dims'
        })
      ];

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        template_elements: extremeElements
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        // System should catch invalid dimensions
        expect(error.message).toMatch(/dimension|width|height/i);
      } else {
        // Verify data handling
        const elements = createdTemplate.template_elements;
        
        // Check negative dimensions are handled
        const negativeElement = elements.find((el: any) => el.id === 'negative-dims');
        if (negativeElement) {
          // System should either reject or normalize negative dimensions
          expect(negativeElement.width).toBeGreaterThanOrEqual(0);
          expect(negativeElement.height).toBeGreaterThanOrEqual(0);
        }

        // Check float precision preservation
        const floatElement = elements.find((el: any) => el.id === 'float-dims');
        if (floatElement) {
          expect(floatElement.x).toBeCloseTo(100.123456789, 6);
          expect(floatElement.y).toBeCloseTo(100.987654321, 6);
        }
      }
    });
  });

  describe('Template Dimension Edge Cases', () => {
    it('should handle extreme template sizes', async () => {
      const { profile: user, organization: org } = testData;

      const extremeTemplates = [
        // Minimum size template
        TestDataFactory.createTemplate({
          org_id: org.id,
          user_id: user.id,
          name: 'Tiny Template',
          width_pixels: 1,
          height_pixels: 1,
          dpi: 1
        }),
        // Maximum reasonable size
        TestDataFactory.createTemplate({
          org_id: org.id,
          user_id: user.id,
          name: 'Huge Template',
          width_pixels: 7200, // Common print maximum
          height_pixels: 7200,
          dpi: 600
        }),
        // Extreme aspect ratio
        TestDataFactory.createTemplate({
          org_id: org.id,
          user_id: user.id,
          name: 'Ultra Wide Template',
          width_pixels: 5000,
          height_pixels: 100,
          dpi: 300
        })
      ];

      for (const template of extremeTemplates) {
        const { data, error } = await supabase
          .from('templates')
          .insert(template)
          .select()
          .single();

        if (error) {
          // System may reject extreme dimensions
          console.log(`Template "${template.name}" rejected: ${error.message}`);
        } else {
          expect(ValidationHelpers.isValidTemplate(data)).toBe(true);
        }
      }
    });

    it('should handle DPI boundary values', async () => {
      const { profile: user, organization: org } = testData;

      const dpiTestTemplates = [
        // Minimum DPI
        { dpi: 1, width_pixels: 100, height_pixels: 100 },
        // Standard DPIs
        { dpi: 72, width_pixels: 216, height_pixels: 216 }, // 3" x 3" at 72 DPI
        { dpi: 150, width_pixels: 450, height_pixels: 450 }, // 3" x 3" at 150 DPI
        { dpi: 300, width_pixels: 900, height_pixels: 900 }, // 3" x 3" at 300 DPI
        { dpi: 600, width_pixels: 1800, height_pixels: 1800 }, // 3" x 3" at 600 DPI
        // Very high DPI
        { dpi: 2400, width_pixels: 7200, height_pixels: 7200 }, // 3" x 3" at 2400 DPI
        // Zero DPI (invalid)
        { dpi: 0, width_pixels: 100, height_pixels: 100 }
      ];

      for (const config of dpiTestTemplates) {
        const template = TestDataFactory.createTemplate({
          org_id: org.id,
          user_id: user.id,
          name: `DPI Test ${config.dpi}`,
          width_pixels: config.width_pixels,
          height_pixels: config.height_pixels,
          dpi: config.dpi
        });

        const { data, error } = await supabase
          .from('templates')
          .insert(template)
          .select()
          .single();

        if (config.dpi === 0) {
          // Zero DPI should be rejected
          expect(error).toBeTruthy();
        } else if (error) {
          console.log(`DPI ${config.dpi} rejected: ${error.message}`);
        } else {
          expect(data.dpi).toBe(config.dpi);
          
          // Verify pixel to inch calculation consistency
          const expectedWidthInches = config.width_pixels / config.dpi;
          const expectedHeightInches = config.height_pixels / config.dpi;
          
          // Allow small floating point differences
          if (data.width_inches) {
            expect(data.width_inches).toBeCloseTo(expectedWidthInches, 2);
          }
          if (data.height_inches) {
            expect(data.height_inches).toBeCloseTo(expectedHeightInches, 2);
          }
        }
      }
    });

    it('should handle orientation changes with existing elements', async () => {
      const { profile: user, organization: org } = testData;

      // Create landscape template with elements
      const landscapeElements = [
        TestDataFactory.createElement({
          id: 'landscape-element',
          x: 800, // Valid in 1013px width
          y: 500, // Valid in 638px height
          width: 200,
          height: 100,
          variableName: 'landscape_field'
        })
      ];

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        orientation: 'landscape',
        width_pixels: 1013,
        height_pixels: 638,
        template_elements: landscapeElements
      });

      const { data: landscapeTemplate } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      // Change to portrait (dimensions should swap: 638x1013)
      const { data: portraitTemplate, error } = await supabase
        .from('templates')
        .update({
          orientation: 'portrait',
          width_pixels: 638,
          height_pixels: 1013
        })
        .eq('id', landscapeTemplate.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(portraitTemplate.orientation).toBe('portrait');

      // Element at x=800 is now outside 638px width
      const element = portraitTemplate.template_elements[0];
      const isOutOfBounds = element.x + element.width > 638;
      
      if (isOutOfBounds) {
        // System should either:
        // 1. Automatically reposition elements, OR
        // 2. Mark template as needing manual adjustment
        console.log('Element is out of bounds after orientation change');
      }
    });
  });

  describe('Element Stacking and Z-Index Cases', () => {
    it('should handle elements with same positioning but different z-index', async () => {
      const { profile: user, organization: org } = testData;

      // Elements at same position with different stacking order
      const stackedElements = [
        TestDataFactory.createElement({
          id: 'background-layer',
          x: 100,
          y: 100,
          width: 300,
          height: 200,
          variableName: 'background',
          // z-index: 1 (assumed background)
        }),
        TestDataFactory.createElement({
          id: 'middle-layer',
          x: 150,
          y: 150,
          width: 200,
          height: 100,
          variableName: 'middle',
          // z-index: 2 (assumed middle)
        }),
        TestDataFactory.createElement({
          id: 'top-layer',
          x: 200,
          y: 175,
          width: 100,
          height: 50,
          variableName: 'top',
          // z-index: 3 (assumed top)
        })
      ];

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        template_elements: stackedElements
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      expect(error).toBeNull();
      expect(createdTemplate.template_elements).toHaveLength(3);

      // Verify element order is preserved
      const elements = createdTemplate.template_elements;
      expect(elements.find((el: any) => el.id === 'background-layer')).toBeTruthy();
      expect(elements.find((el: any) => el.id === 'middle-layer')).toBeTruthy();
      expect(elements.find((el: any) => el.id === 'top-layer')).toBeTruthy();
    });

    it('should handle massive numbers of elements', async () => {
      const { profile: user, organization: org } = testData;

      // Create template with many elements
      const manyElements = Array.from({ length: 1000 }, (_, i) => 
        TestDataFactory.createElement({
          id: `element-${i}`,
          x: (i % 20) * 50, // Grid layout
          y: Math.floor(i / 20) * 30,
          width: 45,
          height: 25,
          variableName: `field_${i}`,
          side: i % 2 === 0 ? 'front' : 'back'
        })
      );

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        name: 'Template with 1000 elements',
        template_elements: manyElements
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        // System may reject templates with too many elements
        expect(error.message).toContain('elements'); // Size limit reached
      } else {
        expect(createdTemplate.template_elements).toHaveLength(1000);
        
        // Verify performance doesn't degrade significantly
        const startTime = Date.now();
        const frontElements = createdTemplate.template_elements.filter((el: any) => el.side === 'front');
        const processingTime = Date.now() - startTime;
        
        expect(processingTime).toBeLessThan(1000); // Should process within 1 second
        expect(frontElements.length).toBe(500);
      }
    });
  });

  describe('Font and Text Rendering Edge Cases', () => {
    it('should handle elements with extreme font sizes', async () => {
      const { profile: user, organization: org } = testData;

      const extremeFontElements = [
        // Extremely small font
        TestDataFactory.createElement({
          id: 'tiny-font',
          fontSize: 0.1,
          variableName: 'tiny_text',
          width: 100,
          height: 20
        }),
        // Extremely large font
        TestDataFactory.createElement({
          id: 'huge-font',
          fontSize: 1000,
          variableName: 'huge_text',
          width: 100,
          height: 20 // Font larger than container
        }),
        // Zero font size
        TestDataFactory.createElement({
          id: 'zero-font',
          fontSize: 0,
          variableName: 'invisible_text',
          width: 100,
          height: 20
        }),
        // Negative font size
        TestDataFactory.createElement({
          id: 'negative-font',
          fontSize: -12,
          variableName: 'negative_text',
          width: 100,
          height: 20
        })
      ];

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        template_elements: extremeFontElements
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        // System may validate font size ranges
        expect(error.message).toContain('font'); 
      } else {
        const elements = createdTemplate.template_elements;
        
        // Check how system handles extreme font sizes
        const tinyFontElement = elements.find((el: any) => el.id === 'tiny-font');
        const hugeFontElement = elements.find((el: any) => el.id === 'huge-font');
        const zeroFontElement = elements.find((el: any) => el.id === 'zero-font');
        const negativeFontElement = elements.find((el: any) => el.id === 'negative-font');
        
        if (tinyFontElement) {
          expect(tinyFontElement.fontSize).toBeGreaterThan(0);
        }
        
        if (negativeFontElement) {
          // System should normalize negative font sizes
          expect(negativeFontElement.fontSize).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should handle extremely long text content', async () => {
      const { profile: user, organization: org } = testData;

      const longTextElement = TestDataFactory.createElement({
        id: 'long-text',
        variableName: 'long_content',
        width: 200,
        height: 100,
        content: 'A'.repeat(10000) // 10,000 character string
      });

      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        template_elements: [longTextElement]
      });

      const { data: createdTemplate, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        // System may limit content length
        expect(error.message).toContain('content'); 
      } else {
        const element = createdTemplate.template_elements[0];
        expect(element.content?.length).toBeLessThanOrEqual(10000);
      }
    });
  });
});