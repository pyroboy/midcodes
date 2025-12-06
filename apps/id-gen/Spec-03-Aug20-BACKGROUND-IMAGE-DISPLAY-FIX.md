# Background Image Display Fix Specification

File: Spec-03-Aug20-BACKGROUND-IMAGE-DISPLAY-FIX.md
Status: Technical Specification
Priority: Medium
Complexity: 6/10 (Multi-component refactor with coordinate system changes)

---

## Step 1 – Requirement Extraction

Based on analysis of the template route and BackgroundThumbnail component, the system has an image display inconsistency:

### Current Behavior Issues:

1. Main canvas shows low-resolution preview - Not displaying selected image at full quality
2. Background thumbnail doesn't show full image - Only shows partial image with aspect ratio mismatch
3. Coordinate mismatch between main canvas and thumbnail crop positioning

### Required Technical Changes:

1. Main canvas must display full-resolution selected image with proper aspect ratio
2. Background thumbnail must show entire selected image with correct aspect ratio maintained
3. Coordinate synchronization between main canvas and thumbnail positioning systems

---

## Step 2 – Context Awareness

Technology Stack:

- SvelteKit 2.x + TypeScript - Component framework
- HTML5 Canvas - Image rendering and manipulation
- BackgroundGeometry utilities - Coordinate transformation functions
- File handling - Direct File objects and URL.createObjectURL for previews

Key Files:

- src/routes/templates/+page.svelte - Main template editing interface
- src/lib/components/BackgroundThumbnail.svelte - Thumbnail with crop overlay
- src/lib/utils/backgroundGeometry.ts - Coordinate calculation utilities

---

## Step 3 – Spec Expansion

### Data Flow Analysis

Current Flow:

```
User uploads image → File object → URL.createObjectURL() → Low-res preview
                   ↓
                   Background thumbnail shows partial crop view
```

Required Flow:

```
User uploads image → File object → Full-res canvas display + Full-image thumbnail
                   ↓
                   Synchronized crop positioning between main and thumbnail
```

### State Handling Requirements

1. Image Loading State:
   - Store original File object for processing
   - Generate full-resolution canvas preview
   - Create aspect-ratio-matched thumbnail display

2. Coordinate Synchronization:
   - Main canvas uses template dimensions for positioning
   - Thumbnail uses image aspect ratio for display
   - Position values must sync bidirectionally

### Function-Level Behavior Changes

#### BackgroundThumbnail.svelte Changes:

Current Issue (Line 136-169):

```typescript
// NEW LOGIC: Always draw the full image, thumbnail now matches image aspect ratio
const imageDims: Dims = {
	width: imageElement!.naturalWidth,
	height: imageElement!.naturalHeight
};

// Draw the full image scaled to fit the thumbnail (object-fit: contain)
```

Problem: Thumbnail dimensions are calculated correctly, but coordinate transformation still assumes square thumbnail.

Required Fix:

1. Update crop frame calculations to use actual thumbnail dimensions instead of THUMB_SIZE
2. Fix coordinate conversion in handleResize() function to use proper thumbnail bounds
3. Update thumbnail display logic to ensure full image is always visible

#### Template Route Changes:

Current Issue (Lines 875-909):

```typescript
// If we already know the required card dimensions, generate a card-fitted preview now
if (requiredPixelDimensions) {
    try {
        const position = side === 'front' ? frontBackgroundPosition : backBackgroundPosition;
        const fittedPreview = await generateCropPreviewUrl(
            file,
            requiredPixelDimensions,
            position
        );
```

Problem: Main canvas shows cropped preview instead of full-resolution original image.

Required Fix:

1. Separate preview generation - Main canvas shows full image, separate crop preview for final output
2. Implement dual-display system - Full image in main editor, cropped preview in small preview panel

### UI Implications

UI Minor Changes:

- Background thumbnail sizing adjustments for aspect ratio accuracy
- Main canvas display mode switching (full image vs. crop preview)
- Coordinate indicator synchronization between views

### UX Implications

UX Minor Changes:

- Users can see full image quality during editing
- More intuitive crop positioning with complete image context
- Consistent visual feedback between main and thumbnail views

### Database & API Calls

No database changes required - This is purely a frontend display and coordinate transformation issue.

### Dependencies

Existing Libraries:

- backgroundGeometry.ts utility functions (already available)
- Canvas API for image rendering
- File API for image loading

No new dependencies required.

---

## Step 4 – Implementation Guidance

### High-Level Code Strategy

#### Phase 1: BackgroundThumbnail Component Fix

File: src/lib/components/BackgroundThumbnail.svelte

1. Update thumbnail dimension calculations (Lines 39-66):
   - Ensure thumbnail always maintains selected image aspect ratio
   - Fix coordinate boundaries to use actual thumbnail dimensions

2. Fix crop frame coordinate system (Lines 567-570):

```typescript
// Replace hardcoded THUMB_SIZE with actual thumbnail dimensions
newX = Math.max(0, Math.min(thumbnailDimensions().width - newWidth, newX));
newY = Math.max(0, Math.min(thumbnailDimensions().height - newHeight, newY));
```

3. Update coordinate transformation in resize operations:
   - Use thumbnailDimensions() instead of THUMB_SIZE constant
   - Ensure crop frame calculations use proper image-to-thumbnail mapping

#### Phase 2: Main Canvas Display Enhancement

File: src/routes/templates/+page.svelte

1. Modify image preview generation (Lines 875-909):

```typescript
// Store original full-resolution image for main canvas
const fullResolutionUrl = URL.createObjectURL(file);

// Generate separate crop preview for final output validation
const cropPreviewUrl = await generateCropPreviewUrl(file, requiredPixelDimensions, position);
```

2. Implement dual-preview system:
   - Main editing area shows full-resolution original image
   - Small preview panel shows final cropped result
   - Both synchronized with same position values

#### Phase 3: Coordinate Synchronization

1. Ensure bidirectional position updates:
   - Main canvas position changes update thumbnail
   - Thumbnail crop changes update main canvas position
   - Both use same coordinate transformation functions

2. Validate coordinate transformation accuracy:
   - Test with various image aspect ratios
   - Verify crop frame accuracy across different template dimensions

### Best Practices

Error Handling:

- Fallback to square thumbnail if image aspect ratio calculation fails
- Handle image load errors gracefully with placeholder content
- Validate coordinate bounds to prevent negative or overflow values

Performance:

- Cache thumbnail canvas context to avoid repeated getContext calls
- Debounce coordinate update events during drag operations
- Use efficient image scaling for thumbnail generation

Maintainability:

- Extract coordinate transformation logic into reusable utility functions
- Add comprehensive logging for coordinate calculation debugging
- Maintain backward compatibility with existing position values

### Assumptions

1. Image files are valid and can be loaded by Canvas API
2. Browser supports required Canvas and File API features
3. Coordinate values remain within reasonable bounds for template dimensions
4. Performance is acceptable for typical ID card template image sizes

---

## Step 5 – Output Checklist

Checklist:

1. UI Changes (3/10) – Minor thumbnail sizing and main canvas display adjustments
2. UX Changes (2/10) – Improved visual feedback and image quality display
3. Data Handling (5/10) – Coordinate transformation refactor and dual-preview system
4. Function Logic (6/10) – Multi-component coordinate synchronization updates
5. ID/Key Consistency (1/10) – No ID/key changes required, only display logic

Implementation Priority:

1. Fix BackgroundThumbnail coordinate system (highest impact)
2. Implement dual-preview system for main canvas
3. Validate coordinate synchronization accuracy
4. Performance optimization and error handling

Estimated Complexity: 6/10 - Requires careful coordinate system refactoring across multiple components while maintaining existing functionality.
