# Refactoring Plan - Phase 1: Component Splitting

## Overview

This document outlines Phase 1 of the refactoring strategy to address maintenance issues in large, monolithic Svelte components. The focus is on breaking down the three most problematic files that exceed 1000+ lines.

## Critical Maintenance Issues Identified

### Current State Analysis

Based on line count analysis, these files present the highest maintenance burden:

1. **TemplateForm.svelte** - 1,290 lines ⚠️
2. **templates/+page.svelte** - 1,227 lines ⚠️
3. **BackgroundThumbnail.svelte** - 1,177 lines ⚠️

## Phase 1 Refactoring Strategy

### 1. TemplateForm.svelte Decomposition

**Current Issues:**

- Massive monolithic component handling all template editing functionality
- Mixed concerns: form logic, validation, UI rendering, event handling
- Difficult to debug and test individual features

**Proposed Component Split:**

```
src/lib/components/template-form/
├── TemplateForm.svelte              # Main container (orchestrator)
├── TemplateFormHeader.svelte        # Title, save/cancel actions
├── TemplateFormFields.svelte        # Form input fields
├── TemplateFormActions.svelte       # Action buttons and controls
└── TemplateFormValidation.ts        # Validation logic utilities
```

**Benefits:**

- Isolated responsibilities per component
- Easier testing of individual form sections
- Reusable validation logic
- Improved code readability and maintainability

---

### 2. templates/+page.svelte Decomposition

**Current Issues:**

- Entire template management page consolidated in single file
- Contains list view, editing interface, and state management
- Complex user interactions difficult to trace

**Proposed Component Split:**

```
src/lib/components/templates/
├── TemplateManagementPage.svelte    # Main page container
├── TemplateListView.svelte          # Template listing and filtering
├── TemplateEditModal.svelte         # Modal for template editing
└── TemplateActions.svelte           # Create, delete, duplicate actions
```

**Benefits:**

- Clear separation between viewing and editing functionality
- Modal editing can be reused in other contexts
- List view becomes reusable component
- Action buttons can be independently maintained

---

### 3. BackgroundThumbnail.svelte Decomposition

**Current Issues:**

- Complex background image handling logic in single component
- Image processing, cropping, and preview generation mixed together
- Performance bottlenecks difficult to isolate

**Proposed Component Split:**

```
src/lib/components/background/
├── BackgroundManager.svelte         # Main container component
├── ImageUploader.svelte             # File upload and drag-drop
├── ImageCropper.svelte              # Cropping interface and controls
└── ThumbnailPreview.svelte          # Preview generation and display
```

**Benefits:**

- Isolated image processing logic
- Cropper component reusable for other image needs
- Upload component can be standardized across app
- Preview logic separated from manipulation logic

## Implementation Guidelines

### Development Approach

1. **Create new component structure** without modifying existing files
2. **Implement one component split at a time** to maintain functionality
3. **Test each decomposed component** independently
4. **Gradually migrate functionality** from monolithic to split components
5. **Remove original files** only after full migration and testing

### File Organization Standards

- **Group related components** in subdirectories under `src/lib/components/`
- **Use descriptive naming** that reflects component responsibility
- **Extract shared utilities** to separate `.ts` files
- **Maintain consistent export patterns** for easy importing

### Testing Strategy

- **Unit test each decomposed component** individually
- **Integration test the composed functionality** to ensure no regression
- **Visual regression testing** for UI components
- **Performance testing** for image processing components

## Success Criteria

### Measurable Outcomes

- **Reduce file sizes** to under 300 lines per component
- **Improve component reusability** across different pages
- **Decrease debugging time** for template-related issues
- **Increase test coverage** through isolated component testing

### Quality Metrics

- **Code complexity reduction** measured by cyclomatic complexity
- **Maintainability index improvement**
- **Reduced time to implement new features** in affected areas
- **Fewer merge conflicts** in template-related development

## Timeline Estimate

### Recommended Sequence

1. **Week 1**: BackgroundThumbnail.svelte decomposition (least complex)
2. **Week 2**: TemplateForm.svelte decomposition (most critical)
3. **Week 3**: templates/+page.svelte decomposition (most complex)
4. **Week 4**: Testing, optimization, and documentation

### Risk Mitigation

- **Maintain parallel development** - old components remain functional during refactor
- **Feature flag approach** - gradually enable new components
- **Comprehensive testing** before removing legacy components
- **Rollback strategy** if issues arise during migration

## Next Steps

1. **Review and approve** this refactoring plan
2. **Set up development branch** for refactoring work
3. **Begin with BackgroundThumbnail.svelte** as proof of concept
4. **Create component templates** and establish patterns
5. **Document lessons learned** for Phase 2 planning

---

**Note**: This is Phase 1 only. Additional phases will address moderate maintenance issues (500-1000 lines) and supporting utility refactoring based on learnings from this phase.
