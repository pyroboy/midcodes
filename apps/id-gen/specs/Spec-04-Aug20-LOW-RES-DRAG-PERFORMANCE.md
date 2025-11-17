# Low-Resolution Drag Performance Specification

**File:** `Spec-04-Aug20-LOW-RES-DRAG-PERFORMANCE.md`  
**Status:** Technical Specification  
**Priority:** Medium  
**Complexity:** 7/10 (Canvas optimization with state management and performance considerations)

---

## Step 1 – Requirement Extraction

Based on the current image display system, there's a performance bottleneck during drag operations:

### Current Behavior Issues:
1. **Heavy rendering during drag operations** - Full-resolution images are redrawn on every mouse move
2. **Frame rate drops** during continuous dragging, especially with large images
3. **Browser lag** on lower-end devices when manipulating high-resolution backgrounds

### Required Technical Changes:
1. **Dynamic resolution switching** - Use low-resolution proxy images during active dragging
2. **Performance-optimized rendering** - Reduce canvas redraws and image processing during drag
3. **Seamless quality restoration** - Return to full-resolution immediately after drag completion
4. **Maintain coordinate accuracy** - Ensure position calculations remain precise regardless of display resolution

---

## Step 2 – Context Awareness

**Technology Stack:**
- **HTML5 Canvas** - Image rendering and manipulation with resolution scaling
- **SvelteKit reactivity** - State management for drag states and image switching
- **File API & Canvas API** - Image processing and resolution generation
- **BackgroundThumbnail.svelte** - Primary drag interface component

**Key Performance Targets:**
- **60fps during drag operations** for smooth user experience
- **< 100ms** resolution switching time (low-res ↔ high-res)
- **< 50MB memory** for low-resolution proxy images

---

## Step 3 – Spec Expansion

### **Data Flow Analysis**

**Current Flow:**
```
User starts drag → Full-res image redraws on every mousemove → Performance degradation
```

**Required Flow:**
```
User starts drag → Switch to low-res proxy → Fast redraws during drag → Restore full-res on drag end
```

### **State Handling Requirements**

1. **Drag State Management:**
   - Track active drag operations across all components
   - Maintain separate low-resolution and high-resolution image sources
   - Coordinate resolution switching between main canvas and thumbnail

2. **Image Resolution Management:**
   - Generate low-resolution proxy images (max 800px width/height)
   - Cache proxy images to avoid regeneration
   - Preserve aspect ratios across resolution switches

3. **Performance State Monitoring:**
   - Track frame rates during drag operations
   - Monitor memory usage for proxy image cache
   - Implement adaptive quality based on device performance

### **Function-Level Behavior Changes**

#### **BackgroundThumbnail.svelte Optimizations:**

**Current Issue:** Full-resolution image redraws on every mouse movement during drag.

**Required Changes:**

1. **Add drag state management:**
```typescript
let isDragging = $state(false);
let isPerformanceDrag = $state(false);
let lowResImageElement: HTMLImageElement | null = $state(null);
```

2. **Implement resolution switching logic:**
```typescript
function startPerformanceDrag() {
    isPerformanceDrag = true;
    generateLowResProxy();
    // Switch canvas to use low-res image
}

function endPerformanceDrag() {
    isPerformanceDrag = false;
    // Restore full-resolution image
    drawThumbnail(); // Redraw with high-res
}
```

3. **Optimize canvas drawing:**
```typescript
function drawThumbnail() {
    const activeImage = isPerformanceDrag ? lowResImageElement : imageElement;
    if (!activeImage) return;
    
    // Use lower-quality interpolation during drag
    const smoothing = !isPerformanceDrag;
    ctx.imageSmoothingEnabled = smoothing;
    
    // Reduced canvas operations for performance
    if (isPerformanceDrag) {
        ctx.imageSmoothingQuality = 'low';
    } else {
        ctx.imageSmoothingQuality = 'high';
    }
}
```

#### **Template Route Performance Enhancements:**

**Current Issue:** Background position updates trigger expensive crop preview regeneration during drag.

**Required Changes:**

1. **Debounce expensive operations:**
```typescript
let dragUpdateTimeout: number | null = null;
let isDraggingBackground = $state(false);

async function handleBackgroundPositionUpdate(position, side, isDragging = false) {
    // Update position immediately for responsiveness
    if (side === 'front') {
        frontBackgroundPosition = { ...position };
    } else {
        backBackgroundPosition = { ...position };
    }
    
    // Debounce expensive crop preview updates during drag
    if (isDragging) {
        isDraggingBackground = true;
        if (dragUpdateTimeout) clearTimeout(dragUpdateTimeout);
        dragUpdateTimeout = setTimeout(async () => {
            await updateCropPreviews();
            isDraggingBackground = false;
        }, 150); // Wait 150ms after drag stops
    } else {
        // Immediate update when not dragging
        await updateCropPreviews();
    }
}
```

2. **Conditional crop preview generation:**
```typescript
async function updateCropPreviews() {
    // Skip expensive operations during active drag
    if (isDraggingBackground) return;
    
    if (!requiredPixelDimensions) return;
    
    // Generate crop previews with performance consideration
    const quality = getOptimalQuality();
    
    // ... existing crop preview logic with quality parameter
}
```

#### **Canvas Optimization Utilities:**

**New Utility Functions:**

1. **Low-resolution image generator:**
```typescript
async function generateLowResProxy(
    originalImage: HTMLImageElement, 
    maxDimension: number = 800
): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Calculate scaled dimensions
    const scale = Math.min(maxDimension / originalImage.naturalWidth, 
                          maxDimension / originalImage.naturalHeight);
    
    canvas.width = originalImage.naturalWidth * scale;
    canvas.height = originalImage.naturalHeight * scale;
    
    // Use low-quality scaling for speed
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Convert to image element
    const lowResImage = new Image();
    lowResImage.src = canvas.toDataURL('image/jpeg', 0.8); // 80% quality for speed
    
    return new Promise((resolve) => {
        lowResImage.onload = () => resolve(lowResImage);
    });
}
```

2. **Performance monitoring:**
```typescript
class DragPerformanceMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private currentFPS = 60;
    
    startMonitoring() {
        this.trackFrame();
    }
    
    private trackFrame() {
        const now = performance.now();
        this.frameCount++;
        
        if (now - this.lastTime >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            
            // Adaptive quality based on performance
            if (this.currentFPS < 30) {
                this.suggestLowerQuality();
            }
        }
        
        if (this.isMonitoring) {
            requestAnimationFrame(() => this.trackFrame());
        }
    }
}
```

### **UI Implications**

**UI Minor Changes (2/10):**
- Temporary quality reduction visible during drag operations
- Possible brief flicker during resolution switching (< 50ms)
- Optional performance indicator for debugging

### **UX Implications**

**UX Major Improvement (8/10):**
- **Significantly smoother drag operations** - 60fps vs previous choppy experience
- **Reduced input lag** during position adjustments
- **Better responsiveness** on lower-end devices
- **Seamless quality restoration** maintains final output quality

### **Database & API Calls**

**No database changes required** - This is purely a frontend performance optimization.

### **Dependencies**

**Existing APIs:**
- HTML5 Canvas API (already in use)
- Performance API for monitoring
- requestAnimationFrame for smooth updates

**New Dependencies:**
- None - implementation uses existing browser APIs

---

## Step 4 – Implementation Guidance

### **High-Level Code Strategy**

#### **Phase 1: Image Proxy Generation System**

**File:** `src/lib/utils/imageProxy.ts` (new)

```typescript
export class ImageProxyManager {
    private proxyCache = new Map<string, HTMLImageElement>();
    private maxProxyDimension = 800;
    
    async getOrCreateProxy(
        originalImage: HTMLImageElement, 
        cacheKey: string
    ): Promise<HTMLImageElement> {
        if (this.proxyCache.has(cacheKey)) {
            return this.proxyCache.get(cacheKey)!;
        }
        
        const proxy = await this.generateProxy(originalImage);
        this.proxyCache.set(cacheKey, proxy);
        return proxy;
    }
    
    private async generateProxy(image: HTMLImageElement): Promise<HTMLImageElement> {
        // Implementation from utility functions above
    }
}
```

#### **Phase 2: Drag State Management**

**File:** `src/lib/components/BackgroundThumbnail.svelte`

**Key Changes:**
1. **Add performance state variables**
2. **Implement drag start/end handlers with resolution switching**
3. **Modify drawThumbnail() to use appropriate resolution**
4. **Add performance monitoring during drag operations**

#### **Phase 3: Debounced Updates**

**File:** `src/routes/templates/+page.svelte`

**Key Changes:**
1. **Modify background position update handler** to include drag state
2. **Implement debounced crop preview generation**
3. **Add drag state propagation to child components**

#### **Phase 4: Canvas Rendering Optimization**

**Optimization Techniques:**
1. **Reduced canvas operations** during drag (disable anti-aliasing, lower smoothing quality)
2. **Selective redraws** - only update changed regions when possible
3. **Memory management** - cleanup proxy images when no longer needed

### **Best Practices**

**Performance:**
- **Monitor frame rates** and adapt quality dynamically
- **Limit proxy image cache size** to prevent memory leaks
- **Use requestAnimationFrame** for smooth updates
- **Implement progressive quality** - start with lowest quality, improve if performance allows

**Memory Management:**
- **Cleanup proxy images** when component unmounts
- **Limit cache size** to prevent memory exhaustion
- **Use weak references** where possible for cache entries

**User Experience:**
- **Minimize visible quality changes** during transitions
- **Provide feedback** for performance-limited devices
- **Graceful degradation** - fall back to current behavior if proxy generation fails

### **Assumptions**

1. **Modern browsers** support Canvas API and Performance API
2. **Reasonable image sizes** - proxy generation assumes images < 50MB
3. **Available memory** for maintaining proxy cache (estimated 10-20MB max)
4. **60fps target** is achievable on target devices with optimization

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (2/10)** – Minor visual quality reduction during drag, brief resolution switching
2. **UX Changes (8/10)** – Major improvement in drag smoothness and responsiveness
3. **Data Handling (5/10)** – Image proxy generation and caching system implementation
4. **Function Logic (7/10)** – Drag state management, resolution switching, and performance monitoring
5. **ID/Key Consistency (1/10)** – No ID changes required, only performance optimizations

**Implementation Priority:**
1. **Image proxy generation system** (foundation for performance gains)
2. **Drag state management in BackgroundThumbnail** (immediate user impact)
3. **Debounced updates for crop previews** (reduce expensive operations)
4. **Performance monitoring and adaptive quality** (optimization and debugging)

**Performance Targets:**
- **60fps** sustained during drag operations
- **< 100ms** resolution switching time
- **< 50MB** total memory overhead for proxy system
- **Smooth user experience** across devices from mobile to desktop

**Estimated Complexity:** 7/10 - Requires careful performance optimization, state management, and canvas manipulation while maintaining existing functionality and coordinate accuracy.