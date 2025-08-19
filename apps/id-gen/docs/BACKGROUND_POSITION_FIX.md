# Background Position Coordination Fix

## Issue
The cropping bounding box in the thumbnail and the main template container were moving in opposite directions when the user dragged the background position controls.

## Root Cause
In `BackgroundThumbnail.svelte`, the background position calculation was incorrectly adding the mouse delta instead of subtracting it, causing the inverse movement.

## Changes Made

### 1. Fixed Position Calculation (Lines 238-239)
**Before:**
```typescript
x: startValues.x + dx / imageDisplayScale,
y: startValues.y + dy / imageDisplayScale,
```

**After:**
```typescript
x: startValues.x - dx / imageDisplayScale,
y: startValues.y - dy / imageDisplayScale,
```

### 2. Fixed Crop Frame Positioning (Lines 334-335)
**Before:**
```typescript
const cropX = centerX - scaledTemplateWidth / 2 - posOffsetX;
const cropY = centerY - scaledTemplateHeight / 2 - posOffsetY;
```

**After:**
```typescript
const cropX = centerX - scaledTemplateWidth / 2 + posOffsetX;
const cropY = centerY - scaledTemplateHeight / 2 + posOffsetY;
```

## Technical Details

### Why the Inversion Occurred
The coordinate system in the thumbnail was treating positive position values as moving the image in the opposite direction from what was visually expected. When a user dragged right, they expected the visible portion of the image to move right, but the system was moving it left.

### The Fix
By inverting the sign of the mouse delta, we ensure that:
- Dragging right → positive x movement → image moves right
- Dragging down → positive y movement → image moves down
- The crop frame position also needed to be inverted to maintain visual consistency

## Result
Now the thumbnail bounding box and the main template view move in perfect coordination, providing an intuitive user experience for background image positioning.

## Testing
Test by:
1. Loading a background image in the template editor
2. Using the thumbnail controls to move the background
3. Verifying both the thumbnail crop frame and main view move in the same direction
4. Checking that scaling operations work correctly
5. Ensuring debug information shows consistent position values
