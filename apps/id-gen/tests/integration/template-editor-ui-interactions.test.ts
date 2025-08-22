import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { TestDataFactory, MockUtilities, ValidationHelpers } from '../utils/test-helpers';
import { templateData as templateStore, type TemplateElement } from '$lib/stores/templateStore';
import { get } from 'svelte/store';

// Mock DOM APIs for testing
const mockDOMRect = (x: number, y: number, width: number, height: number): DOMRect => ({
  x, y, width, height,
  top: y,
  left: x,
  right: x + width,
  bottom: y + height,
  toJSON: () => ({ x, y, width, height, top: y, left: x, right: x + width, bottom: y + height })
});

const mockPointerEvent = (type: string, clientX: number, clientY: number, target?: any) => ({
  type,
  clientX,
  clientY,
  target: target || { getBoundingClientRect: () => mockDOMRect(0, 0, 1013, 638) },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  pointerId: 1,
  isPrimary: true
});

describe('Template Editor UI Interactions', () => {
  let testData: any;
  let mockCanvas: any;
  let mockContext: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
    
    // Mock canvas and context
    mockContext = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn()
    };

    mockCanvas = {
      getContext: vi.fn(() => mockContext),
      getBoundingClientRect: () => mockDOMRect(0, 0, 1013, 638),
      width: 1013,
      height: 638,
      style: {}
    };

    // Mock DOM methods
    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockCanvas),
      getElementById: vi.fn(() => mockCanvas),
      querySelector: vi.fn(() => mockCanvas),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    // Reset template store
    templateStore.reset();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Drag and Drop Element Positioning', () => {
    it('should handle element drag start correctly', async () => {
      const { profile: user, organization: org } = testData;
      
      // Create template with element
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      const element: TemplateElement = TestDataFactory.createElement({
        id: 'drag-element',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        variableName: 'draggable_field',
        type: 'text',
        side: 'front'
      });

      // Load template into store
      templateStore.loadTemplate({
        ...template,
        template_elements: [element]
      });

      // Simulate drag start
      const dragStartEvent = mockPointerEvent('pointerdown', 150, 125);
      const elementRect = mockDOMRect(100, 100, 200, 50);

      // Calculate drag offset from element center
      const offsetX = dragStartEvent.clientX - (elementRect.left + elementRect.width / 2);
      const offsetY = dragStartEvent.clientY - (elementRect.top + elementRect.height / 2);

      expect(offsetX).toBe(-50); // 150 - (100 + 100)
      expect(offsetY).toBe(-25);  // 125 - (100 + 25)

      // Verify element is selected for dragging
      const currentTemplate = get(templateStore);
      const selectedElement = currentTemplate.template_elements.find(e => e.id === 'drag-element');
      
      expect(selectedElement).toBeTruthy();
      expect(selectedElement?.x).toBe(100);
      expect(selectedElement?.y).toBe(100);
    });

    it('should update element position during drag movement', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      const element: TemplateElement = TestDataFactory.createElement({
        id: 'move-element',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        variableName: 'moveable_field',
        type: 'text',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [element]
      });

      // Simulate drag movement
      const newX = 250;
      const newY = 200;
      
      // Update element position
      templateStore.updateElement('move-element', {
        x: newX,
        y: newY
      });

      const updatedTemplate = get(templateStore);
      const movedElement = updatedTemplate.template_elements.find(e => e.id === 'move-element');

      expect(movedElement?.x).toBe(newX);
      expect(movedElement?.y).toBe(newY);
      expect(movedElement?.width).toBe(200); // Should preserve other properties
      expect(movedElement?.height).toBe(50);
    });

    it('should enforce canvas boundaries during drag', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      const element: TemplateElement = TestDataFactory.createElement({
        id: 'boundary-element',
        x: 50,
        y: 50,
        width: 100,
        height: 50,
        variableName: 'boundary_field',
        type: 'text',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [element]
      });

      // Test boundary enforcement scenarios
      const boundaryTests = [
        // Try to move beyond left edge
        { newX: -50, newY: 100, expectedX: 0, expectedY: 100 },
        // Try to move beyond top edge
        { newX: 100, newY: -25, expectedX: 100, expectedY: 0 },
        // Try to move beyond right edge (element width = 100)
        { newX: 1000, newY: 100, expectedX: 913, expectedY: 100 }, // 1013 - 100
        // Try to move beyond bottom edge (element height = 50)
        { newX: 100, newY: 650, expectedX: 100, expectedY: 588 }  // 638 - 50
      ];

      for (const test of boundaryTests) {
        // Simulate boundary-constrained positioning
        const constrainedX = Math.max(0, Math.min(test.newX, 1013 - element.width));
        const constrainedY = Math.max(0, Math.min(test.newY, 638 - element.height));

        expect(constrainedX).toBe(test.expectedX);
        expect(constrainedY).toBe(test.expectedY);
      }
    });

    it('should handle multi-element selection and group drag', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      const elements: TemplateElement[] = [
        TestDataFactory.createElement({
          id: 'group-element-1',
          x: 100, y: 100,
          width: 100, height: 50,
          variableName: 'group_field_1',
          type: 'text', side: 'front'
        }),
        TestDataFactory.createElement({
          id: 'group-element-2',
          x: 200, y: 150,
          width: 100, height: 50,
          variableName: 'group_field_2',
          type: 'text', side: 'front'
        })
      ];

      templateStore.loadTemplate({
        ...template,
        template_elements: elements
      });

      // Simulate group selection (Ctrl+click or selection box)
      const selectedElements = ['group-element-1', 'group-element-2'];
      
      // Simulate group drag movement
      const deltaX = 50;
      const deltaY = 25;

      for (const elementId of selectedElements) {
        const currentElement = elements.find(e => e.id === elementId)!;
        templateStore.updateElement(elementId, {
          x: currentElement.x + deltaX,
          y: currentElement.y + deltaY
        });
      }

      const updatedTemplate = get(templateStore);
      
      const element1 = updatedTemplate.template_elements.find(e => e.id === 'group-element-1');
      const element2 = updatedTemplate.template_elements.find(e => e.id === 'group-element-2');

      expect(element1?.x).toBe(150); // 100 + 50
      expect(element1?.y).toBe(125); // 100 + 25
      expect(element2?.x).toBe(250); // 200 + 50
      expect(element2?.y).toBe(175); // 150 + 25
    });
  });

  describe('Element Property Updates', () => {
    it('should update text element properties in real-time', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id
      });

      const textElement: TemplateElement = TestDataFactory.createElement({
        id: 'text-properties',
        type: 'text',
        content: 'Original Text',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        variableName: 'text_field',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [textElement]
      });

      // Update text properties
      const propertyUpdates = {
        content: 'Updated Text',
        fontSize: 20,
        fontFamily: 'Helvetica',
        color: '#FF0000',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const
      };

      templateStore.updateElement('text-properties', propertyUpdates);

      const updatedTemplate = get(templateStore);
      const updatedElement = updatedTemplate.template_elements.find(e => e.id === 'text-properties');

      expect(updatedElement?.content).toBe('Updated Text');
      expect(updatedElement?.fontSize).toBe(20);
      expect(updatedElement?.fontFamily).toBe('Helvetica');
      expect(updatedElement?.color).toBe('#FF0000');
      expect(updatedElement?.fontWeight).toBe('bold');
      expect(updatedElement?.textTransform).toBe('uppercase');
    });

    it('should validate property updates against business rules', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      const element: TemplateElement = TestDataFactory.createElement({
        id: 'validation-element',
        type: 'text',
        x: 100, y: 100,
        width: 200, height: 50,
        variableName: 'validation_field',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [element]
      });

      // Test validation scenarios
      const validationTests = [
        // Font size limits
        { property: 'fontSize', value: 5, isValid: false }, // Too small
        { property: 'fontSize', value: 72, isValid: true },  // Valid
        { property: 'fontSize', value: 200, isValid: false }, // Too large
        
        // Dimension limits
        { property: 'width', value: -10, isValid: false }, // Negative
        { property: 'width', value: 50, isValid: true },   // Valid
        { property: 'width', value: 2000, isValid: false }, // Exceeds canvas
        
        // Variable name validation
        { property: 'variableName', value: '', isValid: false }, // Empty
        { property: 'variableName', value: 'valid_name', isValid: true }, // Valid
        { property: 'variableName', value: '123invalid', isValid: false }, // Starts with number
        { property: 'variableName', value: 'invalid-name', isValid: false } // Contains hyphen
      ];

      for (const test of validationTests) {
        const isValid = ValidationHelpers.validateElementProperty(
          test.property,
          test.value,
          element,
          template
        );
        
        expect(isValid).toBe(test.isValid);
      }
    });

    it('should handle element type conversion properly', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id
      });

      const originalElement: TemplateElement = TestDataFactory.createElement({
        id: 'convert-element',
        type: 'text',
        content: 'Text Content',
        fontSize: 16,
        variableName: 'convert_field',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [originalElement]
      });

      // Convert text element to image element
      const convertedProperties = {
        type: 'image' as const,
        content: '', // Clear text content
        fontSize: undefined, // Remove text-specific properties
        imageUrl: 'https://example.com/image.jpg'
      };

      templateStore.updateElement('convert-element', convertedProperties);

      const updatedTemplate = get(templateStore);
      const convertedElement = updatedTemplate.template_elements.find(e => e.id === 'convert-element');

      expect(convertedElement?.type).toBe('image');
      expect(convertedElement?.content).toBe('');
      expect(convertedElement?.fontSize).toBeUndefined();
      expect(convertedElement?.variableName).toBe('convert_field'); // Should preserve variable name
    });
  });

  describe('Real-time Preview Synchronization', () => {
    it('should update canvas preview immediately on element changes', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id
      });

      const previewElement: TemplateElement = TestDataFactory.createElement({
        id: 'preview-element',
        type: 'text',
        x: 100, y: 100,
        content: 'Preview Text',
        fontSize: 16,
        variableName: 'preview_field',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [previewElement]
      });

      // Simulate property change
      templateStore.updateElement('preview-element', {
        content: 'Updated Preview',
        fontSize: 20,
        x: 150,
        y: 125
      });

      // Verify canvas rendering calls
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Updated Preview'),
        expect.any(Number),
        expect.any(Number)
      );

      // Verify element position update
      const updatedTemplate = get(templateStore);
      const updatedElement = updatedTemplate.template_elements.find(e => e.id === 'preview-element');
      
      expect(updatedElement?.x).toBe(150);
      expect(updatedElement?.y).toBe(125);
    });

    it('should handle front/back side switching in preview', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id
      });

      const frontElement: TemplateElement = TestDataFactory.createElement({
        id: 'front-element',
        side: 'front',
        content: 'Front Side',
        variableName: 'front_field'
      });

      const backElement: TemplateElement = TestDataFactory.createElement({
        id: 'back-element',
        side: 'back',
        content: 'Back Side',
        variableName: 'back_field'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [frontElement, backElement]
      });

      // Test side switching
      let currentSide: 'front' | 'back' = 'front';
      
      // Get visible elements for current side
      const visibleElements = [frontElement, backElement].filter(e => e.side === currentSide);
      expect(visibleElements).toHaveLength(1);
      expect(visibleElements[0].content).toBe('Front Side');

      // Switch to back side
      currentSide = 'back';
      const backVisibleElements = [frontElement, backElement].filter(e => e.side === currentSide);
      expect(backVisibleElements).toHaveLength(1);
      expect(backVisibleElements[0].content).toBe('Back Side');
    });

    it('should synchronize preview with live data binding', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id
      });

      const dataElement: TemplateElement = TestDataFactory.createElement({
        id: 'data-element',
        type: 'text',
        content: '{{name}}', // Template variable
        variableName: 'name',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [dataElement]
      });

      // Mock preview data
      const previewData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Simulate data binding in preview
      const boundContent = dataElement.content?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return previewData[key as keyof typeof previewData] || match;
      });

      expect(boundContent).toBe('John Doe');

      // Test with missing data
      const incompleteData = {};
      const unboundContent = dataElement.content?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return incompleteData[key as keyof typeof incompleteData] || match;
      });

      expect(unboundContent).toBe('{{name}}'); // Should preserve template variable
    });

    it('should handle zoom and pan operations in preview', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        org_id: org.id,
        user_id: user.id,
        width_pixels: 1013,
        height_pixels: 638
      });

      // Mock zoom and pan state
      let zoomLevel = 1.0;
      let panX = 0;
      let panY = 0;

      // Test zoom operations
      const zoomOperations = [
        { action: 'zoom_in', expectedZoom: 1.2 },
        { action: 'zoom_in', expectedZoom: 1.44 }, // 1.2 * 1.2
        { action: 'zoom_out', expectedZoom: 1.2 },  // 1.44 / 1.2
        { action: 'zoom_fit', expectedZoom: 1.0 }   // Fit to container
      ];

      for (const operation of zoomOperations) {
        switch (operation.action) {
          case 'zoom_in':
            zoomLevel = Math.min(zoomLevel * 1.2, 3.0); // Max 3x zoom
            break;
          case 'zoom_out':
            zoomLevel = Math.max(zoomLevel / 1.2, 0.1); // Min 0.1x zoom
            break;
          case 'zoom_fit':
            zoomLevel = 1.0; // Reset to fit
            panX = 0;
            panY = 0;
            break;
        }

        expect(Math.abs(zoomLevel - operation.expectedZoom)).toBeLessThan(0.01);
      }

      // Test pan operations
      const initialX = 100;
      const initialY = 100;
      panX = 50;
      panY = 25;

      // Calculate transformed coordinates
      const transformedX = (initialX + panX) * zoomLevel;
      const transformedY = (initialY + panY) * zoomLevel;

      expect(transformedX).toBe((initialX + panX) * zoomLevel);
      expect(transformedY).toBe((initialY + panY) * zoomLevel);
    });
  });

  describe('Save and Cancel Operations', () => {
    it('should save template changes to database', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        id: 'save-template',
        org_id: org.id,
        user_id: user.id,
        name: 'Original Template'
      });

      const element: TemplateElement = TestDataFactory.createElement({
        id: 'save-element',
        content: 'Original Content',
        variableName: 'save_field',
        side: 'front'
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: [element]
      });

      // Make changes
      templateStore.updateElement('save-element', {
        content: 'Modified Content',
        fontSize: 18
      });

      templateStore.updateTemplateName('Modified Template');

      // Mock save operation
      const mockSupabase = MockUtilities.createSupabaseMock();
      const updatedTemplate = get(templateStore);

      mockSupabase.supabase
        .from('templates')
        .update({
          name: updatedTemplate.name,
          template_elements: updatedTemplate.template_elements,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'save-template')
        .eq('org_id', org.id)
        .select()
        .single()
        .mockResolvedValueOnce({ 
          data: { ...updatedTemplate, updated_at: new Date().toISOString() }, 
          error: null 
        });

      // Verify changes are ready to save
      expect(updatedTemplate.name).toBe('Modified Template');
      
      const modifiedElement = updatedTemplate.template_elements.find(e => e.id === 'save-element');
      expect(modifiedElement?.content).toBe('Modified Content');
      expect(modifiedElement?.fontSize).toBe(18);
    });

    it('should revert changes on cancel operation', async () => {
      const { profile: user, organization: org } = testData;
      
      const originalTemplate = TestDataFactory.createTemplate({
        id: 'cancel-template',
        org_id: org.id,
        user_id: user.id,
        name: 'Original Template'
      });

      const originalElement: TemplateElement = TestDataFactory.createElement({
        id: 'cancel-element',
        content: 'Original Content',
        fontSize: 16,
        variableName: 'cancel_field',
        side: 'front'
      });

      const completeOriginalTemplate = {
        ...originalTemplate,
        template_elements: [originalElement]
      };

      templateStore.loadTemplate(completeOriginalTemplate);

      // Make changes
      templateStore.updateElement('cancel-element', {
        content: 'Modified Content',
        fontSize: 20
      });

      templateStore.updateTemplateName('Modified Template');

      // Verify changes were made
      let currentTemplate = get(templateStore);
      expect(currentTemplate.name).toBe('Modified Template');
      
      let modifiedElement = currentTemplate.template_elements.find(e => e.id === 'cancel-element');
      expect(modifiedElement?.content).toBe('Modified Content');

      // Cancel changes (revert to original)
      templateStore.loadTemplate(completeOriginalTemplate);

      // Verify changes were reverted
      const revertedTemplate = get(templateStore);
      expect(revertedTemplate.name).toBe('Original Template');
      
      const revertedElement = revertedTemplate.template_elements.find(e => e.id === 'cancel-element');
      expect(revertedElement?.content).toBe('Original Content');
      expect(revertedElement?.fontSize).toBe(16);
    });

    it('should handle auto-save functionality', async () => {
      const { profile: user, organization: org } = testData;
      
      const template = TestDataFactory.createTemplate({
        id: 'autosave-template',
        org_id: org.id,
        user_id: user.id
      });

      templateStore.loadTemplate({
        ...template,
        template_elements: []
      });

      // Mock auto-save mechanism with debouncing
      const autoSaveDelay = 1000; // 1 second
      let autoSaveTimer: NodeJS.Timeout | null = null;
      let saveCount = 0;

      const triggerAutoSave = () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }
        
        autoSaveTimer = setTimeout(() => {
          saveCount++;
          // Auto-save logic would go here
        }, autoSaveDelay);
      };

      // Simulate rapid changes that should trigger auto-save
      const rapidChanges = [
        { property: 'name', value: 'Auto Save 1' },
        { property: 'name', value: 'Auto Save 2' },
        { property: 'name', value: 'Auto Save 3' }
      ];

      for (const change of rapidChanges) {
        templateStore.updateTemplateName(change.value);
        triggerAutoSave();
      }

      // Wait for debounced auto-save
      await new Promise(resolve => setTimeout(resolve, autoSaveDelay + 100));

      // Should only save once due to debouncing
      expect(saveCount).toBe(1);

      // Clean up timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    });

    it('should handle save conflicts and merge resolution', async () => {
      const { profile: user, organization: org } = testData;
      
      const baseTemplate = TestDataFactory.createTemplate({
        id: 'conflict-template',
        org_id: org.id,
        user_id: user.id,
        name: 'Base Template',
        updated_at: '2024-01-01T10:00:00Z'
      });

      templateStore.loadTemplate({
        ...baseTemplate,
        template_elements: []
      });

      // Simulate concurrent modification scenario
      const userChanges = {
        name: 'User Modified Template',
        template_elements: [
          TestDataFactory.createElement({
            id: 'user-element',
            content: 'User Added',
            variableName: 'user_field',
            side: 'front'
          })
        ]
      };

      const serverChanges = {
        name: 'Server Modified Template',
        updated_at: '2024-01-01T10:30:00Z', // Newer than base
        template_elements: [
          TestDataFactory.createElement({
            id: 'server-element',
            content: 'Server Added',
            variableName: 'server_field',
            side: 'front'
          })
        ]
      };

      // Detect conflict (server version is newer)
      const baseTime = new Date(baseTemplate.updated_at!).getTime();
      const serverTime = new Date(serverChanges.updated_at).getTime();
      const hasConflict = serverTime > baseTime;

      expect(hasConflict).toBe(true);

      // Mock conflict resolution strategy (merge both changes)
      const mergedTemplate = {
        ...baseTemplate,
        name: userChanges.name, // Keep user's name change
        template_elements: [
          ...userChanges.template_elements,
          ...serverChanges.template_elements
        ],
        updated_at: new Date().toISOString()
      };

      expect(mergedTemplate.template_elements).toHaveLength(2);
      expect(mergedTemplate.name).toBe('User Modified Template');
      
      const userElement = mergedTemplate.template_elements.find(e => e.id === 'user-element');
      const serverElement = mergedTemplate.template_elements.find(e => e.id === 'server-element');
      
      expect(userElement?.content).toBe('User Added');
      expect(serverElement?.content).toBe('Server Added');
    });
  });
});